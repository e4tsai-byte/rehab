"""Tests for the pure functions in `pose_coach.autoregulation.velocity`.

These are plain functions of their arguments (no pipeline, no FrameOutput
needed) -- see velocity.py's module docstring: discard-rule validation is
rep_counter.py's job, this module only turns an already-valid window into
numbers.
"""

import pytest

from pose_coach.autoregulation.velocity import mean_velocity, peak_velocity, rom_stats


def test_mean_velocity_is_whole_phase_displacement_over_time():
    assert mean_velocity(start_height=0.30, end_height=0.80, concentric_time=2.0) == pytest.approx(0.25)


def test_mean_velocity_can_be_negative():
    """Pure function of its arguments -- no clamping. A backward net
    displacement (e.g. a mis-scoped window) should surface as a negative
    number, not be silently floored at zero."""
    assert mean_velocity(start_height=0.80, end_height=0.30, concentric_time=2.0) == pytest.approx(-0.25)


def test_mean_velocity_scales_inversely_with_time():
    fast = mean_velocity(0.0, 0.5, concentric_time=0.5)
    slow = mean_velocity(0.0, 0.5, concentric_time=1.0)
    assert fast == pytest.approx(2 * slow)


def test_peak_velocity_empty_sequence_returns_zero():
    assert peak_velocity([]) == 0.0


def test_peak_velocity_single_frame_returns_zero():
    """No frame-to-frame delta exists with only one sample."""
    assert peak_velocity([0.55]) == 0.0


def test_peak_velocity_is_max_single_frame_delta_not_total_displacement():
    heights = [0.10, 0.15, 0.50, 0.52, 0.90]
    # Per-frame deltas: 0.05, 0.35, 0.02, 0.38 -> max is 0.38.
    # Total endpoint displacement would be 0.80 -- must NOT be that.
    assert peak_velocity(heights) == pytest.approx(0.38)
    assert peak_velocity(heights) != pytest.approx(0.80)


def test_peak_velocity_handles_non_monotonic_sequences():
    heights = [0.5, 0.3, 0.9, 0.4]
    # Deltas: -0.2, 0.6, -0.5 -> max is 0.6.
    assert peak_velocity(heights) == pytest.approx(0.6)


def test_rom_stats_returns_min_max_and_range():
    lo, hi, rom = rom_stats([100.0, 140.0, 90.0, 150.0])
    assert lo == pytest.approx(90.0)
    assert hi == pytest.approx(150.0)
    assert rom == pytest.approx(60.0)


def test_rom_stats_single_value_has_zero_range():
    lo, hi, rom = rom_stats([120.0])
    assert lo == pytest.approx(120.0)
    assert hi == pytest.approx(120.0)
    assert rom == pytest.approx(0.0)
