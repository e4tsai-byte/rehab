"""Synthetic fixture builders for the autoregulation test suite.

These build `FrameOutput` and `RepRecord` values directly (no camera, no
model, no `PoseTrackingPipeline`) -- `rep_counter.py`, `velocity.py`, and
`fatigue_stop.py` are all pure consumers of those already-computed types
(per their own module docstrings), so driving them with hand-built
synthetic sequences is the same style as the top-level `tests/conftest.py`
uses one layer down (synthetic `Landmark`/`PoseObservation` -> pipeline).
"""

from typing import List, Optional

from pose_coach.autoregulation.rep_counter import RepRecord
from pose_coach.types import FrameOutput, State


def make_frame(
    timestamp: float,
    state: State,
    hip_height_norm: Optional[float] = None,
    knee_angle_smoothed: Optional[float] = None,
    side_used: Optional[str] = "left",
    visibility: Optional[float] = 0.9,
) -> FrameOutput:
    """Builds a `FrameOutput` with only the fields `rep_counter.py` and
    `velocity.py` actually read (`timestamp`, `state`, `hip_height_norm`,
    `knee_angle_smoothed`) set meaningfully; the rest are filled with
    plausible values. Per types.py's invariant, callers constructing an
    UNKNOWN frame should leave `hip_height_norm`/`knee_angle_smoothed` as
    None (the default) to match what the real pipeline actually produces.
    """
    return FrameOutput(
        timestamp=timestamp,
        side_used=side_used if state is not State.UNKNOWN else None,
        knee_angle_raw=knee_angle_smoothed,
        knee_angle_smoothed=knee_angle_smoothed,
        hip_angle=0.0 if state is not State.UNKNOWN else None,
        trunk_lean=0.0 if state is not State.UNKNOWN else None,
        hip_height_norm=hip_height_norm,
        state=state,
        visibility=visibility if state is not State.UNKNOWN else None,
    )


def make_rep(
    mean_velocity: float,
    range_of_motion: float = 40.0,
    rep_index: int = 1,
    concentric_time: float = 1.0,
    peak_velocity: float = 0.1,
    min_angle: float = 100.0,
    max_angle: float = 140.0,
    form_flags: Optional[List[str]] = None,
    timestamp: float = 0.0,
) -> RepRecord:
    """Builds a `RepRecord` directly, bypassing `RepCounter` entirely --
    for `fatigue_stop.py` tests, which only care about the list of
    `RepRecord`s handed to `summarize_set`, not how they were produced."""
    return RepRecord(
        rep_index=rep_index,
        concentric_time=concentric_time,
        peak_velocity=peak_velocity,
        mean_velocity=mean_velocity,
        range_of_motion=range_of_motion,
        min_angle=min_angle,
        max_angle=max_angle,
        form_flags=form_flags if form_flags is not None else [],
        timestamp=timestamp,
    )
