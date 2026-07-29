"""Fatigue-stop decision + per-set summary aggregation.

Consumes the `RepRecord` list a `RepCounter` has produced across a set
(plus its `failed_stand_count`) and computes the design doc's Data Model
`SetSummary` fields: `velocity_loss_pct` (first-3 vs. trailing-last-3
mean_velocity), the 20%-threshold `fatigue_stop_triggered` decision, the
first-3-rep baseline-consistency guard (coefficient of variation), and the
minimum-rep-count fallback. Pure logic -- no I/O, operates only on
`RepRecord` values already produced by rep_counter.py.

`recommended_load_next` is deliberately not produced here: it's listed in
the design doc under "Output", separately from the `SetSummary` fields
listed in the Data Model section, and it's driven by progression's
rolling-baseline logic (`progression.py`) -- explicitly out of scope for
this slice per the design doc's Next Steps sequencing.
"""

import statistics
from dataclasses import dataclass
from typing import Optional, Sequence

from .. import config
from ..geometry import EPSILON
from .rep_counter import RepRecord


@dataclass(frozen=True)
class SetSummary:
    """Per-set aggregate, per the design doc's Data Model section.

    `fatigue_stop_triggered` is deliberately tri-state (True/False/None):
    None means "cannot assess via velocity" -- either the baseline-
    consistency guard failed, or there weren't enough reps to compute
    anything -- an explicit state distinct from "assessed as not
    fatigued", never silently defaulted to False (design doc, Round 3
    fix: velocare CLAUDE.md's "prefer declining to make a recommendation
    over making a weak one")."""

    exercise_id: str
    load_label: str
    rep_count: int
    failed_stand_count: int
    first3_mean_velocity: Optional[float]
    last3_mean_velocity: Optional[float]
    velocity_loss_pct: Optional[float]
    fatigue_stop_triggered: Optional[bool]
    mean_rom: Optional[float]
    flag_count: int
    baseline_consistency_ok: bool


def _coefficient_of_variation(values: Sequence[float]) -> float:
    """Population stdev / |mean| -- dispersion of a fixed 3-value window,
    not an estimate drawn from a larger population, so `pstdev` (not the
    Bessel-corrected sample stdev) is used. A near-zero mean makes CV
    undefined/unbounded, which is reported as infinity so the guard always
    fails cleanly (never divides by ~0)."""
    mean = statistics.mean(values)
    if abs(mean) < EPSILON:
        return float("inf")
    return statistics.pstdev(values) / abs(mean)


def summarize_set(
    reps: Sequence[RepRecord],
    failed_stand_count: int,
    exercise_id: str,
    load_label: str,
) -> SetSummary:
    """Builds the `SetSummary` for a set from its counted reps (already
    discard-filtered by `RepCounter`) and failed-stand count. Safe to call
    repeatedly as a set progresses (e.g. after every completed rep, for a
    live-updating demo readout) -- it's a pure function of the reps seen
    so far, not incremental state of its own."""
    rep_count = len(reps)

    if rep_count < config.MIN_REPS_FOR_VELOCITY_STATS:
        # Minimum-rep-count fallback (design doc's Data Model section):
        # not enough data to compute anything else. Covers the
        # all-failed-stand case (rep_count=0, failed_stand_count>0) too --
        # that's still correctly surfaced via failed_stand_count, even
        # with zero velocity data.
        return SetSummary(
            exercise_id=exercise_id,
            load_label=load_label,
            rep_count=rep_count,
            failed_stand_count=failed_stand_count,
            first3_mean_velocity=None,
            last3_mean_velocity=None,
            velocity_loss_pct=None,
            fatigue_stop_triggered=None,
            mean_rom=None,
            flag_count=1,
            baseline_consistency_ok=False,
        )

    first3 = reps[:3]
    last3 = reps[-3:]  # Trailing window; overlaps first3 for short (3-5 rep) sets, per design doc.

    first3_velocities = [r.mean_velocity for r in first3]
    first3_mean_velocity = statistics.mean(first3_velocities)
    last3_mean_velocity = statistics.mean(r.mean_velocity for r in last3)

    baseline_consistency_ok = _coefficient_of_variation(first3_velocities) <= config.CONSISTENCY_GUARD_CV_THRESHOLD

    velocity_loss_pct: Optional[float]
    if abs(first3_mean_velocity) < EPSILON:
        velocity_loss_pct = None
    else:
        velocity_loss_pct = (first3_mean_velocity - last3_mean_velocity) / first3_mean_velocity

    if not baseline_consistency_ok:
        # Consistency guard gates fatigue_stop_triggered too, not just
        # progression (design doc, Round 3 fix): an unreliable first-3
        # baseline means velocity_loss_pct can't be trusted either way.
        fatigue_stop_triggered: Optional[bool] = None
    else:
        fatigue_stop_triggered = (
            velocity_loss_pct is not None
            and velocity_loss_pct >= config.FATIGUE_STOP_VELOCITY_LOSS_THRESHOLD
        )

    mean_rom = statistics.mean(r.range_of_motion for r in reps)
    # flag_count reuses the design doc's flag_count/form_flags mechanism:
    # every rep's (currently always-empty) form_flags, plus one flag when
    # the consistency guard fails -- surfacing "cannot assess" to the
    # facilitator UI rather than a silent fatigue_stop_triggered=None with
    # no visible signal.
    flag_count = sum(len(r.form_flags) for r in reps) + (0 if baseline_consistency_ok else 1)

    return SetSummary(
        exercise_id=exercise_id,
        load_label=load_label,
        rep_count=rep_count,
        failed_stand_count=failed_stand_count,
        first3_mean_velocity=first3_mean_velocity,
        last3_mean_velocity=last3_mean_velocity,
        velocity_loss_pct=velocity_loss_pct,
        fatigue_stop_triggered=fatigue_stop_triggered,
        mean_rom=mean_rom,
        flag_count=flag_count,
        baseline_consistency_ok=baseline_consistency_ok,
    )
