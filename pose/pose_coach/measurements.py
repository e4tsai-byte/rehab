"""Per-side joint-angle and hip-height measurements.

Bridges the plain `Landmark`/`PoseObservation` types (types.py) and the
landmark-index constants (config.py) to the pure vector math (geometry.py).
Still no MediaPipe/OpenCV/state here -- every function takes landmarks in
and returns a number (or None) out.
"""

from typing import Optional, Sequence

from . import config, geometry
from .types import Landmark, Side


def _side_indices(side: Side) -> dict:
    if side is Side.LEFT:
        return {
            "shoulder": config.LEFT_SHOULDER,
            "hip": config.LEFT_HIP,
            "knee": config.LEFT_KNEE,
            "ankle": config.LEFT_ANKLE,
        }
    return {
        "shoulder": config.RIGHT_SHOULDER,
        "hip": config.RIGHT_HIP,
        "knee": config.RIGHT_KNEE,
        "ankle": config.RIGHT_ANKLE,
    }


def _xy(landmark: Landmark):
    return (landmark.x, landmark.y)


def _xyz(landmark: Landmark):
    return (landmark.x, landmark.y, landmark.z)


def bbox_area(landmarks_2d: Sequence[Landmark]) -> float:
    """Bounding-box area over all landmarks of a detection, used as the
    person-selection score."""
    return geometry.bbox_area(_xy(lm) for lm in landmarks_2d)


def side_average_visibility(landmarks_2d: Sequence[Landmark], side: Side) -> float:
    """Average `visibility` (per the design doc's glossary, not
    `presence`/`confidence`) over the shoulder/hip/knee/ankle landmarks
    needed for this side's measurements."""
    idx = _side_indices(side)
    values = [landmarks_2d[i].visibility for i in idx.values()]
    return sum(values) / len(values)


def knee_angle_deg(landmarks_2d: Sequence[Landmark], side: Side) -> Optional[float]:
    """Interior angle at the knee: HIP(23/24) -- KNEE(25/26) -- ANKLE(27/28),
    from the normalized 2D image landmarks."""
    idx = _side_indices(side)
    hip, knee, ankle = landmarks_2d[idx["hip"]], landmarks_2d[idx["knee"]], landmarks_2d[idx["ankle"]]
    return geometry.interior_angle_deg(_xy(knee), _xy(hip), _xy(ankle))


def hip_angle_deg(landmarks_2d: Sequence[Landmark], side: Side) -> Optional[float]:
    """Interior angle at the hip: SHOULDER(11/12) -- HIP(23/24) --
    KNEE(25/26), from the normalized 2D image landmarks. Computed and
    exposed per the design doc's output schema but not consumed by this
    slice's state gate -- reserved input for a future safety-flag slice."""
    idx = _side_indices(side)
    shoulder, hip, knee = landmarks_2d[idx["shoulder"]], landmarks_2d[idx["hip"]], landmarks_2d[idx["knee"]]
    return geometry.interior_angle_deg(_xy(hip), _xy(shoulder), _xy(knee))


def trunk_lean_deg(landmarks_2d: Sequence[Landmark], side: Side) -> Optional[float]:
    """Angle between the HIP->SHOULDER vector and the image's vertical
    axis, from the normalized 2D image landmarks. Assumes a level,
    non-tilted camera. Computed and exposed but not gated on in this
    slice, same as hip_angle_deg."""
    idx = _side_indices(side)
    hip, shoulder = landmarks_2d[idx["hip"]], landmarks_2d[idx["shoulder"]]
    hip_to_shoulder = geometry.vector(_xy(hip), _xy(shoulder))
    return geometry.angle_to_vertical_deg(hip_to_shoulder)


def hip_height_norm(world_landmarks: Sequence[Landmark], side: Side) -> Optional[float]:
    """norm_hip_height = (ankle_y - hip_y) / euclidean_dist(shoulder, hip),
    computed from `pose_world_landmarks` (metric 3D), per the design doc --
    deliberately NOT the normalized 2D image landmarks, because a forward
    trunk lean foreshortens the 2D-projected shoulder-hip distance even
    though the physical torso length is unchanged. The denominator uses
    the full 3D (x, y, z) distance since that's the entire point of using
    world landmarks (perspective invariance); the numerator is the signed
    y-difference only, as specified.

    Returns None if the shoulder-hip distance is degenerate (near-zero),
    per the design doc's zero-length-vector guard.
    """
    idx = _side_indices(side)
    hip = world_landmarks[idx["hip"]]
    ankle = world_landmarks[idx["ankle"]]
    shoulder = world_landmarks[idx["shoulder"]]
    torso_length = geometry.euclidean_distance(_xyz(shoulder), _xyz(hip))
    if torso_length < geometry.EPSILON:
        return None
    return (ankle.y - hip.y) / torso_length


