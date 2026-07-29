"""Impure I/O layer: OpenCV webcam capture + MediaPipe Pose Landmarker
(Tasks API, VIDEO running mode, num_poses=1) inference.

Deliberately kept separate from pose_coach.pipeline: this module's only job
is turning a real camera + a real model into the plain PoseObservation type
pipeline.py operates on. None of the angle math / state classification /
hysteresis / smoothing logic lives here, so it can be exercised without a
camera or a live model in tests.

Running mode: VIDEO (synchronous, sequential timestamped frames) -- not
LIVE_STREAM, which is async/callback-based and a materially different code
shape. VIDEO mode is the right fit for a synchronous webcam-read loop, per
the design doc.
"""

import time
from pathlib import Path
from typing import List, Tuple

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks_python
from mediapipe.tasks.python import vision as mp_vision

from . import config
from .types import Landmark, PoseObservation


class CameraUnavailableError(RuntimeError):
    """Raised when OpenCV can't open the requested camera device."""


class ModelLoadError(RuntimeError):
    """Raised when the MediaPipe pose landmarker model asset is missing or
    fails to load."""


def _to_landmarks(mp_landmarks) -> List[Landmark]:
    return [Landmark(x=lm.x, y=lm.y, z=lm.z, visibility=lm.visibility) for lm in mp_landmarks]


class PoseCapture:
    """Owns the webcam device and the MediaPipe PoseLandmarker instance.

    Both the camera and the model asset are opened/loaded in __init__, so
    failures surface before any frame loop starts -- per the design doc's
    Failure Modes: "fail fast with a clear message ... not on the first
    frame."
    """

    def __init__(
        self,
        camera_index: int = config.DEFAULT_CAMERA_INDEX,
        model_path: str = str(config.MODEL_ASSET_PATH),
    ):
        self._camera_index = camera_index
        self._video_capture = cv2.VideoCapture(camera_index)
        if not self._video_capture.isOpened():
            self._video_capture.release()
            raise CameraUnavailableError(
                f"Could not open webcam at device index {camera_index}. "
                "Check that a camera is connected and not already in use by another app."
            )

        model_path_obj = Path(model_path)
        if not model_path_obj.is_file():
            self._video_capture.release()
            raise ModelLoadError(
                f"Pose landmarker model asset not found at {model_path_obj}. "
                "See models/README.md for how to download and verify it before running a demo."
            )

        try:
            base_options = mp_tasks_python.BaseOptions(model_asset_path=str(model_path_obj))
            options = mp_vision.PoseLandmarkerOptions(
                base_options=base_options,
                running_mode=mp_vision.RunningMode.VIDEO,
                num_poses=1,
            )
            self._landmarker = mp_vision.PoseLandmarker.create_from_options(options)
        except Exception as exc:
            self._video_capture.release()
            raise ModelLoadError(
                f"Failed to load pose landmarker model from {model_path_obj}: {exc}"
            ) from exc

        self._start_time = time.monotonic()
        self._last_timestamp_ms = -1
        self._logged_inference_error = False

    def _next_timestamp_ms(self) -> int:
        timestamp_ms = int((time.monotonic() - self._start_time) * 1000)
        if timestamp_ms <= self._last_timestamp_ms:
            # VIDEO mode requires strictly increasing timestamps; guard
            # against two reads landing in the same millisecond.
            timestamp_ms = self._last_timestamp_ms + 1
        self._last_timestamp_ms = timestamp_ms
        return timestamp_ms

    def read(self) -> Tuple[object, List[PoseObservation], float]:
        """Returns (frame_bgr, observations, timestamp_seconds).

        `frame_bgr` is None if the camera stream has ended (caller should
        stop the loop). `observations` has length 0 or 1 given num_poses=1,
        and is empty (never a crash) on a failed-inference or
        no-detection frame.
        """
        ok, frame = self._video_capture.read()
        if not ok:
            return None, [], 0.0

        timestamp_ms = self._next_timestamp_ms()
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        try:
            result = self._landmarker.detect_for_video(mp_image, timestamp_ms)
        except Exception as exc:
            # Per the design doc: an inference exception on a single frame
            # (corrupt frame, dropped USB frame, malformed output) is
            # treated as no-detection for that frame, logged once (not
            # per-frame spam), and the loop continues.
            if not self._logged_inference_error:
                print(f"[warn] pose inference failed on a frame, treating as no-detection: {exc}")
                self._logged_inference_error = True
            return frame, [], timestamp_ms / 1000.0

        observations = [
            PoseObservation(
                landmarks_2d=_to_landmarks(landmarks_2d),
                world_landmarks=_to_landmarks(world_landmarks),
            )
            for landmarks_2d, world_landmarks in zip(result.pose_landmarks, result.pose_world_landmarks)
        ]
        return frame, observations, timestamp_ms / 1000.0

    def close(self) -> None:
        self._video_capture.release()
        self._landmarker.close()
