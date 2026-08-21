export type RehabPhase = 'RESTING' | 'ASCENDING' | 'HOLDING' | 'DESCENDING'

export type FormFlag =
  | 'SHOULDER_HIKE'
  | 'TORSO_LEAN'
  | 'ELBOW_BENT'
  | 'RUSHED_CONCENTRIC'
  | 'RUSHED_ECCENTRIC'
  | 'INCOMPLETE_HOLD'

export interface RehabLiveState {
  readonly elevation: number
  readonly phase: RehabPhase
  readonly holdRemaining: number
  readonly concentricElapsed: number
  readonly eccentricElapsed: number
  readonly isTargetZone: boolean
  readonly flags: readonly FormFlag[]
  readonly repsCompleted: number
  readonly targetReps: number
}

export interface RehabRepRecord {
  readonly index: number
  readonly concentricDuration: number
  readonly holdDuration: number
  readonly eccentricDuration: number
  readonly peakElevation: number
  readonly flags: readonly FormFlag[]
  readonly isClean: boolean
}

export interface UserSettings {
  targetAngleDeg: number
  holdDurationS: number
  concentricCadenceS: number
  eccentricCadenceS: number
  targetReps: number
  soundEnabled: boolean
}

export interface CompletedSession {
  id: string
  exerciseId: string
  exerciseNameZh: string
  timestamp: number
  completedReps: number
  targetReps: number
  cleanRepsCount: number
  formQualityScorePct: number
  averageHoldDurationS: number
  peakElevationDeg: number
  reps: readonly RehabRepRecord[]
}
