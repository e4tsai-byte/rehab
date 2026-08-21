from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


class RehabPhase(Enum):
    RESTING = "RESTING"          # Arm down by hip (< 25 deg)
    ASCENDING = "ASCENDING"      # Raising arm toward 90 deg (target 5s)
    HOLDING = "HOLDING"          # Isometric hold at 90 deg (target 5s)
    DESCENDING = "DESCENDING"    # Lowering arm back to rest (target 5s)


class FormFlag(Enum):
    SHOULDER_HIKE = "SHOULDER_HIKE"            # Trapezius shrug compensation
    TORSO_LEAN = "TORSO_LEAN"                  # Lateral / backward torso tilt
    ELBOW_BENT = "ELBOW_BENT"                  # Arm bent instead of straight
    RUSHED_CONCENTRIC = "RUSHED_CONCENTRIC"    # Raised too fast (< 3s)
    RUSHED_ECCENTRIC = "RUSHED_ECCENTRIC"      # Lowered too fast (< 3s)
    INCOMPLETE_HOLD = "INCOMPLETE_HOLD"        # Dropped before target hold duration


@dataclass(frozen=True)
class RehabRepRecord:
    """Summary data for one completed rehabilitation repetition."""
    rep_index: int
    concentric_duration_s: float
    hold_duration_s: float
    eccentric_duration_s: float
    peak_elevation_deg: float
    form_flags: List[str]
    is_clean: bool
    timestamp: float


@dataclass
class RehabLiveState:
    """Real-time feedback packet emitted per frame for the coaching UI."""
    current_elevation_deg: float
    phase: RehabPhase
    hold_seconds_remaining: float
    concentric_elapsed_s: float
    eccentric_elapsed_s: float
    active_flags: List[str]
    reps_completed: int
    target_reps: int
    target_elevation_deg: float
    is_target_zone: bool
