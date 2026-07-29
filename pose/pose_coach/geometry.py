"""Pure vector/angle math. No MediaPipe, no OpenCV, no state -- every
function here is a plain function of its arguments, operating on plain
(x, y) / (x, y, z) tuples of floats.

Numerical edge cases (per design doc): any acos argument is clamped to
[-1, 1] (floating-point error can push a mathematically-valid cosine
slightly outside the domain and crash `math.acos`), and zero-length vectors
(two landmarks coinciding near an occlusion boundary) are guarded against
before dividing -- `angle_between_vectors_deg` returns None rather than
raising, so a degenerate frame degrades gracefully instead of crashing a
live demo.
"""

import math

EPSILON = 1e-9


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def vector(a, b):
    """b - a, for two same-length coordinate tuples (works for 2D or 3D)."""
    return tuple(bi - ai for ai, bi in zip(a, b))


def dot(v1, v2) -> float:
    return sum(a * b for a, b in zip(v1, v2))


def magnitude(v) -> float:
    return math.sqrt(dot(v, v))


def angle_between_vectors_deg(v1, v2):
    """Interior angle in degrees between two vectors of equal dimension.

    Returns None if either vector is (near-)zero-length -- a degenerate
    case (e.g. two coincident landmarks) that would otherwise divide by
    zero. Callers must treat None as 'angle unavailable this frame', not
    substitute a default.
    """
    m1, m2 = magnitude(v1), magnitude(v2)
    if m1 < EPSILON or m2 < EPSILON:
        return None
    cos_angle = clamp(dot(v1, v2) / (m1 * m2), -1.0, 1.0)
    return math.degrees(math.acos(cos_angle))


def interior_angle_deg(vertex, point_a, point_b):
    """Interior angle at `vertex` formed by rays to `point_a` and
    `point_b` (all coordinate tuples of equal dimension)."""
    return angle_between_vectors_deg(vector(vertex, point_a), vector(vertex, point_b))


def angle_to_vertical_deg(vector_2d):
    """Angle in degrees between a 2D (x, y) vector and straight-up, in
    normalized-landmark/image coordinates where y increases downward (so
    'straight up' is (0, -1)). Used for trunk lean; assumes a level,
    non-tilted camera per the design doc."""
    return angle_between_vectors_deg(vector_2d, (0.0, -1.0))


def euclidean_distance(a, b) -> float:
    return magnitude(vector(a, b))


def bbox_area(points_2d) -> float:
    """Axis-aligned bounding-box area over an iterable of (x, y) points.
    Used as the person-selection score (largest bbox = tracked candidate)."""
    points_2d = list(points_2d)
    if not points_2d:
        return 0.0
    xs = [p[0] for p in points_2d]
    ys = [p[1] for p in points_2d]
    return (max(xs) - min(xs)) * (max(ys) - min(ys))
