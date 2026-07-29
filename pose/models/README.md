# Pose Landmarker model asset

This project requires MediaPipe's `pose_landmarker_lite.task` model bundle,
downloaded once and kept locally in this directory (it is not committed to
git -- see `.gitignore`) so a flaky venue network can't trigger the
model-load failure path during a live demo (per the design doc's Failure
Modes and Approach A performance-target note).

Expected path (default, overridable via `--model-path`):

    models/pose_landmarker_lite.task

## Download

    curl -L -o models/pose_landmarker_lite.task \
      https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task

This URL follows MediaPipe's documented model-hosting pattern
(`storage.googleapis.com/mediapipe-models/<task>/<variant>/<precision>/latest/<file>.task`).
Double-check it against the current model list at
https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/index#models
before relying on it -- MediaPipe has moved/renamed model URLs before, and
this was not verified against a live network fetch by the builder.

## Verify

Confirm the file downloaded fully and MediaPipe can actually load it
(this is exactly the model-load path `pose_coach.capture.PoseCapture`
exercises at startup):

    python -c "
    from mediapipe.tasks.python import vision
    from mediapipe.tasks.python.core.base_options import BaseOptions
    opts = vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path='models/pose_landmarker_lite.task'))
    vision.PoseLandmarker.create_from_options(opts)
    print('model loads OK')
    "

The lite variant is on the order of a few MB. If the download was
truncated (partial/corrupt file), `create_from_options` will raise --
resume with `curl -L -C -` or delete and re-download from scratch.
