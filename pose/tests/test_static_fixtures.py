"""Static-fixture unit tests, per the design doc's Success Criteria:
"Static-fixture unit tests cover the angle math and state classification
against synthetic landmark coordinates for: a clear SEATED pose, a clear
STANDING pose, a TRANSITIONING (mid-motion) pose, and a low-confidence/
occluded-landmark case (asserting UNKNOWN)."

Each test drives a fresh PoseTrackingPipeline with a single synthetic
frame -- the state machine's `_last_state` starts at TRANSITIONING (see
state_machine.py), so a single call exercises the ENTER thresholds.
"""

import pytest

from pose_coach import config
from pose_coach.pipeline import PoseTrackingPipeline
from pose_coach.types import Side, State

from .conftest import make_low_visibility_observation, make_observation


def test_clear_seated_pose_classifies_seated():
    pipeline = PoseTrackingPipeline()
    # Well inside the SEATED enter thresholds (knee < 95, hip_height < 0.50).
    obs = make_observation(knee_angle_deg=90.0, hip_height_ratio=0.30, side=Side.LEFT)
    output = pipeline.process_frame([obs], timestamp=0.0)

    assert output.state is State.SEATED
    assert output.side_used == Side.LEFT.value
    assert output.knee_angle_raw == pytest.approx(90.0)
    assert output.knee_angle_smoothed == pytest.approx(90.0)
    assert output.hip_height_norm == pytest.approx(0.30)
    assert output.hip_angle is not None
    assert output.trunk_lean is not None
    assert output.visibility is not None


def test_clear_standing_pose_classifies_standing():
    pipeline = PoseTrackingPipeline()
    # Well inside the STANDING enter thresholds (knee > 165, hip_height > 0.90).
    obs = make_observation(knee_angle_deg=178.0, hip_height_ratio=0.97, side=Side.RIGHT)
    output = pipeline.process_frame([obs], timestamp=0.0)

    assert output.state is State.STANDING
    assert output.side_used == Side.RIGHT.value
    assert output.knee_angle_smoothed == pytest.approx(178.0)
    assert output.hip_height_norm == pytest.approx(0.97)


def test_mid_motion_pose_classifies_transitioning():
    pipeline = PoseTrackingPipeline()
    # Comfortably between both SEATED and STANDING bands on both axes.
    obs = make_observation(knee_angle_deg=130.0, hip_height_ratio=0.70, side=Side.LEFT)
    output = pipeline.process_frame([obs], timestamp=0.0)

    assert output.state is State.TRANSITIONING
    assert output.knee_angle_smoothed == pytest.approx(130.0)


def test_low_visibility_both_sides_classifies_unknown():
    pipeline = PoseTrackingPipeline()
    obs = make_low_visibility_observation(visibility=0.1)
    assert 0.1 < config.VISIBILITY_THRESHOLD

    output = pipeline.process_frame([obs], timestamp=0.0)

    assert output.state is State.UNKNOWN
    assert output.side_used is None
    assert output.knee_angle_raw is None
    assert output.knee_angle_smoothed is None
    assert output.hip_height_norm is None


def test_no_person_detected_classifies_unknown():
    pipeline = PoseTrackingPipeline()
    output = pipeline.process_frame([], timestamp=0.0)

    assert output.state is State.UNKNOWN
    assert output.side_used is None
    assert output.visibility is None

