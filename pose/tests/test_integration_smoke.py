"""One integration smoke test against the real MediaPipe Pose Landmarker
model on a real static image, per the design doc's Success Criteria:
"static-coordinate unit tests alone can't catch API-shape mismatches
(wrong running mode, pose_world_landmarks vs. normalized landmarks
confusion, model asset path issues)."

This is the one test in the suite that needs the real `mediapipe` package,
the pre-downloaded `pose_landmarker_lite.task` model asset, and (to obtain
that asset / the fixture image in the first place) network access at
fixture-setup time -- NOT at test-run time. If the model asset isn't
present, the test is skipped (not failed) with a clear reason, per the
tester role's "not runnable due to environment" carve-out.

No camera is used or required -- `cv2.imread` on a static JPEG fixture,
exactly mirroring what pose_coach.capture.PoseCapture does per-frame
(cvtColor -> mp.Image -> detect_for_video), just with a file instead of a
webcam frame.
"""

from pathlib import Path

import pytest

cv2 = pytest.importorskip("cv2", reason="opencv-python not installed")
mp = pytest.importorskip("mediapipe", reason="mediapipe not installed")
from mediapipe.tasks.python import vision as mp_vision  # noqa: E402
from mediapipe.tasks.python.core.base_options import BaseOptions  # noqa: E402

from pose_coach import config  # noqa: E402
from pose_coach.pipeline import PoseTrackingPipeline  # noqa: E402
from pose_coach.types import Landmark, PoseObservation  # noqa: E402

FIXTURE_IMAGE = Path(__file__).parent / "fixtures" / "pose_smoke_test.jpg"

_model_missing = not config.MODEL_ASSET_PATH.is_file()
_image_missing = not FIXTURE_IMAGE.is_file()


@pytest.mark.skipif(
    _model_missing,
    reason=(
        f"pose_landmarker_lite.task not found at {config.MODEL_ASSET_PATH} -- "
        "expected environment limitation (no network / not pre-downloaded); "
        "see models/README.md."
    ),
)
@pytest.mark.skipif(
    _image_missing,
    reason=f"test fixture image not found at {FIXTURE_IMAGE}",
)
def test_real_model_detects_person_and_shapes_match_capture_py_expectations():
    frame_bgr = cv2.imread(str(FIXTURE_IMAGE))
    assert frame_bgr is not None, f"cv2 failed to decode fixture image at {FIXTURE_IMAGE}"

    rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

    base_options = BaseOptions(model_asset_path=str(config.MODEL_ASSET_PATH))
    options = mp_vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=mp_vision.RunningMode.VIDEO,
        num_poses=1,
    )
    landmarker = mp_vision.PoseLandmarker.create_from_options(options)
    try:
        result = landmarker.detect_for_video(mp_image, 0)
    finally:
        landmarker.close()

    # API-shape assertions (this is the whole point of this test: catch
    # wrong-field / wrong-shape mismatches that synthetic-coordinate unit
    # tests structurally cannot).
    assert len(result.pose_landmarks) == 1, "expected exactly one detected person (num_poses=1)"
    assert len(result.pose_world_landmarks) == 1
    assert len(result.pose_landmarks[0]) == 33
    assert len(result.pose_world_landmarks[0]) == 33

    first_2d = result.pose_landmarks[0][0]
    for attr in ("x", "y", "z", "visibility"):
        assert hasattr(first_2d, attr), f"pose_landmarks entries missing '{attr}' field"

    first_world = result.pose_world_landmarks[0][0]
    for attr in ("x", "y", "z", "visibility"):
        assert hasattr(first_world, attr), f"pose_world_landmarks entries missing '{attr}' field"

    # pose_world_landmarks must actually be metric-3D, distinct from the
    # normalized [0,1] 2D image landmarks -- this is exactly the
    # "pose_world_landmarks vs. normalized landmarks confusion" the design
    # doc calls out as untestable via synthetic coordinates alone. If
    # capture.py ever accidentally passed normalized 2D landmarks into
    # both slots, world coordinates would be suspiciously confined to
    # [0, 1]; real world landmarks are metric (meters) and commonly
    # outside that range.
    world_ys = [lm.y for lm in result.pose_world_landmarks[0]]
    assert any(y < -0.05 or y > 1.05 for y in world_ys), (
        "pose_world_landmarks look like they're still normalized [0,1] image "
        "coordinates, not metric 3D world coordinates -- possible API-shape mismatch"
    )

    # Translate through the same _to_landmarks-shaped construction
    # capture.py uses, then feed through the real pipeline end-to-end --
    # confirms the whole real-model -> PoseObservation -> pipeline path is
    # wired correctly, not just that the model itself runs.
    def _to_landmarks(mp_landmarks):
        return [Landmark(x=lm.x, y=lm.y, z=lm.z, visibility=lm.visibility) for lm in mp_landmarks]

    observation = PoseObservation(
        landmarks_2d=_to_landmarks(result.pose_landmarks[0]),
        world_landmarks=_to_landmarks(result.pose_world_landmarks[0]),
    )
    pipeline = PoseTrackingPipeline()
    output = pipeline.process_frame([observation], timestamp=0.0)

    # We don't assert a specific SEATED/STANDING label -- the fixture
    # image isn't a controlled sit-to-stand pose and the thresholds are
    # explicitly placeholder/untuned (config.py, Open Questions). We do
    # assert the pipeline ran the real path without crashing and produced
    # *some* well-formed, non-crashing output.
    assert output.state is not None
    if output.side_used is not None:
        assert output.knee_angle_raw is not None
        assert output.hip_height_norm is not None
