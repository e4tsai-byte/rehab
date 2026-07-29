"""Tests for `pose_coach.autoregulation.rep_counter.RepCounter`.

Drives `RepCounter.process()` frame-by-frame with synthetic `FrameOutput`
sequences (see `conftest.make_frame`), the same style
`test_state_machine_sequence.py` uses one layer down for `StateClassifier`
-- rep counting is inherently cross-frame stateful, so single-frame
fixtures can't exercise it.

Covers the design doc's Success Criteria (rep-counting-velocity-loss-
design.md) directly:
- complete SEATED->STANDING->SEATED cycles are counted, incomplete ones
  discarded (tracking gap mid-rep);
- a single-frame UNKNOWN blip mid-concentric-phase discards the rep
  (Premise 1's Round-2 fix -- the specific regression this doc calls out
  by name).

Also pins down the builder's self-reported inferences relevant to this
module: discard rule (b) (implausibly-short duration) is checked *before*
the mean_velocity division, not after, and failed-stand attempts are
tracked but never counted as a rep.
"""

import pytest

from pose_coach import config
from pose_coach.autoregulation.rep_counter import RepCounter
from pose_coach.types import State

from .conftest import make_frame


def test_full_rep_cycle_is_counted_with_correct_fields():
    counter = RepCounter()

    frames = [
        make_frame(0.0, State.SEATED, hip_height_norm=0.30, knee_angle_smoothed=90.0),
        make_frame(0.5, State.TRANSITIONING, hip_height_norm=0.45, knee_angle_smoothed=120.0),  # SEATED-exit
        make_frame(1.0, State.TRANSITIONING, hip_height_norm=0.70, knee_angle_smoothed=145.0),  # +0.25
        make_frame(1.3, State.TRANSITIONING, hip_height_norm=0.68, knee_angle_smoothed=150.0),  # -0.02 (noise)
        make_frame(1.6, State.STANDING, hip_height_norm=0.90, knee_angle_smoothed=170.0),  # STANDING-entry, +0.22
        make_frame(2.0, State.STANDING, hip_height_norm=0.92, knee_angle_smoothed=172.0),  # RETURN phase, ignored
        make_frame(2.5, State.SEATED, hip_height_norm=0.30, knee_angle_smoothed=90.0),  # completes the rep
    ]

    results = [counter.process(f) for f in frames]

    # Nothing is returned until the final SEATED-return frame.
    assert results[:-1] == [None] * (len(frames) - 1)
    rep = results[-1]
    assert rep is not None

    assert rep.rep_index == 1
    assert counter.rep_count == 1
    assert counter.failed_stand_count == 0

    # Concentric window is [SEATED-exit frame, ..., STANDING-entry frame]
    # inclusive -- timestamps 0.5 to 1.6, NOT including the RESTING or
    # RETURN-phase frames.
    assert rep.concentric_time == pytest.approx(1.1)
    assert rep.timestamp == pytest.approx(1.6)

    # mean_velocity is whole-phase displacement (0.90 - 0.45) / 1.1, not a
    # framewise average -- distinguishing this from peak_velocity below is
    # the whole point of the design doc's Premise 2 revision.
    assert rep.mean_velocity == pytest.approx((0.90 - 0.45) / 1.1)

    # peak_velocity is the max single-frame delta (0.25, at the second
    # concentric frame) -- deliberately different from both mean_velocity
    # and the raw total displacement (0.45), which would be the wrong
    # answer if peak_velocity were accidentally computed as an endpoint
    # quantity instead of a per-frame max.
    assert rep.peak_velocity == pytest.approx(0.25)

    assert rep.min_angle == pytest.approx(120.0)
    assert rep.max_angle == pytest.approx(170.0)
    assert rep.range_of_motion == pytest.approx(50.0)
    assert rep.form_flags == []


def test_multiple_reps_get_sequential_rep_index():
    counter = RepCounter()

    def run_one_cycle(t0):
        counter.process(make_frame(t0, State.SEATED, 0.30, 90.0))
        counter.process(make_frame(t0 + 0.3, State.TRANSITIONING, 0.45, 120.0))
        counter.process(make_frame(t0 + 0.6, State.STANDING, 0.90, 170.0))
        return counter.process(make_frame(t0 + 0.9, State.SEATED, 0.30, 90.0))

    rep1 = run_one_cycle(0.0)
    rep2 = run_one_cycle(2.0)

    assert rep1.rep_index == 1
    assert rep2.rep_index == 2
    assert counter.rep_count == 2


