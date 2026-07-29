"""Named constants for the pose-tracking pipeline.

Per the design doc's Open Questions: threshold values (knee-angle cutoffs,
hip-height normalization cutoffs, hysteresis bands) are starting estimates,
not derived from real footage yet -- they *will* need tuning after the
first real webcam test with a person. They are kept here as clearly-named
constants (not buried magic numbers in the logic) specifically so that
tuning pass is fast.
"""

from pathlib import Path

# --- MediaPipe Pose Landmarker indices (BlazePose 33-point topology) -------
# https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_KNEE, RIGHT_KNEE = 25, 26
LEFT_ANKLE, RIGHT_ANKLE = 27, 28

# --- Visibility / occlusion handling ----------------------------------------
# A side's needed landmarks (shoulder/hip/knee/ankle) must average at or
# above this to be usable at all; below it on both sides -> UNKNOWN.
VISIBILITY_THRESHOLD = 0.5

# Side-switch hysteresis: the challenger side's average visibility must
# exceed the current primary side's by this margin, for
# SIDE_SELECTION_HYSTERESIS_FRAMES consecutive frames, before switching.
SIDE_VISIBILITY_MARGIN = 0.15
SIDE_SELECTION_HYSTERESIS_FRAMES = 3

# Person-selection hysteresis (num_poses=1, but defensively hysteresis-gated
# per the design doc in case more than one detection ever surfaces, e.g. a
# bystander leaning into frame): a competing detection must have a larger
# bounding-box area for this many consecutive frames before the tracked
# person swaps. Doc specifies "same hysteresis treatment as side-switching"
# for the frame count; it does not specify a numeric area margin, so a
# zero margin (any consistently-larger detection) is used here -- see
# builder's report for this as a flagged inference.
PERSON_SELECTION_HYSTERESIS_FRAMES = 3

# --- Smoothing ---------------------------------------------------------------
# Median filter window, in frames (see design doc's Taste Decision: this is
# a frame-count window, not a fixed time duration -- an explicit, documented
# fps assumption, not converted to time-based windows in this slice).
SMOOTHING_WINDOW_FRAMES = 5

# --- State machine thresholds (knee angle, degrees) -------------------------
KNEE_SEATED_BASELINE = 100.0
KNEE_SEATED_HYSTERESIS_BAND = 5.0
KNEE_SEATED_ENTER = KNEE_SEATED_BASELINE - KNEE_SEATED_HYSTERESIS_BAND  # 95
KNEE_SEATED_EXIT = KNEE_SEATED_BASELINE + KNEE_SEATED_HYSTERESIS_BAND  # 105

KNEE_STANDING_BASELINE = 160.0
KNEE_STANDING_HYSTERESIS_BAND = 5.0
KNEE_STANDING_ENTER = KNEE_STANDING_BASELINE + KNEE_STANDING_HYSTERESIS_BAND  # 165
KNEE_STANDING_EXIT = KNEE_STANDING_BASELINE - KNEE_STANDING_HYSTERESIS_BAND  # 155

# --- State machine thresholds (normalized hip height) -----------------------
# norm_hip_height = (ankle_y - hip_y) / |shoulder - hip|, from
# pose_world_landmarks (see measurements.hip_height_norm). Larger = more
# upright/standing. These starting values are placeholders pending real
# footage per the Open Questions -- not derived from data.
HIP_HEIGHT_SEATED_BASELINE = 0.55
HIP_HEIGHT_SEATED_HYSTERESIS_BAND = 0.05
HIP_HEIGHT_SEATED_ENTER = HIP_HEIGHT_SEATED_BASELINE - HIP_HEIGHT_SEATED_HYSTERESIS_BAND
HIP_HEIGHT_SEATED_EXIT = HIP_HEIGHT_SEATED_BASELINE + HIP_HEIGHT_SEATED_HYSTERESIS_BAND

HIP_HEIGHT_STANDING_BASELINE = 0.85
HIP_HEIGHT_STANDING_HYSTERESIS_BAND = 0.05
HIP_HEIGHT_STANDING_ENTER = HIP_HEIGHT_STANDING_BASELINE + HIP_HEIGHT_STANDING_HYSTERESIS_BAND
HIP_HEIGHT_STANDING_EXIT = HIP_HEIGHT_STANDING_BASELINE - HIP_HEIGHT_STANDING_HYSTERESIS_BAND

# --- Capture / model -----------------------------------------------------------
DEFAULT_CAMERA_INDEX = 0
TARGET_FPS_FLOOR = 15  # demo-readiness floor, not enforced in code -- see models/README.md

# pose_landmarker_lite.task is expected here; download it before any demo
# (see models/README.md) -- deliberately not fetched over the network at
# runtime, so a flaky venue network can't trigger the model-load failure
# path in front of judges.
MODEL_ASSET_PATH = Path(__file__).resolve().parent.parent / "models" / "pose_landmarker_lite.task"
