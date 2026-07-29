"""Pure per-frame pipeline: person selection -> side selection -> joint
angle / hip height measurement -> per-side smoothing -> state
classification.

No camera, no MediaPipe inference call, no OpenCV import anywhere in this
module -- it operates entirely on the plain `PoseObservation` type
(types.py), which is what lets it be driven by synthetic landmark
coordinates in unit/sequence tests. `pose_coach.capture` is the only place
real MediaPipe output gets translated into `PoseObservation`s before being
handed to `PoseTrackingPipeline.process_frame`.

Order of operations (per the design doc, deliberate, not incidental):
person selection resolves first, then side selection resolves against that
person's landmarks, then the resolved side's *raw* per-frame angle/height
is what feeds the smoothing buffer -- never blending raw values from two
different sides in one smoothing window.
"""

from typing import List, Optional

from . import config, measurements
from .selection import PersonSelector, SideSelector
from .smoothing import SideSmoothingState
from .state_machine import StateClassifier
from .types import FrameOutput, PoseObservation, Side, State


class PoseTrackingPipeline:
    def __init__(self):
        self._person_selector = PersonSelector()
        self._side_selector = SideSelector()
        self._smoothing = {
            Side.LEFT: SideSmoothingState(config.SMOOTHING_WINDOW_FRAMES),
            Side.RIGHT: SideSmoothingState(config.SMOOTHING_WINDOW_FRAMES),
        }
        self._state_classifier = StateClassifier()
        self._last_side: Optional[Side] = None

    def process_frame(self, observations: List[PoseObservation], timestamp: float) -> FrameOutput:
        person = self._person_selector.select(observations)
        if person is None:
            return self._unknown_output(timestamp, side_used=None, visibility=None)

        left_vis = measurements.side_average_visibility(person.landmarks_2d, Side.LEFT)
        right_vis = measurements.side_average_visibility(person.landmarks_2d, Side.RIGHT)
        side = self._side_selector.select(left_vis, right_vis)
        if side is None:
            return self._unknown_output(
                timestamp, side_used=None, visibility=max(left_vis, right_vis)
            )

        visibility = left_vis if side is Side.LEFT else right_vis
        knee_raw = measurements.knee_angle_deg(person.landmarks_2d, side)
        height_raw = measurements.hip_height_norm(person.world_landmarks, side)

        if knee_raw is None or height_raw is None:
            # Degenerate zero-length-vector geometry this frame (e.g. two
            # landmarks coinciding near an occlusion boundary) -- guarded
            # per the design doc's numerical edge cases, not a crash.
            return self._unknown_output(timestamp, side_used=side.value, visibility=visibility)

        if side is not self._last_side:
            # Side switch: flush (not blend) the newly-active side's
            # smoothing buffer before pushing this frame's raw values.
            self._smoothing[side].reset()
        self._last_side = side

        knee_smoothed = self._smoothing[side].knee_angle.push(knee_raw)
        height_smoothed = self._smoothing[side].hip_height_norm.push(height_raw)

        state = self._state_classifier.classify(knee_smoothed, height_smoothed)

        hip_angle = measurements.hip_angle_deg(person.landmarks_2d, side)
        trunk_lean = measurements.trunk_lean_deg(person.landmarks_2d, side)

        return FrameOutput(
            timestamp=timestamp,
            side_used=side.value,
            knee_angle_raw=knee_raw,
            knee_angle_smoothed=knee_smoothed,
            hip_angle=hip_angle,
            trunk_lean=trunk_lean,
            hip_height_norm=height_smoothed,
            state=state,
            visibility=visibility,
        )

    def _unknown_output(
        self, timestamp: float, side_used: Optional[str], visibility: Optional[float]
    ) -> FrameOutput:
        # A tracking gap (no person, no usable side, or degenerate
        # geometry) breaks hysteresis/smoothing continuity: per the design
        # doc, UNKNOWN must never be a held-over stale state, and blending
        # smoothed values across a gap would fabricate continuity that
        # isn't there. PersonSelector already resets its own hysteresis
        # counter internally when `observations` is empty (see
        # selection.py), but that only covers the no-observations case --
        # it does not run when a person IS present but no side is usable,
        # or when geometry is degenerate. SideSelector never resets itself
        # on any of those paths, since the pipeline (not SideSelector) is
        # what decides a gap occurred. So every stateful component gets
        # reset explicitly, here, on every gap, for a genuinely clean
        # slate -- not relying on selectors to notice a gap on their own.
        self._state_classifier.reset()
        self._side_selector.reset()
        self._last_side = None
        return FrameOutput(
            timestamp=timestamp,
            side_used=side_used,
            knee_angle_raw=None,
            knee_angle_smoothed=None,
            hip_angle=None,
            trunk_lean=None,
            hip_height_norm=None,
            state=State.UNKNOWN,
            visibility=visibility,
        )