def test_failed_stand_is_tracked_but_not_counted_as_a_rep():
    counter = RepCounter()

    counter.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    counter.process(make_frame(0.5, State.TRANSITIONING, 0.45, 120.0))  # leaves SEATED
    result = counter.process(make_frame(1.0, State.SEATED, 0.30, 90.0))  # back to SEATED, never STANDING

    assert result is None
    assert counter.rep_count == 0
    assert counter.failed_stand_count == 1


def test_multiple_failed_stands_accumulate():
    counter = RepCounter()
    for t0 in (0.0, 2.0, 4.0):
        counter.process(make_frame(t0, State.SEATED, 0.30, 90.0))
        counter.process(make_frame(t0 + 0.3, State.TRANSITIONING, 0.45, 120.0))
        counter.process(make_frame(t0 + 0.6, State.SEATED, 0.30, 90.0))

    assert counter.failed_stand_count == 3
    assert counter.rep_count == 0


def test_unknown_frame_mid_concentric_discards_the_rep():
    """Regression test for the design doc's Round-2 fix: a single-frame
    UNKNOWN blip during the concentric phase discards the rep entirely --
    no single-frame exemption -- even though the frame's None fields never
    actually get read (the discard check runs first)."""
    counter = RepCounter()

    counter.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    counter.process(make_frame(0.5, State.TRANSITIONING, 0.45, 120.0))  # SEATED-exit
    counter.process(make_frame(0.8, State.UNKNOWN))  # blip: hip_height_norm/knee_angle None
    counter.process(make_frame(1.1, State.TRANSITIONING, 0.70, 150.0))
    counter.process(make_frame(1.6, State.STANDING, 0.90, 170.0))  # STANDING-entry
    result = counter.process(make_frame(2.1, State.SEATED, 0.30, 90.0))  # completes cycle

    assert result is None
    assert counter.rep_count == 0
    assert counter.failed_stand_count == 0  # it reached STANDING, so not a failed-stand either


def test_unknown_frame_after_standing_does_not_discard():
    """Documented (deferred) behavior: the concentric-phase window is fixed
    once STANDING is reached, so an UNKNOWN frame during the RETURN phase
    (after standing, before returning to SEATED) does NOT discard the rep
    -- the return-phase discard rule is explicitly out of scope for this
    slice per the design doc. Pinning this down so a future accidental
    "extend the discard rule to the whole cycle" change shows up as a
    behavior change, not a silent one."""
    counter = RepCounter()

    counter.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    counter.process(make_frame(0.5, State.TRANSITIONING, 0.45, 120.0))
    counter.process(make_frame(1.0, State.STANDING, 0.90, 170.0))  # STANDING-entry; window now fixed
    counter.process(make_frame(1.3, State.UNKNOWN))  # occlusion blip AFTER standing
    result = counter.process(make_frame(1.8, State.SEATED, 0.30, 90.0))

    assert result is not None
    assert counter.rep_count == 1


def test_duration_discard_runs_before_division_zero_duration():
    """Discard rule (b) must run before the mean_velocity division
    (design doc, Premise 2 "Ordering"). Constructs a concentric phase with
    concentric_time == 0.0 exactly (SEATED-exit and STANDING-entry frames
    share the same timestamp) -- if the duration guard ran *after* the
    division instead of before, this would raise ZeroDivisionError rather
    than cleanly returning None."""
    counter = RepCounter()

    counter.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    counter.process(make_frame(1.0, State.TRANSITIONING, 0.40, 110.0))  # SEATED-exit
    counter.process(make_frame(1.0, State.STANDING, 0.95, 170.0))  # STANDING-entry, SAME timestamp
    result = counter.process(make_frame(1.5, State.SEATED, 0.30, 90.0))  # no exception expected

    assert result is None
    assert counter.rep_count == 0


