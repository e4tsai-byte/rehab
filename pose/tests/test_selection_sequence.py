"""Sequence tests for person-selection and side-selection hysteresis, per
the design doc: "a side-visibility sequence that only briefly favors the
other side does not trigger a switch, but a sustained 3+-frame advantage
does; same pattern for person-selection hysteresis with a competing
bounding box."

Also specifically probes the two ambiguities the builder flagged around
selection.py:
  (1) PersonSelector's nearest-bbox-area frame-to-frame correspondence
      heuristic (no true re-id available).
  (2) The unified hysteresis path for side-switching, which the builder's
      comment claims covers BOTH "the other side got clearer" AND "the
      primary side dropped below threshold" with the same 3-frame gate --
      verified here for whether it (a) still prevents flicker and (b)
      does or doesn't leave the pipeline running on a below-threshold
      side for multiple frames before switching/going UNKNOWN.
"""

from pose_coach import config
from pose_coach.selection import PersonSelector, SideSelector
from pose_coach.types import Landmark, PoseObservation, Side

from .conftest import _default_landmark_list


# --- SideSelector ------------------------------------------------------------


def test_brief_one_frame_visibility_advantage_does_not_switch():
    sel = SideSelector()
    assert sel.select(left_avg_visibility=0.8, right_avg_visibility=0.5) is Side.LEFT

    # Right briefly exceeds left by more than the margin for a single frame.
    result = sel.select(left_avg_visibility=0.5, right_avg_visibility=0.8)
    assert result is Side.LEFT, "a single-frame advantage must not switch sides"


def test_two_consecutive_frames_advantage_still_does_not_switch():
    sel = SideSelector()
    sel.select(left_avg_visibility=0.8, right_avg_visibility=0.5)

    sel.select(left_avg_visibility=0.5, right_avg_visibility=0.8)
    result = sel.select(left_avg_visibility=0.5, right_avg_visibility=0.8)
    assert result is Side.LEFT, "2 consecutive frames is below the 3-frame hysteresis gate"


def test_sustained_three_frame_advantage_switches():
    sel = SideSelector()
    sel.select(left_avg_visibility=0.8, right_avg_visibility=0.5)

    for _ in range(config.SIDE_SELECTION_HYSTERESIS_FRAMES - 1):
        result = sel.select(left_avg_visibility=0.5, right_avg_visibility=0.8)
        assert result is Side.LEFT

    result = sel.select(left_avg_visibility=0.5, right_avg_visibility=0.8)
    assert result is Side.RIGHT, "a sustained 3+-frame advantage must switch"


def test_advantage_streak_resets_if_interrupted():
    sel = SideSelector()
    sel.select(left_avg_visibility=0.8, right_avg_visibility=0.5)

    sel.select(left_avg_visibility=0.5, right_avg_visibility=0.8)  # advantage frame 1
    sel.select(left_avg_visibility=0.8, right_avg_visibility=0.5)  # interrupts the streak
    sel.select(left_avg_visibility=0.5, right_avg_visibility=0.8)  # advantage frame 1 again
    result = sel.select(left_avg_visibility=0.5, right_avg_visibility=0.8)  # advantage frame 2
    assert result is Side.LEFT, "streak should have restarted after the interruption"


def test_both_sides_below_threshold_is_immediate_not_hysteresis_gated():
    """Both-below-threshold -> None (caller emits UNKNOWN) must be
    immediate, not delayed by the hysteresis frame counter -- this is a
    separate check inside SideSelector.select(), independent of
    SwitchHysteresis.should_switch()."""
    sel = SideSelector()
    sel.select(left_avg_visibility=0.8, right_avg_visibility=0.5)

    result = sel.select(left_avg_visibility=0.1, right_avg_visibility=0.2)
    assert result is None, "both sides below VISIBILITY_THRESHOLD must yield None immediately"


def test_primary_side_visibility_craters_delays_switch_for_full_hysteresis_window():
    """AMBIGUITY (2) characterization: when the primary side's visibility
    craters below VISIBILITY_THRESHOLD but the *other* side is healthy
    (above threshold and beyond the margin), the unified hysteresis path
    does NOT switch immediately -- it takes SIDE_SELECTION_HYSTERESIS_FRAMES
    consecutive frames, same as a routine side-switch. During that window,
    SideSelector keeps returning the crashed (sub-threshold) side rather
    than None/UNKNOWN.

    This confirms flicker-prevention isn't defeated (good), but also
    documents that a genuinely-crashed primary side is used for up to
    SIDE_SELECTION_HYSTERESIS_FRAMES - 1 frames post-crash before the
    switch takes effect, rather than an immediate override -- worth
    flagging to the builder/updater as the concrete behavior of the
    "unified" interpretation.
    """
    sel = SideSelector()
    assert sel.select(left_avg_visibility=0.8, right_avg_visibility=0.2) is Side.LEFT

    # Left craters far below VISIBILITY_THRESHOLD; right is healthy.
    crashed_left, healthy_right = 0.05, 0.7
    assert healthy_right - crashed_left > config.SIDE_VISIBILITY_MARGIN
    assert crashed_left < config.VISIBILITY_THRESHOLD

    results = []
    for _ in range(config.SIDE_SELECTION_HYSTERESIS_FRAMES + 1):
        results.append(sel.select(left_avg_visibility=crashed_left, right_avg_visibility=healthy_right))

    # It takes exactly SIDE_SELECTION_HYSTERESIS_FRAMES frames to switch;
    # every frame before that still reports the crashed side, not None.
    for result in results[: config.SIDE_SELECTION_HYSTERESIS_FRAMES - 1]:
        assert result is Side.LEFT
    assert results[config.SIDE_SELECTION_HYSTERESIS_FRAMES - 1] is Side.RIGHT


