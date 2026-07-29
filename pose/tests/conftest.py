"""Shared synthetic-landmark fixture builders for the pure-logic test suite.

Nothing in here touches MediaPipe, OpenCV, or a camera -- these build plain
`pose_coach.types.Landmark` / `PoseObservation` objects directly, which is
exactly what `pose_coach.pipeline.PoseTrackingPipeline.process_frame` (and
everything it calls) consumes. See pose_coach/types.py's module docstring:
this decoupling is what makes the pure logic unit-testable without a camera
or a live model.
"""

import math

import pytest

from pose_coach import config
from pose_coach.types import Landmark, PoseObservation, Side

NUM_LANDMARKS = 33

_SIDE_INDICES = {
    Side.LEFT: dict(shoulder=config.LEFT_SHOULDER, hip=config.LEFT_HIP,
                     knee=config.LEFT_KNEE, ankle=config.LEFT_ANKLE),
    Side.RIGHT: dict(shoulder=config.RIGHT_SHOULDER, hip=config.RIGHT_HIP,
                      knee=config.RIGHT_KNEE, ankle=config.RIGHT_ANKLE),
}


def _default_landmark_list(visibility=0.9):
    """33 filler landmarks, spread out slightly around a center point so
    bbox_area is well-defined and non-degenerate, all at a fixed
    visibility unless overridden per-index by the caller."""
    return [
        Landmark(x=0.5 + 0.001 * i, y=0.5 + 0.001 * i, z=0.0, visibility=visibility)
        for i in range(NUM_LANDMARKS)
    ]


def _place_side_2d(landmarks, side, knee_angle_deg, visibility, center=(0.5, 0.6), segment=0.15):
    """Places shoulder/hip/knee/ankle 2D landmarks for `side` such that the
    interior knee angle (HIP-KNEE-ANKLE) equals `knee_angle_deg` exactly.

    Derivation: put knee at `center`. hip = knee + (0, -segment) (straight
    up, in image coords where y increases downward). ankle is placed at
    unit vector (sin(theta), -cos(theta)) * segment from knee, where theta
    is the desired angle -- this makes dot(knee->hip, knee->ankle) /
    (|knee->hip| * |knee->ankle|) = cos(theta) exactly (both are
    `segment`-length vectors), so
    geometry.interior_angle_deg(knee, hip, ankle) == theta.
    Shoulder is placed further above the hip so hip_angle/trunk_lean stay
    non-degenerate (not gated on by the state machine, but must not
    divide-by-zero).
    """
    idx = _SIDE_INDICES[side]
    kx, ky = center
    theta = math.radians(knee_angle_deg)

    hip_xy = (kx, ky - segment)
    ankle_xy = (kx + segment * math.sin(theta), ky - segment * math.cos(theta))
    shoulder_xy = (hip_xy[0], hip_xy[1] - segment)

    landmarks[idx["knee"]] = Landmark(x=kx, y=ky, z=0.0, visibility=visibility)
    landmarks[idx["hip"]] = Landmark(x=hip_xy[0], y=hip_xy[1], z=0.0, visibility=visibility)
    landmarks[idx["ankle"]] = Landmark(x=ankle_xy[0], y=ankle_xy[1], z=0.0, visibility=visibility)
    landmarks[idx["shoulder"]] = Landmark(x=shoulder_xy[0], y=shoulder_xy[1], z=0.0, visibility=visibility)
    return landmarks


def _place_side_world(landmarks, side, hip_height_ratio, torso_length=0.5):
    """Places world-landmark shoulder/hip/ankle for `side` such that
    measurements.hip_height_norm (= (ankle.y - hip.y) / dist(shoulder,
    hip), computed on the 3D world landmarks) equals `hip_height_ratio`
    exactly: hip at origin, shoulder `torso_length` away along -y (so the
    shoulder-hip distance is exactly torso_length), ankle offset from hip
    by `hip_height_ratio * torso_length` along y.
    """
    idx = _SIDE_INDICES[side]
    landmarks[idx["hip"]] = Landmark(x=0.0, y=0.0, z=0.0, visibility=0.9)
    landmarks[idx["shoulder"]] = Landmark(x=0.0, y=-torso_length, z=0.0, visibility=0.9)
    landmarks[idx["ankle"]] = Landmark(x=0.0, y=hip_height_ratio * torso_length, z=0.0, visibility=0.9)
    landmarks[idx["knee"]] = Landmark(x=0.0, y=hip_height_ratio * torso_length / 2, z=0.0, visibility=0.9)
    return landmarks


def make_observation(
    knee_angle_deg=180.0,
    hip_height_ratio=0.5,
    side=Side.LEFT,
    visibility=0.9,
    other_side_visibility=0.1,
    bbox_scale=1.0,
):
    """Builds a full 33-landmark PoseObservation with the given side's
    knee angle / hip-height ratio / visibility set exactly, and the other
    side filled in with a neutral standing-ish pose at `other_side_visibility`
    (so SideSelector has real numbers to compare against, per its
    average-visibility-per-side contract)."""
    other = Side.RIGHT if side is Side.LEFT else Side.LEFT

    landmarks_2d = _default_landmark_list(visibility=0.9)
    landmarks_2d = _place_side_2d(landmarks_2d, side, knee_angle_deg, visibility)
    landmarks_2d = _place_side_2d(landmarks_2d, other, 180.0, other_side_visibility,
                                   center=(0.5 + 0.2, 0.6))

    if bbox_scale != 1.0:
        landmarks_2d = [
            Landmark(x=0.5 + (lm.x - 0.5) * bbox_scale, y=0.5 + (lm.y - 0.5) * bbox_scale,
                     z=lm.z, visibility=lm.visibility)
            for lm in landmarks_2d
        ]

    world_landmarks = _default_landmark_list(visibility=0.9)
    world_landmarks = _place_side_world(world_landmarks, side, hip_height_ratio)
    world_landmarks = _place_side_world(world_landmarks, other, 0.5)

    return PoseObservation(landmarks_2d=landmarks_2d, world_landmarks=world_landmarks)


def make_low_visibility_observation(visibility=0.1):
    """A PoseObservation where both sides are below VISIBILITY_THRESHOLD --
    the "occluded / can't classify" case the design doc says must yield
    UNKNOWN rather than a guessed state."""
    return make_observation(
        knee_angle_deg=130.0,
        hip_height_ratio=0.7,
        side=Side.LEFT,
        visibility=visibility,
        other_side_visibility=visibility,
    )