def test_duration_discard_boundary_is_strictly_less_than():
    """concentric_time exactly equal to MIN_CONCENTRIC_DURATION_S is NOT
    discarded (the code checks `< threshold`, not `<= threshold`); a hair
    below it is discarded. Pins the exact boundary semantics."""
    threshold = config.MIN_CONCENTRIC_DURATION_S

    counter_at_boundary = RepCounter()
    counter_at_boundary.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    counter_at_boundary.process(make_frame(0.0, State.TRANSITIONING, 0.45, 120.0))
    counter_at_boundary.process(make_frame(threshold, State.STANDING, 0.90, 170.0))
    result_at_boundary = counter_at_boundary.process(make_frame(threshold + 0.5, State.SEATED, 0.30, 90.0))
    assert result_at_boundary is not None

    counter_below_boundary = RepCounter()
    counter_below_boundary.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    counter_below_boundary.process(make_frame(0.0, State.TRANSITIONING, 0.45, 120.0))
    counter_below_boundary.process(make_frame(threshold - 0.001, State.STANDING, 0.90, 170.0))
    result_below_boundary = counter_below_boundary.process(
        make_frame(threshold - 0.001 + 0.5, State.SEATED, 0.30, 90.0)
    )
    assert result_below_boundary is None


def test_too_short_but_nonzero_duration_is_discarded():
    counter = RepCounter()
    counter.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    counter.process(make_frame(1.0, State.TRANSITIONING, 0.45, 120.0))
    counter.process(make_frame(1.1, State.STANDING, 0.90, 170.0))  # 0.1s, < 0.3s threshold
    result = counter.process(make_frame(1.6, State.SEATED, 0.30, 90.0))

    assert result is None
    assert counter.rep_count == 0


def test_endpoint_sampling_uses_first_exit_and_first_entry_frame():
    """Both 'SEATED-exit' and 'STANDING-entry' are sampled at the *first*
    frame classified into the new state, per the design doc's endpoint-
    sampling convention -- extra TRANSITIONING frames before the exit is
    detected (there are none, by construction of the state machine) or
    extra frames lingering in a state don't shift the sampled endpoints."""
    counter = RepCounter()

    counter.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    # First non-SEATED frame -- this is the sampled SEATED-exit, must be
    # timestamp 1.0 / height 0.40, not any later TRANSITIONING frame.
    counter.process(make_frame(1.0, State.TRANSITIONING, 0.40, 110.0))
    counter.process(make_frame(1.2, State.TRANSITIONING, 0.55, 130.0))
    counter.process(make_frame(1.4, State.TRANSITIONING, 0.65, 145.0))
    # First STANDING frame -- sampled STANDING-entry.
    counter.process(make_frame(1.7, State.STANDING, 0.90, 170.0))
    rep = counter.process(make_frame(2.2, State.SEATED, 0.30, 90.0))

    assert rep is not None
    assert rep.concentric_time == pytest.approx(1.7 - 1.0)
    assert rep.mean_velocity == pytest.approx((0.90 - 0.40) / (1.7 - 1.0))
    assert rep.timestamp == pytest.approx(1.7)


def test_no_transition_yet_returns_none_and_does_not_count():
    counter = RepCounter()
    result = counter.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    assert result is None
    assert counter.rep_count == 0
    assert counter.failed_stand_count == 0


def test_mean_velocity_reflects_whole_phase_displacement_despite_noisy_intermediate_frames():
    """Integration check that RepCounter actually feeds velocity.py the
    endpoint heights, not e.g. an average of framewise deltas: a
    non-monotonic noisy intermediate sequence must not perturb
    mean_velocity, which depends only on the first/last concentric-phase
    heights and the total concentric_time."""
    counter = RepCounter()

    counter.process(make_frame(0.0, State.SEATED, 0.30, 90.0))
    counter.process(make_frame(0.0, State.TRANSITIONING, 0.30, 100.0))  # SEATED-exit
    counter.process(make_frame(0.25, State.TRANSITIONING, 0.60, 110.0))  # +0.30
    counter.process(make_frame(0.50, State.TRANSITIONING, 0.20, 115.0))  # -0.40 (noisy dip)
    counter.process(make_frame(0.75, State.TRANSITIONING, 0.75, 120.0))  # +0.55
    counter.process(make_frame(1.00, State.STANDING, 0.80, 170.0))  # STANDING-entry, +0.05
    rep = counter.process(make_frame(1.5, State.SEATED, 0.30, 90.0))

    assert rep is not None
    # Endpoint displacement: (0.80 - 0.30) / 1.0 == 0.50, NOT some average
    # of the noisy per-frame deltas (0.30, -0.40, 0.55, 0.05).
    assert rep.mean_velocity == pytest.approx((0.80 - 0.30) / 1.0)
    # peak_velocity, by contrast, DOES see the noisy intermediate deltas.
    assert rep.peak_velocity == pytest.approx(0.55)
