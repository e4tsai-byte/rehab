export type RehabPhase = 'RESTING' | 'ASCENDING' | 'HOLDING' | 'DESCENDING'

export type BodyRegion = 'shoulder' | 'knee' | 'hip' | 'elbow' | 'spine' | 'ankle'


export type FormFlag =
  | 'SHOULDER_HIKE'
  | 'TORSO_LEAN'
  | 'ELBOW_BENT'
  | 'RUSHED_CONCENTRIC'
  | 'RUSHED_ECCENTRIC'
  | 'INCOMPLETE_HOLD'
  | 'PACING_TOO_FAST'
  | 'PACING_TOO_SLOW'
  // Side-lying isometric-hold fault: the arm rises ABOVE the supraspinatus band
  // (the target is a CEILING, not a floor — §9 D1). Emitted only by the
  // side-lying hold tracker; the paced flexion tracker never raises it.
  | 'OVER_ELEVATION'
  // Lumbar spine loses its neutral position and arches off the support surface
  // during a lower-limb isometric/loading task (e.g. quad sets) — the low back,
  // not the target joint, is doing the work. Distinct from OVER_ELEVATION
  // (a raised-limb fault): this is a trunk-compensation fault at the spine.
  // Physiatrist-authored for the knee region 2026-08-26; not yet given a
  // kinematicist geometric definition — see PLACEHOLDER comments in
  // exerciseCatalog.ts for the row this was defined against.
  | 'LUMBAR_ARCH'
  // Knee travels past anatomical zero (full extension) into hyperextension
  // during a terminal-extension task — a distinct joint-angle fault from
  // OVER_ELEVATION's raised-limb meaning; on the knee, "too far" means the
  // joint locks back past neutral, not that a limb rose too high. Physiatrist-
  // authored for the knee region 2026-08-26; not yet given a kinematicist
  // geometric definition — see PLACEHOLDER comments in exerciseCatalog.ts.
  | 'KNEE_HYPEREXTENSION'
  // Pelvis rotates/rolls out of its stacked side-lying alignment when a hip-
  // abduction task (e.g. clamshell) is driven past its safe range — a pelvic-
  // girdle compensation, not a raised-limb fault like OVER_ELEVATION.
  // Physiatrist-authored for the hip region 2026-08-26; not yet given a
  // kinematicist geometric definition — see PLACEHOLDER comments in
  // exerciseCatalog.ts.
  | 'PELVIC_ROLL'

export type PaceStatus = 'ON_TRACK' | 'TOO_FAST' | 'TOO_SLOW' | 'IDLE'

export interface RehabLiveState {
  readonly elevation: number
  readonly phase: RehabPhase
  readonly holdRemaining: number
  readonly restRemaining: number
  readonly concentricElapsed: number
  readonly eccentricElapsed: number
  readonly paceStatus: PaceStatus
  readonly expectedAngle: number
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

// ── Personalized Prescription Plan ──────────────────────────────────────────
export type PrescriptionStatus = 'active' | 'queued' | 'completed'

export interface UserPrescription {
  id: string
  exerciseId: string
  customTitle?: string | undefined
  durationWeeks: number
  targetDaysPerWeek: number
  dailySetsTarget: number
  status: PrescriptionStatus
  order: number
  startedAt: number
  notes?: string | undefined
}

