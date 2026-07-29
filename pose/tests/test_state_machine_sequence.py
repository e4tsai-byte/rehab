"""Sequence test: hysteresis-boundary non-flicker.

Per the design doc: "an angle oscillating around a hysteresis boundary
does not flip state every frame." Single-frame fixtures can't exercise
this since hysteresis is inherently cross-frame (StateClassifier keeps
`_last_state` between calls) -- see state_machine.py's module docstring.

Tested directly against StateClassifier (bypassing smoothing/selection)
so the hysteresis behavior is isolated from the median filter's own
cross-frame effects, which get their own sequence test.
"""

from pose_coach import config
from pose_coach.state_machine import StateClassifier
from pose_coach.types import State


def test_knee_angle_oscillating_in_seated_band_does_not_flicker():
    clf = StateClassifier()

    # First call: comfortably inside SEATED-enter -> SEATED.
    assert clf.classify(knee_angle=90.0, hip_height_norm=0.30) is State.SEATED

    # ENTER=95, EXIT=105 for knee; ENTER=0.50, EXIT=0.60 for hip height.
    # Oscillate knee angle across the ENTER line (but never past EXIT) --
    # a naive single-threshold classifier would flip out of SEATED here.
    oscillating_knee_angles = [96.0, 99.0, 94.0, 101.0, 97.0, 104.0]
    for knee_angle in oscillating_knee_angles:
        state = clf.classify(knee_angle=knee_angle, hip_height_norm=0.52)
        assert state is State.SEATED, f"flickered out of SEATED at knee_angle={knee_angle}"

    # Now cross the EXIT threshold -- must actually leave SEATED.
    state = clf.classify(knee_angle=110.0, hip_height_norm=0.65)
    assert state is not State.SEATED


def test_hip_height_oscillating_in_standing_band_does_not_flicker():
    clf = StateClassifier()

    assert clf.classify(knee_angle=178.0, hip_height_norm=0.97) is State.STANDING

    # ENTER=0.90, EXIT=0.80 for STANDING hip height (mirrored band).
    oscillating_hip_heights = [0.88, 0.82, 0.91, 0.85]
    for hip_height in oscillating_hip_heights:
        state = clf.classify(knee_angle=170.0, hip_height_norm=hip_height)
        assert state is State.STANDING, f"flickered out of STANDING at hip_height={hip_height}"

    state = clf.classify(knee_angle=170.0, hip_height_norm=0.75)
    assert state is not State.STANDING


def test_fresh_classifier_uses_enter_not_exit_thresholds():
    """A brand-new classifier (or one just reset) has never been in any
    state, so it must require the stricter ENTER threshold, not the more
    lenient EXIT threshold, to first enter SEATED/STANDING."""
    clf = StateClassifier()

    # Between ENTER (95) and EXIT (105) for knee, and between ENTER (0.50)
    # and EXIT (0.60) for hip height -- would count as "still SEATED" if
    # EXIT thresholds were used, but must NOT count as "entering SEATED".
    state = clf.classify(knee_angle=102.0, hip_height_norm=0.55)
    assert state is not State.SEATED
    assert state is State.TRANSITIONING


def test_reset_forgets_last_state_for_hysteresis_purposes():
    clf = StateClassifier()
    assert clf.classify(knee_angle=90.0, hip_height_norm=0.30) is State.SEATED

    clf.reset()

    # Immediately after reset, a value inside the SEATED exit band (but
    # outside the enter band) must NOT be treated as "still seated".
    state = clf.classify(knee_angle=102.0, hip_height_norm=0.55)
    assert state is not State.SEATED
