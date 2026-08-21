from ..rehab.shoulder_flexion import ShoulderFlexionTracker
from ..rehab.types import FormFlag, RehabPhase
"""The always-on background camera+pipeline loop, the idle/live/lost
mapping (`TrackingHub`), and the fixed-5-rep per-trial controller
(`TrialController` / `TrialManager`).

Reuses `PoseTrackingPipeline` and `PoseCapture` completely unmodified, and
reuses `autoregulation.rep_counter.RepCounter` completely unmodified for its
SEATED->STANDING->SEATED cycle detection and discard rules (any-UNKNOWN-
frame-during-concentric-phase, and the implausible-duration guard). What's
new here is a thin wrapper that (a) starts a fresh `RepCounter` on the
trial-start cue rather than counting open-endedly, (b) stops feeding it once
5 reps have landed (or the trial is otherwise settled), and (c) derives
rep timing (`repMs`/`elapsedMs`) from wall/frame-clock deltas since the cue,
which `RepCounter` itself has no notion of.

`RepRecord.peak_velocity` / `mean_velocity` / `range_of_motion` (computed
internally by `RepCounter` via `autoregulation.velocity`, since that's part
of `RepRecord`'s existing schema) are deliberately never read or forwarded
here -- this build's `TrialEvent` schema has no field for them, and per the
task's Tier-1-only scope, no velocity/fatigue-stop concept appears anywhere
in this server. `autoregulation.fatigue_stop` is never imported.

The camera loop runs in a plain OS thread (`PoseCapture.read()` is a
blocking OpenCV + MediaPipe call), not an asyncio task. WebSocket sends have
to happen on the asyncio event loop, so every notification from the capture
thread hops over via `loop.call_soon_threadsafe`.
"""

import asyncio
import datetime
import threading

import cv2
from typing import Callable, Dict, List, Optional, Set

from ..autoregulation.rep_counter import RepCounter
from ..capture import CameraUnavailableError, ModelLoadError, PoseCapture
from ..overlay import draw_skeleton, draw_state_label
from ..pipeline import PoseTrackingPipeline
from ..types import PoseObservation, Landmark, Side,  FrameOutput, State

PRESCRIBED_REPS = 5

# How long a continuous run of UNKNOWN frames has to last, mid-trial, before
# it's treated as a real void rather than a momentary blip (a hand crossing
# the torso, a single dropped/occluded frame, one bad inference). Neither
# the frontend contract nor the pose-pipeline design doc specifies this --
# it's a builder judgment call, not derived from data or spec. Flagged in
# the builder's report.
VOID_UNKNOWN_GRACE_S = 2.0


def _now_iso() -> str:
    return datetime.datetime.now().isoformat(timespec="seconds")


class TrackingHub:
    """Always-on `/ws/tracking` state: maps the pipeline's per-frame `State`
    (SEATED/STANDING/TRANSITIONING/UNKNOWN) to the frontend's `TrackingState`
    ('idle' | 'live' | 'lost'), independent of whether a trial is active.

    Mapping decision (see builder's report):
      - 'idle'  -- no person has ever been successfully tracked since server
                   startup. Chosen over "no trial has ever started" because
                   the camera loop runs continuously and independently of
                   trial state (per PRODUCT.md/DESIGN.md: the facilitator
                   needs to see tracking is alive *between* trials too), so
                   tying 'idle' to trial existence would contradict that.
      - 'live'  -- the current frame classified as SEATED, STANDING, or
                   TRANSITIONING (a person is tracked with usable geometry),
                   once a track has ever been established.
      - 'lost'  -- the current frame is UNKNOWN (no person / no usable side /
                   degenerate geometry), once a track has ever been
                   established. Never reverts to 'idle' after that point.
    """

    def __init__(self, on_change: Optional[Callable[[str], None]] = None):
        self._established = False
        self._state = "idle"
        self._on_change = on_change
        self._subscribers: Set[asyncio.Queue] = set()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    @property
    def state(self) -> str:
        return self._state

    def on_frame_state(self, state: State) -> None:
        """Called from the background capture thread for every frame."""
        if state is State.UNKNOWN:
            mapped = "lost" if self._established else "idle"
        else:
            self._established = True
            mapped = "live"

        if mapped == self._state:
            return
        self._state = mapped
        self._broadcast({"state": mapped})
        if self._on_change is not None:
            self._on_change(mapped)

    def subscribe(self) -> asyncio.Queue:
        """Called from the event-loop thread (inside the WS handler)."""
        q: asyncio.Queue = asyncio.Queue()
        q.put_nowait({"state": self._state})  # replay current state on connect
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    def _broadcast(self, message: Dict) -> None:
        if self._loop is None:
            return
        for q in list(self._subscribers):
            self._loop.call_soon_threadsafe(q.put_nowait, message)



