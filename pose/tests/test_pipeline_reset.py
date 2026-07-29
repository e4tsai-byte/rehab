"""AMBIGUITY (4): UNKNOWN must reset hysteresis/smoothing state, and must
not leak stale state across a tracking gap.

pipeline.py's `_unknown_output` explicitly calls `self._state_classifier
.reset()` and sets `self._last_side = None` on every UNKNOWN path (no
person, both sides sub-threshold, degenerate geometry). These tests
verify that actually holds end-to-end through PoseTrackingPipeline, and
separately probe a narrower question: does *every* piece of cross-frame
state get reset on a gap, or only some of it?
"""

import pytest

from pose_coach import config
from pose_coach.pipeline import PoseTrackingPipeline
from pose_coach.types import Side, State

from .conftest import make_observation


def test_smoothing_buffer_is_flushed_not_blended_across_a_tracking_gap():
    pipeline = PoseTrackingPipeline()

    # Build up a LEFT-side smoothing buffer with consistent values.
    for _ in range(config.SMOOTHING_WINDOW_FRAMES):
        pipeline.process_frame(
            [make_observation(knee_angle_deg=90.0, hip_height_ratio=0.30, side=Side.LEFT)],
            timestamp=0.0,
        )

    # Tracking gap: no person detected.
    gap_output = pipeline.process_frame([], timestamp=1.0)
    assert gap_output.state is State.UNKNOWN

    # Resume tracking on the SAME side with a very different raw value. If
    # the old buffer content leaked through, the median would be pulled
    # toward the pre-gap value (90); if properly flushed, the smoothed
    # value equals the single new raw value exactly (window of size 1).
    resumed = pipeline.process_frame(
        [make_observation(knee_angle_deg=170.0, hip_height_ratio=0.85, side=Side.LEFT)],
        timestamp=2.0,
    )

    assert resumed.knee_angle_raw == pytest.approx(170.0)
    assert resumed.knee_angle_smoothed == pytest.approx(170.0), (
        "smoothing buffer leaked stale pre-gap values across the tracking gap "
        f"(got {resumed.knee_angle_smoothed}, expected exactly 170.0 for a "
        "freshly-flushed single-element median window)"
    )


def test_state_machine_memory_is_reset_across_a_tracking_gap():
    pipeline = PoseTrackingPipeline()

    seated_output = pipeline.process_frame(
        [make_observation(knee_angle_deg=90.0, hip_height_ratio=0.30, side=Side.LEFT)],
        timestamp=0.0,
    )
    assert seated_output.state is State.SEATED

    gap_output = pipeline.process_frame([], timestamp=1.0)
    assert gap_output.state is State.UNKNOWN

    # A knee_angle/hip_height pair inside the SEATED *exit* band (105 >
    # knee > 95, 0.60 > hip > 0.50) but outside the *enter* band would
    # read as "still SEATED" if state-machine memory leaked across the
    # gap. It must instead be evaluated fresh (ENTER thresholds).
    resumed = pipeline.process_frame(
        [make_observation(knee_angle_deg=102.0, hip_height_ratio=0.55, side=Side.LEFT)],
        timestamp=2.0,
    )
    assert resumed.state is not State.SEATED, (
        "state-machine 'currently SEATED' memory leaked across the tracking gap"
    )
    assert resumed.state is State.TRANSITIONING


def test_unknown_from_degenerate_geometry_also_resets_state():
    """Same reset contract must hold on the *other* UNKNOWN path
    (degenerate zero-length-vector geometry), not just the no-person path
    -- pipeline.py's `_unknown_output` is shared by both."""
    pipeline = PoseTrackingPipeline()

    seated_output = pipeline.process_frame(
        [make_observation(knee_angle_deg=90.0, hip_height_ratio=0.30, side=Side.LEFT)],
        timestamp=0.0,
    )
    assert seated_output.state is State.SEATED

    # Force a degenerate knee (hip == knee == ankle -> zero-length vectors
    # -> geometry.interior_angle_deg returns None -> pipeline emits UNKNOWN).
    from pose_coach.types import Landmark
    from .conftest import _default_landmark_list

    landmarks_2d = _default_landmark_list(visibility=0.9)
    degenerate = Landmark(x=0.5, y=0.5, z=0.0, visibility=0.9)
    landmarks_2d[config.LEFT_HIP] = degenerate
    landmarks_2d[config.LEFT_KNEE] = degenerate
    landmarks_2d[config.LEFT_ANKLE] = degenerate
    landmarks_2d[config.LEFT_SHOULDER] = degenerate
    world_landmarks = _default_landmark_list(visibility=0.9)

    from pose_coach.types import PoseObservation
    degenerate_obs = PoseObservation(landmarks_2d=landmarks_2d, world_landmarks=world_landmarks)

    degenerate_output = pipeline.process_frame([degenerate_obs], timestamp=1.0)
    assert degenerate_output.state is State.UNKNOWN

    resumed = pipeline.process_frame(
        [make_observation(knee_angle_deg=102.0, hip_height_ratio=0.55, side=Side.LEFT)],
        timestamp=2.0,
    )
    assert resumed.state is not State.SEATED


