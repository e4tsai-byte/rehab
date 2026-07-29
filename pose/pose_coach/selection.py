"""Person-selection and side-selection, both hysteresis-gated (per the
design doc: person selection "has the same hysteresis treatment as
side-switching below").
"""

from typing import List, Optional

from . import config, measurements
from .hysteresis import SwitchHysteresis
from .types import PoseObservation, Side


class PersonSelector:
    """Picks which detected person is "the tracked subject" this frame.

    Default policy: largest bounding-box area. Hysteresis: a competing
    detection must be larger for PERSON_SELECTION_HYSTERESIS_FRAMES
    consecutive frames before the tracked person swaps, so a one-frame
    intrusion (a bystander, a spotter) into frame doesn't cause a visible
    identity swap and state discontinuity live.

    MediaPipe is configured with num_poses=1 (see capture.py), so in
    practice `observations` will almost always have length 0 or 1 -- this
    exists as the documented, testable defensive behavior for the case
    where more than one detection ever surfaces (per the design doc), and
    is forward-compatible if num_poses is ever raised for the product's
    eventual multi-person group-session scope.

    No true cross-frame identity/re-identification is available from
    MediaPipe's output (explicitly out of scope per the design doc) -- so
    "the same tracked person" from one frame to the next is approximated
    as whichever candidate this frame has the bounding-box area closest to
    the previously tracked area (nearest-by-size incumbent matching). This
    specific matching heuristic is a builder-level implementation choice
    filling a gap the design doc leaves open (it specifies the hysteresis
    policy but not how to match "the same" person frame-to-frame without
    re-id); flagged in the builder's report.
    """

    def __init__(self):
        self._hysteresis = SwitchHysteresis(
            frames_required=config.PERSON_SELECTION_HYSTERESIS_FRAMES, margin=0.0
        )
        self._tracked_area: Optional[float] = None

    def reset(self) -> None:
        self._hysteresis.reset()
        self._tracked_area = None

    def select(self, observations: List[PoseObservation]) -> Optional[PoseObservation]:
        if not observations:
            # Known limitation: this also zeroes `_tracked_area`, so
            # nearest-by-size incumbent matching restarts from scratch on
            # the next frame with any detections (there's no "resume
            # tracking the same person across the gap" behavior). Left
            # as-is: with num_poses=1 (capture.py) there's at most one
            # candidate to match against post-gap anyway, so this is
            # low-risk in practice. Not addressed by this change.
            self.reset()
            return None

        scored = [(measurements.bbox_area(obs.landmarks_2d), obs) for obs in observations]

        if self._tracked_area is None:
            area, obs = max(scored, key=lambda pair: pair[0])
            self._tracked_area = area
            return obs

        incumbent_area, incumbent_obs = min(scored, key=lambda pair: abs(pair[0] - self._tracked_area))
        challenger_area, challenger_obs = max(scored, key=lambda pair: pair[0])

        if challenger_obs is incumbent_obs:
            self._hysteresis.reset()
            self._tracked_area = incumbent_area
            return incumbent_obs

        if self._hysteresis.should_switch(incumbent_area, challenger_area):
            self._tracked_area = challenger_area
            return challenger_obs

        self._tracked_area = incumbent_area
        return incumbent_obs


class SideSelector:
    """Picks left/right as the primary side, per the design doc's
    Visibility/occlusion handling: if both sides average below
    VISIBILITY_THRESHOLD, no side is usable (caller should emit UNKNOWN).
    Otherwise, switching away from the current primary side requires the
    other side's average visibility to exceed it by SIDE_VISIBILITY_MARGIN
    for SIDE_SELECTION_HYSTERESIS_FRAMES consecutive frames -- this single
    hysteresis-gated mechanism covers both "the other side got clearer"
    and "the primary side dropped below threshold" (a primary side that's
    dropped below threshold will essentially always be beaten by the
    margin once the other side is above threshold, so no separate
    immediate-override path is needed; this reconciles two adjacent
    sentences in the design doc that read as in tension -- an "immediate
    switch below threshold" reading would undercut the flicker-prevention
    rationale the doc gives for hysteresis in the first place).
    """

    def __init__(self):
        self._hysteresis = SwitchHysteresis(
            frames_required=config.SIDE_SELECTION_HYSTERESIS_FRAMES,
            margin=config.SIDE_VISIBILITY_MARGIN,
        )
        self._current_side: Optional[Side] = None

    def reset(self) -> None:
        self._hysteresis.reset()
        self._current_side = None

    def select(self, left_avg_visibility: float, right_avg_visibility: float) -> Optional[Side]:
        if (
            left_avg_visibility < config.VISIBILITY_THRESHOLD
            and right_avg_visibility < config.VISIBILITY_THRESHOLD
        ):
            self.reset()
            return None

        scores = {Side.LEFT: left_avg_visibility, Side.RIGHT: right_avg_visibility}

        if self._current_side is None:
            self._current_side = max(scores, key=scores.get)
            return self._current_side

        other_side = Side.RIGHT if self._current_side is Side.LEFT else Side.LEFT
        if self._hysteresis.should_switch(scores[self._current_side], scores[other_side]):
            self._current_side = other_side
        return self._current_side