def shoulder_flexion_3d_deg(world_landmarks: Sequence[Landmark], side: Side) -> Optional[float]:
    """Forward elevation / flexion angle of the arm relative to the torso,
    computed from metric 3D `pose_world_landmarks`.
    
    Vector 1: Torso downward vector = Hip - Shoulder
    Vector 2: Arm vector = Elbow - Shoulder
    
    0° = Arm resting straight down beside hip.
    90° = Arm raised straight forward horizontally (parallel to floor).
    180° = Arm straight overhead.
    """
    idx = _side_indices(side)
    shoulder = world_landmarks[idx["shoulder"]]
    hip = world_landmarks[idx["hip"]]
    elbow = world_landmarks[idx["elbow"]] if "elbow" in idx else world_landmarks[config.RIGHT_ELBOW if side is Side.RIGHT else config.LEFT_ELBOW]
    
    v_torso_down = geometry.vector(_xyz(shoulder), _xyz(hip))
    v_arm = geometry.vector(_xyz(shoulder), _xyz(elbow))
    return geometry.angle_between_vectors_deg(v_torso_down, v_arm)


def elbow_extension_deg(landmarks_2d: Sequence[Landmark], side: Side) -> Optional[float]:
    """Interior angle at the elbow: SHOULDER -> ELBOW -> WRIST.
    180° = straight arm. < 155° indicates elbow bending compensation.
    """
    idx = _side_indices(side)
    shoulder = landmarks_2d[idx["shoulder"]]
    elbow_idx = config.RIGHT_ELBOW if side is Side.RIGHT else config.LEFT_ELBOW
    wrist_idx = config.RIGHT_WRIST if side is Side.RIGHT else config.LEFT_WRIST
    elbow = landmarks_2d[elbow_idx]
    wrist = landmarks_2d[wrist_idx]
    return geometry.interior_angle_deg(_xy(elbow), _xy(shoulder), _xy(wrist))


def shoulder_hike_ratio(landmarks_2d: Sequence[Landmark], side: Side) -> Optional[float]:
    """Measures vertical displacement (shrug / hike) of the exercising shoulder
    relative to the opposite shoulder, normalized by torso length.
    
    In image coords (y increases downward):
    A positive value means the exercising shoulder is elevated higher (smaller y)
    than the contralateral shoulder.
    """
    r_shoulder = landmarks_2d[config.RIGHT_SHOULDER]
    l_shoulder = landmarks_2d[config.LEFT_SHOULDER]
    r_hip = landmarks_2d[config.RIGHT_HIP]
    
    torso_len = geometry.euclidean_distance(_xy(r_shoulder), _xy(r_hip))
    if torso_len < geometry.EPSILON:
        return None
        
    if side is Side.RIGHT:
        # If right shoulder y is smaller than left shoulder y, right is hiked
        return (l_shoulder.y - r_shoulder.y) / torso_len
    else:
        return (r_shoulder.y - l_shoulder.y) / torso_len


def torso_tilt_deg(landmarks_2d: Sequence[Landmark]) -> Optional[float]:
    """Angle of torso (hip midpoint to shoulder midpoint) relative to vertical.
    0° = perfectly upright. > 12° indicates lateral or posterior lean compensation.
    """
    r_shoulder, l_shoulder = landmarks_2d[config.RIGHT_SHOULDER], landmarks_2d[config.LEFT_SHOULDER]
    r_hip, l_hip = landmarks_2d[config.RIGHT_HIP], landmarks_2d[config.LEFT_HIP]
    
    shoulder_mid = ((r_shoulder.x + l_shoulder.x) / 2.0, (r_shoulder.y + l_shoulder.y) / 2.0)
    hip_mid = ((r_hip.x + l_hip.x) / 2.0, (r_hip.y + l_hip.y) / 2.0)
    
    torso_vec = geometry.vector(hip_mid, shoulder_mid)
    return geometry.angle_to_vertical_deg(torso_vec)
