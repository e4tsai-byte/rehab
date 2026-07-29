"""Shared plain data types for the pose-tracking pipeline.

Deliberately decoupled from any MediaPipe-specific result type: `Landmark`
and `PoseObservation` are the only inputs the pure logic in geometry.py,
measurements.py, selection.py, smoothing.py, state_machine.py, and
pipeline.py ever see. That's what lets those modules be unit-tested with
synthetic landmark coordinates, with no camera and no live model inference.
`pose_coach.capture` is the only module responsible for translating real
MediaPipe output into these types.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Sequence


class Side(Enum):
    LEFT = "left"
    RIGHT = "right"


class State(Enum):
    SEATED = "SEATED"
    STANDING = "STANDING"
    TRANSITIONING = "TRANSITIONING"
    UNKNOWN = "UNKNOWN"


@dataclass(frozen=True)
class Landmark:
    """One MediaPipe landmark's fields we use. `visibility` is the field
    name used throughout this codebase (per the design doc's glossary --
    `presence` is not used in this slice)."""

    x: float
    y: float
    z: float
    visibility: float


@dataclass(frozen=True)
class PoseObservation:
    """One detected person's landmarks for a single frame.

    landmarks_2d: 33 normalized image-space landmarks (MediaPipe's
        `pose_landmarks` output) -- used for knee angle, hip angle, trunk
        lean, visibility, and person-selection bounding-box area.
    world_landmarks: 33 metric 3D landmarks (MediaPipe's
        `pose_world_landmarks` output) -- used only for hip_height_norm,
        per the design doc (perspective-invariance requirement).
    """

    landmarks_2d: Sequence[Landmark]
    world_landmarks: Sequence[Landmark]


@dataclass(frozen=True)
class FrameOutput:
    """Per-frame structured output schema, per the design doc's Approach A:
    {timestamp, side_used, knee_angle_raw, knee_angle_smoothed, hip_angle,
    trunk_lean, hip_height_norm, state, visibility}.

    All fields except `timestamp` and `state` are Optional because a frame
    can legitimately have no usable measurement (no person detected, both
    sides below the visibility threshold, or a degenerate zero-length-vector
    geometry edge case) -- in which case `state` is State.UNKNOWN and the
    rest are None, never a guessed/fabricated value.
    """

    timestamp: float
    side_used: Optional[str]
    knee_angle_raw: Optional[float]
    knee_angle_smoothed: Optional[float]
    hip_angle: Optional[float]
    trunk_lean: Optional[float]
    hip_height_norm: Optional[float]
    state: State
    visibility: Optional[float]
