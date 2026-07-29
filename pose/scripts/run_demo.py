#!/usr/bin/env python3
"""Live webcam entry point: pose tracking + sit-to-stand state
classification demo (SEATED / STANDING / TRANSITIONING / UNKNOWN), plus a
live rep counter and velocity-loss readout
(docs/rep-counting-velocity-loss-design.md).

Usage:
    python scripts/run_demo.py [--camera-index 0] [--model-path PATH]

Before running: download the pose_landmarker_lite model asset --
see models/README.md. The model is pre-bundled locally (not fetched over
the network at runtime) so a flaky venue network can't trigger the
model-load failure path during a live demo.

The whole camera session is treated as one set (start_set()/end_set() are
a standalone-demo convention per the design doc's Data Model section --
launch = start, quit = end; a real facilitator-driven set boundary is part
of the not-yet-built SessionDataSource follow-up). The final SetSummary is
printed to the console on quit.

Press 'q' or Esc in the preview window to quit. No image or video frame is
ever written to disk -- only the console log below (throttled to
state-change events, not every frame).
"""

import argparse
import sys

import cv2

from pose_coach import config
from pose_coach.autoregulation.fatigue_stop import summarize_set
from pose_coach.autoregulation.rep_counter import RepCounter
from pose_coach.capture import CameraUnavailableError, ModelLoadError, PoseCapture
from pose_coach.overlay import draw_autoregulation_panel, draw_skeleton, draw_state_label
from pose_coach.pipeline import PoseTrackingPipeline

# Demo-only placeholders: this slice doesn't build a facilitator UI or
# exercise/load selection, so these are fixed per the design doc's
# never-hardcode-a-mechanism constraint (load_label is an opaque ladder
# rung, not a real band color).
DEMO_EXERCISE_ID = "sit_to_stand"
DEMO_LOAD_LABEL = "band-1"


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
    rep_counter = RepCounter()  # start_set(): fresh counter for this session.
    reps = []
    set_summary = summarize_set(reps, rep_counter.failed_stand_count, DEMO_EXERCISE_ID, DEMO_LOAD_LABEL)
    last_logged_state = None
    window_name = "PHIT Pose Tracking (q to quit)"

    try:
        while True:
            frame, observations, timestamp = capture.read()
            if frame is None:
                print("[info] camera stream ended.")
                break

            output = pipeline.process_frame(observations, timestamp)
            new_rep = rep_counter.process(output)
            if new_rep is not None:
                reps.append(new_rep)
                set_summary = summarize_set(
                    reps, rep_counter.failed_stand_count, DEMO_EXERCISE_ID, DEMO_LOAD_LABEL
                )
                print(
                    f"[{output.timestamp:7.2f}s] rep #{new_rep.rep_index} counted "
                    f"(concentric_time={new_rep.concentric_time:.2f}s "
                    f"mean_velocity={new_rep.mean_velocity:.3f} rom={new_rep.range_of_motion:.1f} deg)"
                )

            if observations:
                draw_skeleton(frame, observations[0].landmarks_2d)
            draw_state_label(frame, output.state.value)
            draw_autoregulation_panel(
                frame,
                rep_count=rep_counter.rep_count,
                failed_stand_count=rep_counter.failed_stand_count,
                velocity_loss_pct=set_summary.velocity_loss_pct,
                fatigue_stop_triggered=set_summary.fatigue_stop_triggered,
            )
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

    # end_set(): standalone-demo convention (design doc's Data Model
    # section) -- print the final SetSummary now that the session's over.
    print(
        f"[info] set complete: rep_count={set_summary.rep_count} "
        f"failed_stand_count={set_summary.failed_stand_count} "
        f"velocity_loss_pct={set_summary.velocity_loss_pct} "
        f"fatigue_stop_triggered={set_summary.fatigue_stop_triggered} "
        f"baseline_consistency_ok={set_summary.baseline_consistency_ok}"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