# --- PersonSelector ----------------------------------------------------------


def _obs_with_bbox_side(side_span: float, opposite_span: float = 0.05):
    """A minimal PoseObservation whose landmarks_2d bbox area is
    controlled by `side_span` (a square of that side length, centered),
    with visibility high enough to be irrelevant to this test (only
    bbox_area/measurements.bbox_area matters for PersonSelector)."""
    landmarks = _default_landmark_list(visibility=0.9)
    half = side_span / 2
    landmarks[0] = Landmark(x=0.5 - half, y=0.5 - half, z=0.0, visibility=0.9)
    landmarks[1] = Landmark(x=0.5 + half, y=0.5 + half, z=0.0, visibility=0.9)
    return PoseObservation(landmarks_2d=landmarks, world_landmarks=landmarks)


def test_single_frame_bystander_intrusion_does_not_swap_tracked_person():
    sel = PersonSelector()
    tracked = _obs_with_bbox_side(0.3)
    result = sel.select([tracked])
    assert result is tracked

    # A single-frame larger "bystander" bbox intrudes -- must not swap yet.
    bystander = _obs_with_bbox_side(0.6)
    result = sel.select([tracked, bystander])
    assert result is tracked, "a one-frame intrusion must not cause a visible identity swap"


def test_sustained_larger_bystander_eventually_swaps():
    sel = PersonSelector()
    tracked = _obs_with_bbox_side(0.3)
    sel.select([tracked])

    bystander = _obs_with_bbox_side(0.6)
    for _ in range(config.PERSON_SELECTION_HYSTERESIS_FRAMES - 1):
        result = sel.select([tracked, bystander])
        assert result is tracked

    result = sel.select([tracked, bystander])
    assert result is bystander, "a sustained multi-frame larger detection must eventually swap"


def test_no_observations_resets_hysteresis_state():
    """AMBIGUITY (1)/(4): a full tracking gap (no detections at all) must
    not leave a partial "advantage streak" in place that would let a
    swap complete unnaturally fast once tracking resumes."""
    sel = PersonSelector()
    tracked = _obs_with_bbox_side(0.3)
    sel.select([tracked])

    bystander = _obs_with_bbox_side(0.6)
    # Build up 2 of the 3 required consecutive advantage frames.
    sel.select([tracked, bystander])
    sel.select([tracked, bystander])

    # Tracking gap.
    assert sel.select([]) is None

    # Resuming: nearest-bbox-area matching has no prior `_tracked_area` to
    # match against (reset to None), so the *first* post-gap frame falls
    # into the "no incumbent yet" branch and picks the largest detection
    # outright (bystander, since it's larger) -- documented actual
    # behavior, not a 3-frame-gated re-acquisition.
    result = sel.select([tracked, bystander])
    assert result is bystander, (
        "after a full gap, PersonSelector has no incumbent to match against and "
        "picks the largest detection immediately -- there is no re-identification, "
        "consistent with the design doc's explicit no-re-id scope, but worth noting "
        "this means a gap immediately followed by a still-present bystander can "
        "reassign tracking to the bystander with no hysteresis delay at all."
    )


def test_nearest_area_matching_keeps_tracking_through_gradual_size_change():
    """AMBIGUITY (1): nearest-bbox-area correspondence should keep
    tracking the same (gradually shrinking/growing) person rather than
    the literal-largest detection, when a second, larger, differently-sized
    detection is also present -- this is the actual justification for
    "nearest to previous size" over "largest every frame"."""
    sel = PersonSelector()
    tracked = _obs_with_bbox_side(0.30)
    sel.select([tracked])

    # Tracked person shrinks slightly (e.g. leaning back); a much larger
    # bystander is also present. Nearest-area matching should keep
    # following the gradually-shrinking incumbent, not jump to the larger
    # bystander on a single frame (that jump is exactly what the 3-frame
    # hysteresis in the other tests guards against too).
    shrinking_tracked = _obs_with_bbox_side(0.28)
    bystander = _obs_with_bbox_side(0.60)
    result = sel.select([shrinking_tracked, bystander])
    assert result is shrinking_tracked