class TrialController:
    """Rehabilitation Trial Controller: manages live kinematics, compensation checks,
    and 5s-5s-5s cadence for Right Arm Forward Flexion."""

    def __init__(
        self,
        trial_id: str,
        session_id: str,
        participant_id: str,
        cue_timestamp: float,
        on_settled: Callable[["TrialController"], None],
        target_reps: int = 10,
    ):
        self.trial_id = trial_id
        self.session_id = session_id
        self.participant_id = participant_id
        self.started_iso = _now_iso()

        self._cue_timestamp = cue_timestamp
        self._on_settled = on_settled
        self.target_reps = target_reps

        self._rehab_tracker = ShoulderFlexionTracker(side=Side.RIGHT, target_reps=target_reps)
        self.rehab_reps: List[Dict] = []
        self._unknown_run_start: Optional[float] = None
        self._seen_any_valid_frame = False

        self.settled = False
        self.outcome: Optional[Dict] = None

        self._lock = threading.Lock()
        self._subscribers: Set[asyncio.Queue] = set()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    def _emit(self, event: Dict) -> None:
        if self._loop is None:
            return
        for q in list(self._subscribers):
            self._loop.call_soon_threadsafe(q.put_nowait, event)

    def _close_ws(self) -> None:
        if self._loop is None:
            return
        for q in list(self._subscribers):
            self._loop.call_soon_threadsafe(q.put_nowait, None)

    def on_tracking_state(self, mapped_state: str) -> None:
        with self._lock:
            if self.settled:
                return
        self._emit({"type": "tracking", "state": mapped_state})

    def process_observations(self, observations: List[PoseObservation], timestamp: float) -> None:
        with self._lock:
            if self.settled:
                return

            obs = observations[0] if observations else None
            if obs is None:
                if self._unknown_run_start is None:
                    self._unknown_run_start = timestamp
                elif timestamp - self._unknown_run_start >= VOID_UNKNOWN_GRACE_S:
                    self._settle_void_locked()
                    return
            else:
                self._unknown_run_start = None
                self._seen_any_valid_frame = True

            new_rep, live_state = self._rehab_tracker.process(obs, timestamp)
            
            live_event = {
                "type": "rehab_live",
                "elevation": live_state.current_elevation_deg,
                "phase": live_state.phase.value,
                "holdRemaining": live_state.hold_seconds_remaining,
                "concentricElapsed": live_state.concentric_elapsed_s,
                "eccentricElapsed": live_state.eccentric_elapsed_s,
                "isTargetZone": live_state.is_target_zone,
                "flags": live_state.active_flags,
                "repsCompleted": live_state.reps_completed,
                "targetReps": live_state.target_reps,
            }

            rep_event = None
            settle_now = False

            if new_rep is not None:
                rep_dict = {
                    "index": new_rep.rep_index,
                    "concentricDuration": new_rep.concentric_duration_s,
                    "holdDuration": new_rep.hold_duration_s,
                    "eccentricDuration": new_rep.eccentric_duration_s,
                    "peakElevation": new_rep.peak_elevation_deg,
                    "flags": new_rep.form_flags,
                    "isClean": new_rep.is_clean,
                }
                self.rehab_reps.append(rep_dict)
                rep_event = {"type": "rehab_rep", "rep": rep_dict}
                
                if len(self.rehab_reps) >= self.target_reps:
                    settle_now = True
                    self._settle_complete_locked()

        # Emit events outside lock
        self._emit(live_event)
        if rep_event is not None:
            self._emit(rep_event)
        if settle_now:
            self._finish()

    def process_frame(self, frame: FrameOutput) -> None:
        pass  # Deprecated in favor of process_observations

    def _settle_complete_locked(self) -> None:
        self.settled = True
        self.outcome = {
            "kind": "complete",
            "repsCompleted": len(self.rehab_reps),
            "rehabReps": list(self.rehab_reps),
        }

    def _settle_void_locked(self) -> None:
        self.settled = True
        reason = "tracking_lost" if self._seen_any_valid_frame else "out_of_frame"
        self.outcome = {"kind": "void", "reason": reason, "repsCompleted": len(self.rehab_reps)}
        self._emit({"type": "void", "reason": reason})
        self._finish()

    def end(self) -> Dict:
        with self._lock:
            if self.settled:
                return self.outcome
            self.settled = True
            self.outcome = {
                "kind": "incomplete",
                "repsCompleted": len(self.rehab_reps),
                "rehabReps": list(self.rehab_reps),
            }
        self._finish()
        return self.outcome

    def abort(self, reason: str) -> Dict:
        with self._lock:
            if self.settled:
                return self.outcome
            self.settled = True
            self.outcome = {
                "kind": "aborted",
                "reason": reason,
                "repsCompleted": len(self.rehab_reps),
            }
        self._finish()
        return self.outcome

    def _finish(self) -> None:
        self._emit({"type": "settled", "outcome": self.outcome})
        self._close_ws()
        self._on_settled(self)


