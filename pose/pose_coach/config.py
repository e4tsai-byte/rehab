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

# --- Autoregulation: rep counting / fatigue-stop (rep-counting-velocity-
# loss-design.md) -------------------------------------------------------------
# Same placeholder status as the state-machine thresholds above: starting
# estimates pending a real-footage tuning pass (design doc's Open
# Questions), not derived from data yet.

# Premise 1, discard rule (b): a concentric phase shorter than this is not
# a physically plausible sit-to-stand for any population. Checked before
# the mean_velocity division (see autoregulation/rep_counter.py), not just
# as a noise filter.
MIN_CONCENTRIC_DURATION_S = 0.3

# A set needs at least this many completed (non-discarded) reps before any
# velocity/ROM stat is computed at all -- design doc's minimum-rep-count
# fallback. Also the fixed first-3/last-3 window size used throughout.
MIN_REPS_FOR_VELOCITY_STATS = 3

# Premise 3 / research doc Section 1: first-3 vs. last-3 rep mean_velocity,
# expressed as a fraction (0.20 == 20%), bodyweight-modality-justified
# threshold for fatigue_stop_triggered.
FATIGUE_STOP_VELOCITY_LOSS_THRESHOLD = 0.20

# Baseline-consistency guard (design doc's Data Model / research doc
# Section 5): coefficient of variation of the first-3 reps' mean_velocity
# above this is treated as "too erratic to trust", forcing
# fatigue_stop_triggered to None. The design doc explicitly lists this
# exact cutoff as an unresolved placeholder ("Threshold/parameter tuning",
# Open Questions) with no numeric value given anywhere in either design
# doc -- this value is a flagged inference (not derived from the docs),
# same status as PERSON_SELECTION_HYSTERESIS_FRAMES's zero-margin
# inference above; see builder's report for this as a flagged assumption.
CONSISTENCY_GUARD_CV_THRESHOLD = 0.15

# --- Capture / model -----------------------------------------------------------
DEFAULT_CAMERA_INDEX = 0
TARGET_FPS_FLOOR = 15  # demo-readiness floor, not enforced in code -- see models/README.md

# pose_landmarker_lite.task is expected here; download it before any demo
# (see models/README.md) -- deliberately not fetched over the network at
# runtime, so a flaky venue network can't trigger the model-load failure
# path in front of judges.
MODEL_ASSET_PATH = Path(__file__).resolve().parent.parent / "models" / "pose_landmarker_lite.task"

# --- Shoulder Rehab: Right Arm Forward Flexion (rehab) ----------------------
SHOULDER_RESTING_ENTER = 32.0       # deg, threshold to enter RESTING (natural arm drop)
SHOULDER_RESTING_EXIT = 42.0        # deg, threshold to leave RESTING into ASCENDING
SHOULDER_TARGET_HOLD_ENTER = 80.0   # deg, threshold to enter HOLDING
SHOULDER_TARGET_HOLD_EXIT = 72.0    # deg, threshold to drop out of HOLDING
SHOULDER_TARGET_ANGLE_NOMINAL = 90.0# deg, target elevation
SHOULDER_TARGET_HOLD_MAX = 105.0    # deg, upper bound for valid hold zone

CADENCE_CONCENTRIC_TARGET_S = 5.0   # target seconds to reach 90 deg
CADENCE_CONCENTRIC_MIN_S = 2.5      # faster than this is flagged as RUSHED_CONCENTRIC
CADENCE_HOLD_TARGET_S = 5.0         # target hold duration in seconds
CADENCE_HOLD_MIN_S = 3.0            # minimum hold duration to count rep
CADENCE_ECCENTRIC_TARGET_S = 5.0    # target seconds to return to resting
CADENCE_ECCENTRIC_MIN_S = 2.5       # faster than this is flagged as RUSHED_ECCENTRIC

COMPENSATION_ELBOW_MIN_DEG = 155.0  # elbow interior angle below this -> ELBOW_BENT
COMPENSATION_SHOULDER_HIKE_RATIO = 0.08 # right shoulder height vs left delta -> SHOULDER_HIKE
COMPENSATION_TORSO_LEAN_DEG = 12.0  # torso tilt angle to vertical -> TORSO_LEAN

LEFT_ELBOW, RIGHT_ELBOW = 13, 14
LEFT_WRIST, RIGHT_WRIST = 15, 16
