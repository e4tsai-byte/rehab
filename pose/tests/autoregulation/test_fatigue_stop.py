"""Tests for `pose_coach.autoregulation.fatigue_stop.summarize_set`.

Covers the design doc's Success Criteria for the Data Model section, and
specifically verifies the builder's self-reported inferences:

1. `CONSISTENCY_GUARD_CV_THRESHOLD` is a named, visible constant, not a
   buried magic number in fatigue_stop.py.
2. `velocity_loss_pct` is still computed (not forced to None) when the
   consistency guard fails -- only `fatigue_stop_triggered` goes to None.
3. `flag_count` increments by the same amount (+1 above the "no flags"
   baseline) in both the CV-guard-failure case and the <3-rep fallback
   case.
4. `fatigue_stop_triggered` is a genuine tri-state: True, False, and None
   are all reachable, and None is distinguished from False with `is`
   comparisons (this was the design doc's Round-3 safety fix).
"""

import inspect

import pytest

from pose_coach import config
from pose_coach.autoregulation import fatigue_stop
from pose_coach.autoregulation.fatigue_stop import summarize_set

from .conftest import make_rep

EXERCISE_ID = "sit_to_stand"
LOAD_LABEL = "band-1"


def _summarize(reps, failed_stand_count=0):
    return summarize_set(reps, failed_stand_count, EXERCISE_ID, LOAD_LABEL)


# --- Item 1: CONSISTENCY_GUARD_CV_THRESHOLD is a named, visible constant ---

def test_consistency_guard_threshold_is_a_named_config_constant():
    assert hasattr(config, "CONSISTENCY_GUARD_CV_THRESHOLD")
    assert isinstance(config.CONSISTENCY_GUARD_CV_THRESHOLD, float)


def test_consistency_guard_threshold_is_not_a_buried_magic_number():
    """fatigue_stop.py must reference the named constant, not repeat its
    numeric value inline -- otherwise a future tuning-pass edit to
    config.py silently stops governing the actual guard."""
    source = inspect.getsource(fatigue_stop)
    assert "config.CONSISTENCY_GUARD_CV_THRESHOLD" in source
    # The raw literal shouldn't appear anywhere outside of config.py.
    assert str(config.CONSISTENCY_GUARD_CV_THRESHOLD) not in source


# --- Item 4: fatigue_stop_triggered tri-state reachability -----------------

def test_fatigue_stop_triggered_true_when_loss_exceeds_threshold_and_guard_passes():
    first3 = [0.50, 0.51, 0.49]  # low CV -> guard passes
    last3 = [0.35, 0.36, 0.34]  # ~30% loss -> exceeds 20% threshold
    reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate(first3 + last3)]

    summary = _summarize(reps)

    assert summary.baseline_consistency_ok is True
    assert summary.fatigue_stop_triggered is True  # not just truthy
    assert summary.velocity_loss_pct == pytest.approx((0.50 - 0.35) / 0.50)


def test_fatigue_stop_triggered_false_when_loss_below_threshold_and_guard_passes():
    first3 = [0.50, 0.51, 0.49]
    last3 = [0.48, 0.47, 0.49]  # small loss -> below 20% threshold
    reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate(first3 + last3)]

    summary = _summarize(reps)

    assert summary.baseline_consistency_ok is True
    assert summary.fatigue_stop_triggered is False  # not just falsy -- must not be None
    assert summary.velocity_loss_pct is not None


def test_fatigue_stop_triggered_none_when_consistency_guard_fails():
    """The specific safety-relevant regression from design doc Round 3:
    fatigue_stop_triggered must go to None (a distinct 'cannot assess'
    state), not silently default to False, when the first-3-rep baseline
    is too erratic to trust -- even if the raw velocity_loss_pct number
    would otherwise clear the 20% threshold."""
    first3 = [0.20, 0.60, 0.40]  # high CV -> guard fails
    last3 = [0.10, 0.10, 0.10]  # would be a 75% "loss" if trusted
    reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate(first3 + last3)]

    summary = _summarize(reps)

    assert summary.baseline_consistency_ok is False
    assert summary.fatigue_stop_triggered is None
    assert summary.fatigue_stop_triggered is not False  # explicit: None != False