class TrialManager:
    def __init__(self):
        self._trials: Dict[str, TrialController] = {}
        self._active: Optional[TrialController] = None
        self._seq = 0
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def start(
        self, session_id: str, participant_id: str, cue_timestamp: float, on_settled: Callable[[TrialController], None]
    ) -> TrialController:
        self._seq += 1
        trial_id = f"T-{self._seq}"
        controller = TrialController(trial_id, session_id, participant_id, cue_timestamp, on_settled)
        controller.bind_loop(self._loop)
        self._trials[trial_id] = controller
        self._active = controller
        return controller

    def get(self, trial_id: str) -> Optional[TrialController]:
        return self._trials.get(trial_id)

    def process_observations(self, observations: List[PoseObservation], timestamp: float) -> None:
        active = self._active
        if active is not None and not active.settled:
            active.process_observations(observations, timestamp)

    def process_frame(self, frame: FrameOutput) -> None:
        active = self._active
        if active is not None and not active.settled:
            active.process_frame(frame)

    def on_tracking_state(self, mapped_state: str) -> None:
        active = self._active
        if active is not None and not active.settled:
            active.on_tracking_state(mapped_state)


class CaptureRunner:
    """Owns the background thread that continuously drives
    `PoseCapture.read()` -> `PoseTrackingPipeline.process_frame()` from
    server startup, independent of trial state, feeding both `TrackingHub`
    (always-on) and `TrialManager` (only acts while a trial is active)."""

    def __init__(self, tracking_hub: TrackingHub, trial_manager: TrialManager):
        self._tracking_hub = tracking_hub
        self._trial_manager = trial_manager
        self._thread: Optional[threading.Thread] = None
        self._stop = threading.Event()
        self.startup_error: Optional[str] = None
        self.latest_frame_timestamp: float = 0.0
        # Live-preview only: the most recent frame, JPEG-encoded (with the
        # skeleton overlay already drawn) in memory. Never written to disk,
        # never kept beyond the single latest frame -- overwritten every
        # loop iteration; the lock guards the read in /video's streaming
        # endpoint against a torn write from this background thread.
        self._latest_jpeg: Optional[bytes] = None
        self._latest_jpeg_lock = threading.Lock()

    def get_latest_jpeg(self) -> Optional[bytes]:
        with self._latest_jpeg_lock:
            return self._latest_jpeg

    def start(self) -> None:
        self._thread = threading.Thread(target=self._run, name="pose-capture-loop", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def _run(self) -> None:
        try:
            capture = PoseCapture()
        except (CameraUnavailableError, ModelLoadError) as exc:
            # No retry loop -- time-boxed for the hackathon demo. The rest of
            # the server (REST/records/roster) keeps working without a
            # camera; `/ws/tracking` just stays 'idle' forever since no
            # frame ever arrives, and a trial started with no camera present
            # will never auto-settle or void (facilitator must manually
            # end/abort it). Flagged in the builder's report.
            self.startup_error = str(exc)
            print(f"[warn] pose capture unavailable, tracking will stay idle: {exc}")
            return

        pipeline = PoseTrackingPipeline()
        # Temporary diagnostic: log every raw state-machine transition
        # (SEATED/STANDING/TRANSITIONING/UNKNOWN), not just the coarser
        # idle/live/lost mapping -- lets a live server session be debugged
        # from the log instead of guessing from what the UI shows.
        last_logged_state = None
        try:
            while not self._stop.is_set():
                frame_bgr, observations, timestamp = capture.read()
                if frame_bgr is None:
                    break
                self.latest_frame_timestamp = timestamp
                output = pipeline.process_frame(observations, timestamp)
                if output.state.value != last_logged_state:
                    print(
                        f"[state] t={timestamp:7.2f}s state={output.state.value:<13} "
                        f"side={output.side_used} knee={output.knee_angle_smoothed} "
                        f"hip_height={output.hip_height_norm}",
                        flush=True,
                    )
                    last_logged_state = output.state.value
                self._tracking_hub.on_frame_state(output.state)
                self._trial_manager.process_observations(observations, timestamp)

                preview = frame_bgr.copy()
                if observations:
                    draw_skeleton(preview, observations[0].landmarks_2d)
                draw_state_label(preview, output.state.value)
                ok, buf = cv2.imencode(".jpg", preview, [cv2.IMWRITE_JPEG_QUALITY, 70])
                if ok:
                    with self._latest_jpeg_lock:
                        self._latest_jpeg = buf.tobytes()
        finally:
            capture.close()
