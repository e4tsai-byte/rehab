"""Impure I/O layer: OpenCV skeleton + state-label drawing on the live
preview window. No persistence -- these functions only mutate an in-memory
frame that gets shown via cv2.imshow and then discarded; nothing here ever
calls cv2.imwrite or otherwise writes a frame to disk, per the design doc's
no-video-persistence constraint.
"""

from typing import Optional, Sequence

import cv2

from . import config
from .types import Landmark

# Standard BlazePose/MediaPipe Pose 33-point skeleton topology, hardcoded
# as (start_index, end_index) pairs. Per the design doc's Premise 3, this
# codebase uses the modern Tasks API (see capture.py) and explicitly does
# not use the deprecated legacy `mp.solutions.pose` module -- this constant
# used to be sourced from that legacy module purely to get this static,
# public/stable topology list, which doesn't require any mediapipe API
# surface at all. Body-landmark indices reuse the named constants already
# defined in config.py for consistency; face/limb indices not tracked
# elsewhere in the codebase are inlined with comments.
_POSE_CONNECTIONS = (
    # Face
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10),
    # Shoulders
    (config.LEFT_SHOULDER, config.RIGHT_SHOULDER),
    # Left arm: shoulder -> elbow -> wrist -> hand
    (config.LEFT_SHOULDER, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    # Right arm: shoulder -> elbow -> wrist -> hand
    (config.RIGHT_SHOULDER, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    # Torso sides
    (config.LEFT_SHOULDER, config.LEFT_HIP),
    (config.RIGHT_SHOULDER, config.RIGHT_HIP),
    (config.LEFT_HIP, config.RIGHT_HIP),
    # Left leg: hip -> knee -> ankle -> foot
    (config.LEFT_HIP, config.LEFT_KNEE), (config.LEFT_KNEE, config.LEFT_ANKLE),
    (config.LEFT_ANKLE, 29), (config.LEFT_ANKLE, 31), (29, 31),
    # Right leg: hip -> knee -> ankle -> foot
    (config.RIGHT_HIP, config.RIGHT_KNEE), (config.RIGHT_KNEE, config.RIGHT_ANKLE),
    (config.RIGHT_ANKLE, 30), (config.RIGHT_ANKLE, 32), (30, 32),
)

_STATE_COLORS = {
    "SEATED": (60, 180, 75),
    "STANDING": (0, 165, 255),
    "TRANSITIONING": (0, 220, 220),
    "UNKNOWN": (60, 60, 200),
}
_DEFAULT_COLOR = (255, 255, 255)


def draw_skeleton(frame, landmarks_2d: Sequence[Landmark]) -> None:
    """Draws the 33-point skeleton on `frame` (BGR, mutated in place) from
    normalized (0-1) 2D landmarks."""
    if not landmarks_2d:
        return
    height, width = frame.shape[:2]
    points = [(int(lm.x * width), int(lm.y * height)) for lm in landmarks_2d]
    for start_idx, end_idx in _POSE_CONNECTIONS:
        cv2.line(frame, points[start_idx], points[end_idx], (255, 255, 255), 2)
    for x, y in points:
        cv2.circle(frame, (x, y), 3, (0, 255, 0), -1)


def draw_state_label(frame, state_name: str) -> None:
    color = _STATE_COLORS.get(state_name, _DEFAULT_COLOR)
    cv2.putText(
        frame,
        state_name,
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.1,
        color,
        2,
        cv2.LINE_AA,
    )


_FATIGUE_STOP_COLORS = {
    True: (60, 60, 200),  # matches _STATE_COLORS["UNKNOWN"]'s alert red
    False: (60, 180, 75),  # matches _STATE_COLORS["SEATED"]'s green
    None: (0, 220, 220),  # matches _STATE_COLORS["TRANSITIONING"]'s "can't tell" yellow
}


def draw_autoregulation_panel(
    frame,
    rep_count: int,
    failed_stand_count: int,
    velocity_loss_pct: Optional[float],
    fatigue_stop_triggered: Optional[bool],
) -> None:
    """Live rep count + velocity-loss readout, drawn under the state label.
    `velocity_loss_pct`/`fatigue_stop_triggered` are None below the
    minimum-rep-count fallback or when the baseline-consistency guard
    fails (design doc) -- rendered as "--" / a distinct "?" color rather
    than a fabricated 0%/False."""
    cv2.putText(
        frame,
        f"Reps: {rep_count}   Failed stands: {failed_stand_count}",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        _DEFAULT_COLOR,
        2,
        cv2.LINE_AA,
    )

    loss_text = "--" if velocity_loss_pct is None else f"{velocity_loss_pct * 100:.0f}%"
    cv2.putText(
        frame,
        f"Velocity loss: {loss_text}",
        (20, 115),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        _DEFAULT_COLOR,
        2,
        cv2.LINE_AA,
    )

    if fatigue_stop_triggered is True:
        status_text = "FATIGUE STOP"
    elif fatigue_stop_triggered is False:
        status_text = "OK"
    else:
        status_text = "N/A (< 3 reps or inconsistent baseline)"
    cv2.putText(
        frame,
        status_text,
        (20, 150),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        _FATIGUE_STOP_COLORS[fatigue_stop_triggered],
        2,
        cv2.LINE_AA,
    )