def test_fatigue_stop_triggered_none_when_below_min_rep_count():
    reps = [make_rep(0.5, rep_index=1), make_rep(0.4, rep_index=2)]  # only 2 reps
    summary = _summarize(reps)
    assert summary.fatigue_stop_triggered is None


def test_tri_state_values_are_all_distinguishable():
    """All three fatigue_stop_triggered states must be reachable AND
    mutually distinguishable via identity, not just truthiness -- `None`
    and `False` are both falsy in Python, so a bug that collapses them
    would slip past a truthiness-only check."""
    true_reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate([0.50, 0.51, 0.49, 0.35, 0.36, 0.34])]
    false_reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate([0.50, 0.51, 0.49, 0.48, 0.47, 0.49])]
    none_reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate([0.20, 0.60, 0.40, 0.10, 0.10, 0.10])]

    results = {
        _summarize(true_reps).fatigue_stop_triggered,
        _summarize(false_reps).fatigue_stop_triggered,
        _summarize(none_reps).fatigue_stop_triggered,
    }
    assert results == {True, False, None}


# --- Item 2: velocity_loss_pct still computed when the guard fails --------

def test_velocity_loss_pct_is_still_computed_when_consistency_guard_fails():
    first3 = [0.20, 0.60, 0.40]  # high CV -> guard fails
    last3 = [0.10, 0.10, 0.10]
    reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate(first3 + last3)]

    summary = _summarize(reps)

    assert summary.baseline_consistency_ok is False
    assert summary.fatigue_stop_triggered is None
    # velocity_loss_pct is NOT nulled out by the guard failure -- only
    # fatigue_stop_triggered is.
    first3_mean = (0.20 + 0.60 + 0.40) / 3
    last3_mean = 0.10
    assert summary.velocity_loss_pct == pytest.approx((first3_mean - last3_mean) / first3_mean)
    assert summary.first3_mean_velocity == pytest.approx(first3_mean)
    assert summary.last3_mean_velocity == pytest.approx(last3_mean)


# --- Item 3: flag_count increments consistently across both cases ---------

def test_flag_count_increments_on_consistency_guard_failure():
    first3 = [0.20, 0.60, 0.40]
    last3 = [0.10, 0.10, 0.10]
    reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate(first3 + last3)]
    summary = _summarize(reps)
    # form_flags is always empty in this slice, so the +1 is entirely from
    # the guard-failure flag.
    assert summary.flag_count == 1


def test_flag_count_increments_on_below_min_rep_fallback():
    reps = [make_rep(0.5, rep_index=1), make_rep(0.4, rep_index=2)]
    summary = _summarize(reps)
    assert summary.flag_count == 1


def test_flag_count_is_consistent_across_both_flagging_paths():
    """The two independent code paths that set flag_count=1 (the <3-rep
    fallback branch, and the consistency-guard-failure branch inside the
    >=3-rep path) must actually agree with each other -- not an
    accidentally-different flag value."""
    fallback_reps = [make_rep(0.5, rep_index=1)]
    cv_fail_reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate([0.20, 0.60, 0.40, 0.10, 0.10, 0.10])]

    fallback_summary = _summarize(fallback_reps)
    cv_fail_summary = _summarize(cv_fail_reps)

    assert fallback_summary.flag_count == cv_fail_summary.flag_count == 1


def test_flag_count_zero_when_guard_passes_and_no_form_flags():
    first3 = [0.50, 0.51, 0.49]
    last3 = [0.48, 0.47, 0.49]
    reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate(first3 + last3)]
    summary = _summarize(reps)
    assert summary.flag_count == 0


# --- Minimum-rep-count / all-failed-stand fallback -------------------------

