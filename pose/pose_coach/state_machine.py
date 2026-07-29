"""SEATED / STANDING / TRANSITIONING hysteresis state machine.

UNKNOWN is not produced here -- it's assigned upstream (pipeline.py) when
landmark visibility is too low on both sides or no person is detected, per
the design doc. This classifier only ever sees a resolved side's smoothed
knee angle and hip height.

Hysteresis applies symmetrically to all four boundary thresholds
(SEATED-enter/exit on knee angle, SEATED-enter/exit on hip height, and the
mirrored STANDING pair): which threshold (enter vs. exit) is used for a
given criterion depends on whether the machine is already in that state,
so e.g. once SEATED, knee angle must exceed the more lenient EXIT threshold
(not just cross back over the stricter ENTER threshold) before leaving --
that's what prevents an angle oscillating near a boundary from flipping
state every frame.
"""

from . import config
from .types import State


class StateClassifier:
    def __init__(self):
        self._last_state = State.TRANSITIONING  # no assumption before the first classification

    def reset(self) -> None:
        self._last_state = State.TRANSITIONING

    def classify(self, knee_angle: float, hip_height_norm: float) -> State:
        if self._meets_seated(knee_angle, hip_height_norm):
            new_state = State.SEATED
        elif self._meets_standing(knee_angle, hip_height_norm):
            new_state = State.STANDING
        else:
            # Explicit default: the catch-all for "somewhere in between",
            # per the design doc -- not an error case.
            new_state = State.TRANSITIONING
        self._last_state = new_state
        return new_state

    def _meets_seated(self, knee_angle: float, hip_height_norm: float) -> bool:
        currently_seated = self._last_state is State.SEATED
        knee_threshold = config.KNEE_SEATED_EXIT if currently_seated else config.KNEE_SEATED_ENTER
        hip_threshold = (
            config.HIP_HEIGHT_SEATED_EXIT if currently_seated else config.HIP_HEIGHT_SEATED_ENTER
        )
        return knee_angle < knee_threshold and hip_height_norm < hip_threshold

    def _meets_standing(self, knee_angle: float, hip_height_norm: float) -> bool:
        currently_standing = self._last_state is State.STANDING
        knee_threshold = config.KNEE_STANDING_EXIT if currently_standing else config.KNEE_STANDING_ENTER
        hip_threshold = (
            config.HIP_HEIGHT_STANDING_EXIT if currently_standing else config.HIP_HEIGHT_STANDING_ENTER
        )
        return knee_angle > knee_threshold and hip_height_norm > hip_threshold
