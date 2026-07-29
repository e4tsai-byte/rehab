"""Rep counting: SEATED -> STANDING -> SEATED cycle detection from the
pipeline's per-frame `FrameOutput` stream, with the discard rules and
failed-stand tracking from the design doc's Premise 1.

Pure logic -- no camera/model I/O, consumes only `FrameOutput` values
already produced by `PoseTrackingPipeline.process_frame`, so it can be
driven frame-by-frame from a synthetic FrameOutput sequence in tests, the
same way state_machine.py's sequence tests drive `StateClassifier`.
"""

from dataclasses import dataclass
from typing import List, Optional

from .. import config
from ..types import FrameOutput, State
from . import velocity


@dataclass(frozen=True)
class RepRecord:
    """One counted rep, per the design doc's Data Model (brief section
    4.4's Level 2 schema). `range_of_motion`/`min_angle`/`max_angle` are
    scoped to the concentric phase only (SEATED-exit to STANDING-entry),
    not the full rep cycle -- a deliberate scope choice, see the design
    doc's Premise 1. `form_flags` is always empty in this slice -- its
    trigger logic is deferred, not designed here (design doc's Data
    Model section)."""

    rep_index: int
    concentric_time: float
    peak_velocity: float
    mean_velocity: float
    range_of_motion: float
    min_angle: float
    max_angle: float
    form_flags: List[str]
    timestamp: float


class RepCounter:
    """Consumes one `FrameOutput` at a time via `process()`. Tracks phase
    across calls the same way `StateClassifier` tracks `_last_state` --
    this is inherently a cross-frame, stateful component, not a pure
    function of a single frame.

    Phases:
        RESTING     -- not currently mid-rep-attempt; watching for a
                        SEATED-exit event (the previous frame was SEATED,
                        this one isn't).
        CONCENTRIC  -- between SEATED-exit and either reaching STANDING or
                        returning to SEATED without ever reaching it
                        (a failed-stand attempt).
        RETURN      -- STANDING was reached; the concentric-phase window
                        is fixed, now just waiting for a return to SEATED
                        to finalize (count or discard) the rep.
    """

    def __init__(self):
        self._prev_state: Optional[State] = None
        self._phase: str = "RESTING"
        self._concentric_frames: List[FrameOutput] = []
        self._rep_count = 0
        self._failed_stand_count = 0
        self._next_rep_index = 1

    @property
    def rep_count(self) -> int:
        return self._rep_count

    @property
    def failed_stand_count(self) -> int:
        return self._failed_stand_count

    def process(self, frame: FrameOutput) -> Optional[RepRecord]:
        """Feed one frame in, in timestamp order. Returns a `RepRecord` if
        this frame completed a countable rep; otherwise None (nothing
        happened yet, a failed-stand attempt was logged, or a completed
        cycle was discarded per Premise 1's discard rules)."""
        state = frame.state
        result: Optional[RepRecord] = None

        if self._phase == "RESTING":
            if self._prev_state is State.SEATED and state is not State.SEATED:
                # SEATED-exit: a rep starts on leaving SEATED (Premise 1).
                # Endpoint-sampling convention (Premise 2): sampled at the
                # first frame classified into the new (non-SEATED) state.
                self._phase = "CONCENTRIC"
                self._concentric_frames = [frame]

        elif self._phase == "CONCENTRIC":
            self._concentric_frames.append(frame)
            if state is State.STANDING:
                # STANDING-entry, sampled the same way: first frame
                # classified STANDING. Concentric-phase window is now
                # fixed; later frames don't affect its data.
                self._phase = "RETURN"
            elif state is State.SEATED:
                # Left SEATED, never reached STANDING before returning --
                # a failed-stand attempt, not a rep (Premise 1). Not
                # subject to the concentric-phase discard rules, which
                # only govern whether a *completed* cycle counts as a
                # logged rep.
                self._failed_stand_count += 1
                self._phase = "RESTING"
                self._concentric_frames = []

        elif self._phase == "RETURN":
            if state is State.SEATED:
                result = self._finalize_rep()
                self._phase = "RESTING"
                self._concentric_frames = []
            # Any other state (TRANSITIONING/STANDING/UNKNOWN) while
            # waiting to return to SEATED doesn't touch the already-fixed
            # concentric-phase window -- a return-phase discard rule is
            # explicitly deferred, not needed for this slice (design doc,
            # Premise 1).

        self._prev_state = state
        return result

    def _finalize_rep(self) -> Optional[RepRecord]:
        frames = self._concentric_frames

        # Discard rule (a): any UNKNOWN frame during the concentric phase,
        # full stop -- no single-frame exemption (design doc, Round 2 fix:
        # every UNKNOWN frame unconditionally flushes the smoothing
        # buffer in the real pipeline, regardless of side_used).
        if any(f.state is State.UNKNOWN for f in frames):
            return None

        seated_exit, standing_entry = frames[0], frames[-1]
        concentric_time = standing_entry.timestamp - seated_exit.timestamp

        # Discard rule (b), checked before any division (design doc,
        # Premise 2 "Ordering"): state_machine.py has no minimum-frame
        # hysteresis on transitions, so concentric_time could be zero (or
        # implausibly small) without this guard running first.
        if concentric_time < config.MIN_CONCENTRIC_DURATION_S:
            return None

        # No UNKNOWN frames survived the check above, so every frame here
        # has non-None hip_height_norm/knee_angle_smoothed (types.py:
        # those fields are only None when state is UNKNOWN).
        heights = [f.hip_height_norm for f in frames]
        knee_angles = [f.knee_angle_smoothed for f in frames]
        min_angle, max_angle, rom = velocity.rom_stats(knee_angles)

        rep = RepRecord(
            rep_index=self._next_rep_index,
            concentric_time=concentric_time,
            peak_velocity=velocity.peak_velocity(heights),
            mean_velocity=velocity.mean_velocity(heights[0], heights[-1], concentric_time),
            range_of_motion=rom,
            min_angle=min_angle,
            max_angle=max_angle,
            form_flags=[],
            timestamp=standing_entry.timestamp,
        )
        self._next_rep_index += 1
        self._rep_count += 1
        return rep