def test_below_min_reps_nulls_all_velocity_and_rom_fields():
    reps = [make_rep(0.5, rep_index=1), make_rep(0.4, rep_index=2)]
    summary = _summarize(reps, failed_stand_count=1)

    assert summary.rep_count == 2
    assert summary.failed_stand_count == 1
    assert summary.first3_mean_velocity is None
    assert summary.last3_mean_velocity is None
    assert summary.velocity_loss_pct is None
    assert summary.fatigue_stop_triggered is None
    assert summary.mean_rom is None
    assert summary.baseline_consistency_ok is False
    assert summary.flag_count == 1


def test_zero_reps_is_covered_by_the_same_fallback():
    summary = _summarize([], failed_stand_count=0)
    assert summary.rep_count == 0
    assert summary.first3_mean_velocity is None
    assert summary.velocity_loss_pct is None
    assert summary.fatigue_stop_triggered is None


def test_all_failed_stand_set_surfaces_failed_stand_count_with_no_velocity_data():
    """rep_count=0 with failed_stand_count>0 -- itself a safety-relevant
    signal (design doc) -- must still be correctly reported even though
    every other field is None."""
    summary = _summarize([], failed_stand_count=5)

    assert summary.rep_count == 0
    assert summary.failed_stand_count == 5
    assert summary.first3_mean_velocity is None
    assert summary.velocity_loss_pct is None
    assert summary.fatigue_stop_triggered is None
    assert summary.mean_rom is None


def test_exactly_three_reps_does_not_hit_the_fallback():
    reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate([0.50, 0.45, 0.40])]
    summary = _summarize(reps)
    assert summary.rep_count == 3
    assert summary.first3_mean_velocity is not None


# --- Trailing-window overlap for short sets ---------------------------------

def test_trailing_window_overlaps_first3_for_a_four_rep_set():
    velocities = [0.40, 0.45, 0.50, 0.20]
    reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate(velocities)]

    summary = _summarize(reps)

    first3_expected = (0.40 + 0.45 + 0.50) / 3
    last3_expected = (0.45 + 0.50 + 0.20) / 3  # reps[-3:] == reps[1:4], overlapping first3 at indices 1,2

    assert summary.first3_mean_velocity == pytest.approx(first3_expected)
    assert summary.last3_mean_velocity == pytest.approx(last3_expected)
    assert summary.velocity_loss_pct == pytest.approx((first3_expected - last3_expected) / first3_expected)


# --- mean_rom averages over all reps, not just first/last3 -----------------

def test_mean_rom_averages_all_reps():
    velocities = [0.50, 0.51, 0.49, 0.50, 0.50]
    roms = [30.0, 40.0, 50.0, 60.0, 70.0]
    reps = [
        make_rep(v, range_of_motion=r, rep_index=i + 1)
        for i, (v, r) in enumerate(zip(velocities, roms))
    ]
    summary = _summarize(reps)
    assert summary.mean_rom == pytest.approx(sum(roms) / len(roms))


# --- Near-zero first3_mean_velocity edge case -------------------------------

def test_near_zero_first3_mean_velocity_nulls_velocity_loss_pct():
    first3 = [1e-10, 1e-10, 1e-10]  # within EPSILON of zero
    last3 = [0.10, 0.10, 0.10]
    reps = [make_rep(v, rep_index=i + 1) for i, v in enumerate(first3 + last3)]

    summary = _summarize(reps)

    assert summary.velocity_loss_pct is None


# --- Scope boundary: recommended_load_next is not produced here ------------

def test_summarize_set_does_not_produce_recommended_load_next():
    """Per the design doc, `recommended_load_next` is driven by
    progression.py (out of scope for this slice) -- summarize_set must not
    fabricate a value for it."""
    reps = [make_rep(0.5, rep_index=1), make_rep(0.4, rep_index=2), make_rep(0.3, rep_index=3)]
    summary = _summarize(reps)
    assert not hasattr(summary, "recommended_load_next")
