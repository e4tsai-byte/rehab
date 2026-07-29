"""Pure per-rep velocity/ROM calculations.

Consumes the concentric-phase frame window (SEATED-exit -> STANDING-entry,
inclusive) that `rep_counter.py` has already validated -- no UNKNOWN
frames, plausible duration -- before calling into here. No discard-rule
logic lives here; that's rep_counter.py's job. This module only turns an
already-valid window into numbers, so it stays a plain function of its
arguments, same pure/impure split as geometry.py/measurements.py.
"""

from typing import Sequence, Tuple


def mean_velocity(start_height: float, end_height: float, concentric_time: float) -> float:
    """Whole-phase displacement over time -- (height at STANDING-entry -
    height at SEATED-exit) / concentric_time -- NOT a framewise derivative
    of the (already median-filtered) hip_height_norm stream.

    Design doc, Premise 2 (revised after review): a median filter produces
    a stepwise/quantized signal, and framewise differencing of that signal
    produces real derivative artifacts at each step boundary. Whole-phase
    displacement sidesteps this, and is exactly what velocity_loss_pct
    needs -- a ratio of two mean_velocity values computed identically, so
    residual smoothing bias mostly cancels.

    `concentric_time` must already be confirmed > MIN_CONCENTRIC_DURATION_S
    by the caller (rep_counter.py's duration discard check runs before
    this is ever called) -- this function does not itself guard against
    division by zero.
    """
    return (end_height - start_height) / concentric_time


def peak_velocity(heights: Sequence[float]) -> float:
    """Maximum single-frame delta of the already-smoothed hip_height_norm
    series within the concentric phase, per the design doc's literal
    definition (a raw delta between consecutive samples, not divided by
    per-frame time).

    An explicitly known-limitation estimate: it can be damped during
    steady smoothing, or spiked if it happens to land right after a
    tracking-gap recovery (not a one-directional bias). Acceptable because
    peak_velocity does not drive any decision in this design -- only
    mean_velocity/velocity_loss_pct gate fatigue-stop -- it's captured for
    schema completeness only. Returns 0.0 for a single-frame window (no
    frame-to-frame delta exists).
    """
    if len(heights) < 2:
        return 0.0
    return max(b - a for a, b in zip(heights, heights[1:]))


def rom_stats(knee_angles: Sequence[float]) -> Tuple[float, float, float]:
    """Returns (min_angle, max_angle, range_of_motion) over the concentric-
    phase-scoped `knee_angle_smoothed` values -- same signal already
    driving state classification (design doc: "not a second raw-based
    path"). Scoped to the concentric phase only (SEATED-exit to
    STANDING-entry), not the full rep cycle -- see design doc's Premise 1
    for why that scope choice matters for the discard rule."""
    lo = min(knee_angles)
    hi = max(knee_angles)
    return lo, hi, hi - lo
