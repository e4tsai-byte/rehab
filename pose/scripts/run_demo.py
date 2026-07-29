#!/usr/bin/env python3
"""Live webcam entry point: pose tracking + sit-to-stand state
classification demo (SEATED / STANDING / TRANSITIONING / UNKNOWN).

Usage:
    python scripts/run_demo.py [--camera-index 0] [--model-path PATH]

Before running: download the pose_landmarker_lite model asset --
see models/README.md. The model is pre-bundled locally (not fetched over
the network at runtime) so a flaky venue network can't trigger the
model-load failure path during a live demo.

Press 'q' or Esc in the preview window to quit. No image or video frame is
ever written to disk -- only the console log below (throttled to
state-change events, not every frame).
"""

import argparse
import sys

import cv2

from pose_coach import config
from pose_coach.capture import CameraUnavailableError, ModelLoadError, PoseCapture
from pose_coach.overlay import draw_skeleton, draw_state_label
from pose_coach.pipeline import PoseTrackingPipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--camera-index",
        type=int,
        default=config.DEFAULT_CAMERA_INDEX,
        help=f"OpenCV camera device index (default: {config.DEFAULT_CAMERA_INDEX}).",
    )
    parser.add_argument(
        "--model-path",
        type=str,
        default=str(config.MODEL_ASSET_PATH),
        help=f"Path to pose_landmarker_lite.task (default: {config.MODEL_ASSET_PATH}).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        capture = PoseCapture(camera_index=args.camera_index, model_path=args.model_path)
    except (CameraUnavailableError, ModelLoadError) as exc:
        print(f"[fatal] {exc}", file=sys.stderr)
        return 1

    pipeline = PoseTrackingPipeline()
    last_logged_state = None
    window_name = "PHIT Pose Tracking (q to quit)"

    try:
        while True:
            frame, observations, timestamp = capture.read()
            if frame is None:
                print("[info] camera stream ended.")
                break

            output = pipeline.process_frame(observations, timestamp)

            if observations:
                draw_skeleton(frame, observations[0].landmarks_2d)
            draw_state_label(frame, output.state.value)
            cv2.imshow(window_name, frame)

            if output.state.value != last_logged_state:
                print(
                    f"[{output.timestamp:7.2f}s] state={output.state.value:<13} "
                    f"side={output.side_used} "
                    f"knee={output.knee_angle_smoothed} "
                    f"hip_height={output.hip_height_norm}"
                )
                last_logged_state = output.state.value

            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):  # 'q' or Esc
                break
    finally:
        capture.close()
        cv2.destroyAllWindows()

    return 0


if __name__ == "__main__":
    sys.exit(main())