def test_side_selector_hysteresis_state_is_reset_by_a_no_person_gap():
    """Regression test for the fix in pipeline.py's `_unknown_output`,
    which now calls `self._side_selector.reset()` on every UNKNOWN path
    (previously only `_state_classifier` and `_last_side` were reset
    there; `SideSelector`'s own `_current_side`/hysteresis-counter state
    was left untouched by a no-person gap).

    An earlier version of this test tried to demonstrate the pre-fix bug
    by accruing 2 of the 3 required consecutive RIGHT-advantage frames,
    hitting a gap, then checking that one more *strongly* RIGHT-favoring
    frame (0.8 vs 0.2) produced RIGHT. That assertion still passes after
    the fix, but no longer for the reason it claimed to test: post-reset,
    `_current_side` is `None`, so `SideSelector.select()` takes its "no
    current side yet" branch and picks whichever side has higher
    visibility *this single frame*, with no margin/hysteresis gate at all
    -- the same no-hysteresis-on-first-pick behavior `PersonSelector`
    already has. With such a large post-gap visibility gap, that fresh
    no-hysteresis pick and a (hypothetical, buggy) stale-counter pick
    happen to agree, so the old numbers couldn't actually tell
    "reset happened" apart from "reset didn't happen".

    This version fixes that: the post-gap frame's visibilities are chosen
    so RIGHT is ahead of LEFT, but by *less* than SIDE_VISIBILITY_MARGIN.
    That makes the two hypotheses disagree:
      - properly reset (`_current_side` is None): fresh single-frame pick
        with no margin required -> RIGHT wins (0.62 > 0.55).
      - NOT reset (regression: stale `_current_side` == LEFT and its
        counter survive): `SwitchHysteresis.should_switch` requires the
        challenger to beat the incumbent by the margin *this frame* to
        count as advantage at all; 0.62 does not exceed 0.55 + 0.15, so
        the frame doesn't count, the counter resets to 0, and the (buggy)
        incumbent LEFT is kept.
    So if the reset call is ever removed/regressed, this assertion fails
    outright instead of coincidentally continuing to pass.
    """
    pipeline = PoseTrackingPipeline()

    # Establish LEFT as the current side (this first-ever pick is itself
    # a fresh no-hysteresis pick, since there's no current side yet).
    pipeline.process_frame(
        [make_observation(knee_angle_deg=90.0, hip_height_ratio=0.30, side=Side.LEFT,
                           visibility=0.8, other_side_visibility=0.2)],
        timestamp=0.0,
    )

    # Accrue 2 of the 3 required consecutive RIGHT-advantage frames --
    # confirm the switch has NOT completed yet (still on LEFT), so the
    # pre-gap hysteresis counter genuinely holds partial (2/3) progress
    # going into the gap.
    pre_gap_output = None
    for t in (1.0, 2.0):
        pre_gap_output = pipeline.process_frame(
            [make_observation(knee_angle_deg=90.0, hip_height_ratio=0.30, side=Side.RIGHT,
                               visibility=0.8, other_side_visibility=0.2)],
            timestamp=t,
        )
    assert pre_gap_output.side_used == Side.LEFT.value, (
        "2 consecutive advantage frames should not yet complete a 3-frame switch"
    )

    # Full tracking gap.
    gap_output = pipeline.process_frame([], timestamp=3.0)
    assert gap_output.state is State.UNKNOWN

    # A single post-gap frame where RIGHT is ahead of LEFT (0.62 > 0.55)
    # but by LESS than SIDE_VISIBILITY_MARGIN (0.15) -- chosen specifically
    # so a fresh no-hysteresis pick and a stale-counter/incumbent pick
    # disagree (see docstring above).
    assert 0.0 < 0.62 - 0.55 < config.SIDE_VISIBILITY_MARGIN, "sanity-check the chosen numbers"
    resumed = pipeline.process_frame(
        [make_observation(knee_angle_deg=90.0, hip_height_ratio=0.30, side=Side.RIGHT,
                           visibility=0.62, other_side_visibility=0.55)],
        timestamp=4.0,
    )

    assert resumed.side_used == Side.RIGHT.value, (
        "SideSelector state was not fully reset by the no-person tracking gap: "
        "got LEFT, which is what a stale surviving current-side/hysteresis-counter "
        "would produce here (0.62 doesn't beat 0.55 by the required margin, so the "
        "margin-gated hysteresis path keeps the old incumbent instead of switching); "
        "a properly reset selector picks fresh by raw visibility this frame alone "
        "and must return RIGHT (0.62 > 0.55)"
    )
