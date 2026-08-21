"""Right Arm Forward Flexion Rehabilitation Tracker.

Implements the 5s ascent -> 5s isometric hold (90 deg) -> 5s descent state machine,
along with real-time compensatory form checks (Shoulder Shrug, Torso Lean, Bent Elbow,
and Rushed Cadence).
"""

from typing import List, Optional, Set, Tuple

from .. import config, measurements
from ..smoothing import MedianBuffer
from ..types import PoseObservation, Side
from .types import FormFlag, RehabLiveState, RehabPhase, RehabRepRecord


class ShoulderFlexionTracker:
    def __init__(self, side: Side = Side.RIGHT, target_reps: int = 10):
        self.side = side
        self.target_reps = target_reps
        
        self._angle_buffer = MedianBuffer(config.SMOOTHING_WINDOW_FRAMES)
        self._phase = RehabPhase.RESTING
        
        self._rep_count = 0
        self._next_rep_index = 1
        
        # Timing trackers
        self._phase_start_t: float = 0.0
        self._concentric_start_t: float = 0.0
        self._concentric_duration_s: float = 0.0
        self._hold_start_t: float = 0.0
        self._hold_duration_s: float = 0.0
        self._eccentric_start_t: float = 0.0
        self._eccentric_duration_s: float = 0.0
        
        # Flags collected during the current rep
        self._rep_flags: Set[str] = set()
        self._peak_angle_deg: float = 0.0

    @property
    def rep_count(self) -> int:
        return self._rep_count

    @property
    def phase(self) -> RehabPhase:
        return self._phase

    def reset(self) -> None:
        self._angle_buffer.reset()
        self._phase = RehabPhase.RESTING
        self._rep_flags.clear()
        self._peak_angle_deg = 0.0

    def process(
        self, observation: Optional[PoseObservation], timestamp: float
    ) -> Tuple[Optional[RehabRepRecord], RehabLiveState]:
        """Process one frame observation and timestamp.
        
        Returns:
            (rep_record, live_state): rep_record is non-None when a rep is completed.
        """
        if observation is None:
            # No person detected; return current state with 0 elevation
            return None, RehabLiveState(
                current_elevation_deg=0.0,
                phase=self._phase,
                hold_seconds_remaining=0.0,
                concentric_elapsed_s=0.0,
                eccentric_elapsed_s=0.0,
                active_flags=[],
                reps_completed=self._rep_count,
                target_reps=self.target_reps,
                target_elevation_deg=config.SHOULDER_TARGET_ANGLE_NOMINAL,
                is_target_zone=False,
            )

        # 1. Compute raw 3D elevation angle and smooth it
        raw_angle = measurements.shoulder_flexion_3d_deg(observation.world_landmarks, self.side)
        if raw_angle is None:
            raw_angle = 0.0
        smoothed_angle = self._angle_buffer.push(raw_angle)
        
        # 2. Evaluate active compensation flags this frame
        current_frame_flags: List[str] = []
        
        # A. Elbow bent check
        elbow_angle = measurements.elbow_extension_deg(observation.landmarks_2d, self.side)
        if elbow_angle is not None and elbow_angle < config.COMPENSATION_ELBOW_MIN_DEG:
            current_frame_flags.append(FormFlag.ELBOW_BENT.value)
            
        # B. Shoulder hike check
        hike_ratio = measurements.shoulder_hike_ratio(observation.landmarks_2d, self.side)
        if hike_ratio is not None and hike_ratio > config.COMPENSATION_SHOULDER_HIKE_RATIO:
            current_frame_flags.append(FormFlag.SHOULDER_HIKE.value)
            
        # C. Torso lean check
        torso_tilt = measurements.torso_tilt_deg(observation.landmarks_2d)
        if torso_tilt is not None and torso_tilt > config.COMPENSATION_TORSO_LEAN_DEG:
            current_frame_flags.append(FormFlag.TORSO_LEAN.value)

        # Accumulate flags during active movement (ASCENDING, HOLDING, DESCENDING)
        if self._phase != RehabPhase.RESTING:
            for flag in current_frame_flags:
                self._rep_flags.add(flag)
            if smoothed_angle > self._peak_angle_deg:
                self._peak_angle_deg = smoothed_angle

        # 3. State Machine Transitions
        completed_rep: Optional[RehabRepRecord] = None
        is_target_zone = (config.SHOULDER_TARGET_HOLD_ENTER <= smoothed_angle <= config.SHOULDER_TARGET_HOLD_MAX)
        
        hold_remaining_s = 0.0
        concentric_elapsed = 0.0
        eccentric_elapsed = 0.0

        if self._phase == RehabPhase.RESTING:
            if smoothed_angle > config.SHOULDER_RESTING_EXIT:
                # Arm leaves hip -> start concentric phase
                self._phase = RehabPhase.ASCENDING
                self._concentric_start_t = timestamp
                self._rep_flags.clear()
                self._peak_angle_deg = smoothed_angle

        elif self._phase == RehabPhase.ASCENDING:
            concentric_elapsed = max(0.0, timestamp - self._concentric_start_t)
            
            if smoothed_angle >= config.SHOULDER_TARGET_HOLD_ENTER:
                # Reached 90 deg target zone -> enter HOLDING
                self._concentric_duration_s = concentric_elapsed
                if self._concentric_duration_s < config.CADENCE_CONCENTRIC_MIN_S:
                    self._rep_flags.add(FormFlag.RUSHED_CONCENTRIC.value)
                    
                self._phase = RehabPhase.HOLDING
                self._hold_start_t = timestamp
                hold_remaining_s = config.CADENCE_HOLD_TARGET_S
            elif smoothed_angle < config.SHOULDER_RESTING_ENTER:
                # False start / returned down before reaching target
                self._phase = RehabPhase.RESTING

        elif self._phase == RehabPhase.HOLDING:
            hold_elapsed = max(0.0, timestamp - self._hold_start_t)
            hold_remaining_s = max(0.0, config.CADENCE_HOLD_TARGET_S - hold_elapsed)
            concentric_elapsed = self._concentric_duration_s
            
            if hold_elapsed >= config.CADENCE_HOLD_TARGET_S:
                # Full 5s hold completed successfully -> begin controlled descent
                self._hold_duration_s = hold_elapsed
                self._phase = RehabPhase.DESCENDING
                self._eccentric_start_t = timestamp
                hold_remaining_s = 0.0
            elif smoothed_angle < config.SHOULDER_TARGET_HOLD_EXIT:
                # Arm dropped prematurely before full hold duration
                self._hold_duration_s = hold_elapsed
                if hold_elapsed < config.CADENCE_HOLD_MIN_S:
                    self._rep_flags.add(FormFlag.INCOMPLETE_HOLD.value)
                self._phase = RehabPhase.DESCENDING
                self._eccentric_start_t = timestamp
                hold_remaining_s = 0.0

        elif self._phase == RehabPhase.DESCENDING:
            eccentric_elapsed = max(0.0, timestamp - self._eccentric_start_t)
            concentric_elapsed = self._concentric_duration_s
            
            is_resting = smoothed_angle <= config.SHOULDER_RESTING_ENTER
            is_stabilized_bottom = eccentric_elapsed >= 4.0 and smoothed_angle <= (config.SHOULDER_RESTING_ENTER + 8.0)
            
            if is_resting or is_stabilized_bottom:
                # Returned to resting hip position -> finalize rep
                self._eccentric_duration_s = eccentric_elapsed
                if self._eccentric_duration_s < config.CADENCE_ECCENTRIC_MIN_S:
                    self._rep_flags.add(FormFlag.RUSHED_ECCENTRIC.value)
                    
                # A rep counts if it reached the target hold zone
                if self._peak_angle_deg >= config.SHOULDER_TARGET_HOLD_ENTER:
                    completed_rep = RehabRepRecord(
                        rep_index=self._next_rep_index,
                        concentric_duration_s=round(self._concentric_duration_s, 2),
                        hold_duration_s=round(self._hold_duration_s, 2),
                        eccentric_duration_s=round(self._eccentric_duration_s, 2),
                        peak_elevation_deg=round(self._peak_angle_deg, 1),
                        form_flags=sorted(list(self._rep_flags)),
                        is_clean=(len(self._rep_flags) == 0),
                        timestamp=timestamp,
                    )
                    self._next_rep_index += 1
                    self._rep_count += 1
                    
                self._phase = RehabPhase.RESTING
                self._rep_flags.clear()
                self._peak_angle_deg = 0.0

        live_state = RehabLiveState(
            current_elevation_deg=round(smoothed_angle, 1),
            phase=self._phase,
            hold_seconds_remaining=round(hold_remaining_s, 1),
            concentric_elapsed_s=round(concentric_elapsed, 1),
            eccentric_elapsed_s=round(eccentric_elapsed, 1),
            active_flags=current_frame_flags,
            reps_completed=self._rep_count,
            target_reps=self.target_reps,
            target_elevation_deg=config.SHOULDER_TARGET_ANGLE_NOMINAL,
            is_target_zone=is_target_zone,
        )

        return completed_rep, live_state
