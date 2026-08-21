import type { FormFlag, PaceStatus, RehabPhase, RehabRepRecord, RehabLiveState } from '../domain/rehabTypes'

export interface Landmark3D {
  x: number
  y: number
  z: number
  visibility?: number
}

export const LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
}

export const CONFIG = {
  RESTING_ENTER_STANDING: 30.0,
  RESTING_ENTER_SEATED: 38.0,
  RESTING_EXIT_STANDING: 40.0,
  RESTING_EXIT_SEATED: 48.0,
  TARGET_HOLD_ENTER: 78.0,          // deg, angle to trigger hold
  TARGET_HOLD_ZONE_MIN: 68.0,       // deg, active hold accumulation zone (forgiving of micro-tremors)
  TARGET_HOLD_ABORT_THRESHOLD: 52.0,// deg, only drop out if arm falls past 52°
  TARGET_ANGLE_NOMINAL: 90.0,
  TARGET_HOLD_MAX: 115.0,
  
  CADENCE_CONCENTRIC_TARGET_S: 5.0,
  CADENCE_CONCENTRIC_MIN_S: 2.5,
  CADENCE_HOLD_TARGET_S: 5.0,
  CADENCE_HOLD_MIN_S: 2.5,
  CADENCE_ECCENTRIC_TARGET_S: 5.0,
  CADENCE_ECCENTRIC_MIN_S: 2.5,
  
  REST_BETWEEN_REPS_S: 3.0,

  // Unstickable per-state wall-clock timeouts (Invariant 1.3). Measured against elapsed
  // time in the state, so no arm angle parked in a dead band can defeat them. PLACEHOLDER
  // values pending footage validation; deliberately generous so they never clip a slow-but-
  // -valid rep (see the non-regression sequence in the fix PR's before/after run).
  ASCENDING_TIMEOUT_S: 15.0,   // 3x concentric target: never reaching hold-enter in 15s => rep not completing
  HOLDING_TIMEOUT_S: 12.0,     // >2x hold target: resolves a hold parked below the accumulate zone
  DESCENDING_TIMEOUT_S: 12.0,  // >2x eccentric target: resolves an arm parked above the lowered threshold

  COMPENSATION_ELBOW_MIN_DEG: 155.0,
  COMPENSATION_SHOULDER_HIKE_RATIO_STANDING: 0.08,
  COMPENSATION_SHOULDER_HIKE_RATIO_SEATED: 0.12,
  COMPENSATION_TORSO_LEAN_DEG: 14.0,
}

function dot(a: number[], b: number[]): number {
  const a0 = a[0] ?? 0
  const a1 = a[1] ?? 0
  const a2 = a[2] ?? 0
  const b0 = b[0] ?? 0
  const b1 = b[1] ?? 0
  const b2 = b[2] ?? 0
  return a0 * b0 + a1 * b1 + a2 * b2
}

function norm(a: number[]): number {
  return Math.sqrt(dot(a, a))
}

export function angleBetweenVectorsDeg(v1: number[], v2: number[]): number {
  const n1 = norm(v1)
  const n2 = norm(v2)
  if (n1 < 1e-6 || n2 < 1e-6) return 0
  const cosTheta = Math.max(-1.0, Math.min(1.0, dot(v1, v2) / (n1 * n2)))
  return (Math.acos(cosTheta) * 180.0) / Math.PI
}

export function computeShoulderFlexion3D(worldLandmarks: Landmark3D[], isSeated = false): number {
  const rShoulder = worldLandmarks[LANDMARKS.RIGHT_SHOULDER]
  const lShoulder = worldLandmarks[LANDMARKS.LEFT_SHOULDER]
  const rHip = worldLandmarks[LANDMARKS.RIGHT_HIP]
  const rElbow = worldLandmarks[LANDMARKS.RIGHT_ELBOW]
  const nose = worldLandmarks[LANDMARKS.NOSE]
  if (!rShoulder || !rElbow) return 0

  const vArm = [rElbow.x - rShoulder.x, rElbow.y - rShoulder.y, rElbow.z - rShoulder.z]

  const hipsVisible = rHip && (rHip.visibility ?? 1) > 0.4
  if (!isSeated && hipsVisible) {
    const vTorsoDown = [rHip.x - rShoulder.x, rHip.y - rShoulder.y, rHip.z - rShoulder.z]
    return angleBetweenVectorsDeg(vTorsoDown, vArm)
  }

  if (lShoulder && nose) {
    const midShoulder = [
      (rShoulder.x + lShoulder.x) / 2,
      (rShoulder.y + lShoulder.y) / 2,
      (rShoulder.z + lShoulder.z) / 2,
    ]
    const vSpineDown = [
      midShoulder[0]! - nose.x,
      midShoulder[1]! - nose.y,
      midShoulder[2]! - nose.z,
    ]
    return angleBetweenVectorsDeg(vSpineDown, vArm)
  }

  return angleBetweenVectorsDeg([0, 1, 0], vArm)
}

// Elbow extension angle at the RIGHT elbow: the interior angle between the upper-arm
// vector (elbow -> shoulder) and the forearm vector (elbow -> wrist), in MediaPipe metric
// WORLD space. 0° = elbow fully folded, 180° = elbow fully straight. So a value below
// COMPENSATION_ELBOW_MIN_DEG means the elbow is bent past ~25° off straight.
//
// Geometry is taken from `worldLandmarks`, NOT image landmarks, on purpose: in a frontal
// camera the arm points toward the lens at ~90° forward flexion, and the 2D projection
// foreshortens a straight arm into a false bend (spurious ELBOW_BENT right at the target
// hold). Occlusion, however, is an image-plane property and `worldLandmarks` do not
// reliably carry a visibility field, so the visibility gate reads from `landmarks2D`.
//
// Degeneracies (Invariant 1.2): a missing/occluded elbow or wrist, or a zero-norm vector
// from coincident landmarks, returns 180° ("assume straight, do not flag") — a lost
// landmark must never manufacture a compensation warning. (The prior 2D version fell
// through to angleBetweenVectorsDeg, which returns 0° on a zero-norm input, fabricating a
// spurious bend.)
export function computeElbowExtensionDeg(
  worldLandmarks: Landmark3D[],
  landmarks2D: Landmark3D[],
): number {
  const shoulder = worldLandmarks[LANDMARKS.RIGHT_SHOULDER]
  const elbow = worldLandmarks[LANDMARKS.RIGHT_ELBOW]
  const wrist = worldLandmarks[LANDMARKS.RIGHT_WRIST]
  if (!shoulder || !elbow || !wrist) return 180

  const elbow2D = landmarks2D[LANDMARKS.RIGHT_ELBOW]
  const wrist2D = landmarks2D[LANDMARKS.RIGHT_WRIST]
  if ((elbow2D?.visibility ?? 1) < 0.4 || (wrist2D?.visibility ?? 1) < 0.4) return 180

  const v1 = [shoulder.x - elbow.x, shoulder.y - elbow.y, (shoulder.z ?? 0) - (elbow.z ?? 0)]
  const v2 = [wrist.x - elbow.x, wrist.y - elbow.y, (wrist.z ?? 0) - (elbow.z ?? 0)]
  if (norm(v1) < 1e-6 || norm(v2) < 1e-6) return 180
  return angleBetweenVectorsDeg(v1, v2)
}

export function computeShoulderHikeRatio(landmarks: Landmark3D[], isSeated = false): number {
  const rShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER]
  const lShoulder = landmarks[LANDMARKS.LEFT_SHOULDER]
  const rHip = landmarks[LANDMARKS.RIGHT_HIP]
  if (!rShoulder || !lShoulder) return 0

  if (isSeated || !rHip || (rHip.visibility ?? 1) <= 0.4) {
    const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y)
    if (shoulderWidth < 1e-6) return 0
    return (lShoulder.y - rShoulder.y) / shoulderWidth
  }

  const torsoLen = Math.hypot(rShoulder.x - rHip.x, rShoulder.y - rHip.y)
  if (torsoLen < 1e-6) return 0
  return (lShoulder.y - rShoulder.y) / torsoLen
}

export function computeTorsoTiltDeg(landmarks: Landmark3D[], isSeated = false): number {
  const rShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER]
  const lShoulder = landmarks[LANDMARKS.LEFT_SHOULDER]
  const rHip = landmarks[LANDMARKS.RIGHT_HIP]
  const lHip = landmarks[LANDMARKS.LEFT_HIP]
  const nose = landmarks[LANDMARKS.NOSE]
  if (!rShoulder || !lShoulder) return 0

  const shoulderMid = [(rShoulder.x + lShoulder.x) / 2, (rShoulder.y + lShoulder.y) / 2]

  if (isSeated || !rHip || !lHip || (rHip.visibility ?? 1) <= 0.4) {
    if (nose) {
      const headVec = [(nose.x - shoulderMid[0]!), (nose.y - shoulderMid[1]!)]
      return angleBetweenVectorsDeg(headVec, [0, -1])
    }
    return 0
  }

  const hipMid = [(rHip.x + lHip.x) / 2, (rHip.y + lHip.y) / 2]
  const torsoVec = [(shoulderMid[0]! - hipMid[0]!), (shoulderMid[1]! - hipMid[1]!)]
  return angleBetweenVectorsDeg(torsoVec, [0, -1])
}

export class ClientShoulderFlexionTracker {
  private phase: RehabPhase = 'RESTING'
  private repCount = 0
  private nextRepIndex = 1
  private targetReps: number
  private isSeated: boolean
  
  private concentricStartT = 0
  private concentricDurationS = 0
  private holdEnterT = 0
  private holdDurationS = 0
  private eccentricStartT = 0
  private eccentricDurationS = 0
  private restStartT = 0
  private accumulatedHoldS = 0
  private lastTimestampS = 0
  
  private repFlags = new Set<FormFlag>()
  private peakAngleDeg = 0
  private smoothedBuffer: number[] = []

  constructor(targetReps = 10, isSeated = false) {
    this.targetReps = targetReps
    this.isSeated = isSeated
  }

  public setSeatedMode(seated: boolean): void {
    this.isSeated = seated
  }

  private getSmoothedAngle(rawAngle: number): number {
    this.smoothedBuffer.push(rawAngle)
    if (this.smoothedBuffer.length > 5) this.smoothedBuffer.shift()
    const sorted = [...this.smoothedBuffer].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted[mid] ?? rawAngle
  }

  public process(
    worldLandmarks: Landmark3D[] | null,
    landmarks2D: Landmark3D[] | null,
    timestampS: number
  ): { rep: RehabRepRecord | null; live: RehabLiveState } {
    if (!worldLandmarks || !landmarks2D) {
      return {
        rep: null,
        live: {
          elevation: 0,
          phase: this.phase,
          holdRemaining: 0,
          restRemaining: 0,
          concentricElapsed: 0,
          eccentricElapsed: 0,
          paceStatus: 'IDLE',
          expectedAngle: 0,
          isTargetZone: false,
          flags: [],
          repsCompleted: this.repCount,
          targetReps: this.targetReps,
        },
      }
    }

    const rawAngle = computeShoulderFlexion3D(worldLandmarks, this.isSeated)
    const angle = this.getSmoothedAngle(rawAngle)

    const activeFlags: FormFlag[] = []
    const elbowAngle = computeElbowExtensionDeg(worldLandmarks, landmarks2D)
    if (elbowAngle < CONFIG.COMPENSATION_ELBOW_MIN_DEG) {
      activeFlags.push('ELBOW_BENT')
    }

    const hikeRatio = computeShoulderHikeRatio(landmarks2D, this.isSeated)
    const hikeThreshold = this.isSeated
      ? CONFIG.COMPENSATION_SHOULDER_HIKE_RATIO_SEATED
      : CONFIG.COMPENSATION_SHOULDER_HIKE_RATIO_STANDING
    if (hikeRatio > hikeThreshold) {
      activeFlags.push('SHOULDER_HIKE')
    }

    const torsoTilt = computeTorsoTiltDeg(landmarks2D, this.isSeated)
    if (torsoTilt > CONFIG.COMPENSATION_TORSO_LEAN_DEG) {
      activeFlags.push('TORSO_LEAN')
    }

    if (this.phase !== 'RESTING') {
      for (const f of activeFlags) this.repFlags.add(f)
      if (angle > this.peakAngleDeg) this.peakAngleDeg = angle
    }

    let completedRep: RehabRepRecord | null = null
    const isTargetZone = angle >= CONFIG.TARGET_HOLD_ENTER && angle <= CONFIG.TARGET_HOLD_MAX
    let holdRemaining = 0
    let restRemaining = 0
    let concentricElapsed = 0
    let eccentricElapsed = 0
    let paceStatus: PaceStatus = 'IDLE'
    let expectedAngle = 0

    const restingEnter = this.isSeated ? CONFIG.RESTING_ENTER_SEATED : CONFIG.RESTING_ENTER_STANDING
    const restingExit = this.isSeated ? CONFIG.RESTING_EXIT_SEATED : CONFIG.RESTING_EXIT_STANDING

    if (this.phase === 'RESTING') {
      // 3-Second Post-Rep Rest Countdown
      if (this.restStartT > 0) {
        const restElapsed = Math.max(0, timestampS - this.restStartT)
        restRemaining = Math.max(0, CONFIG.REST_BETWEEN_REPS_S - restElapsed)
      }

      // Can only begin next rep once rest period has elapsed
      if (restRemaining <= 0 && angle > restingExit) {
        this.phase = 'ASCENDING'
        this.concentricStartT = timestampS
        this.restStartT = 0
        this.accumulatedHoldS = 0
        this.repFlags.clear()
        this.peakAngleDeg = angle
      }
    } else if (this.phase === 'ASCENDING') {
      concentricElapsed = Math.max(0, timestampS - this.concentricStartT)
      
      // Dynamic expected angle along strict 5.0-second curve
      const progress = Math.min(1.0, concentricElapsed / CONFIG.CADENCE_CONCENTRIC_TARGET_S)
      expectedAngle = restingEnter + progress * (CONFIG.TARGET_ANGLE_NOMINAL - restingEnter)

      // Pacing evaluation (Too Fast vs Too Slow)
      if (concentricElapsed >= 0.8) {
        const delta = angle - expectedAngle
        if (delta > 16.0) {
          paceStatus = 'TOO_FAST'
          activeFlags.push('PACING_TOO_FAST')
          this.repFlags.add('PACING_TOO_FAST')
        } else if (delta < -16.0 && concentricElapsed > 1.5) {
          paceStatus = 'TOO_SLOW'
          activeFlags.push('PACING_TOO_SLOW')
          this.repFlags.add('PACING_TOO_SLOW')
        } else {
          paceStatus = 'ON_TRACK'
        }
      }

      // Check if user raised to 90° early
      if (angle >= CONFIG.TARGET_HOLD_ENTER && concentricElapsed < CONFIG.CADENCE_CONCENTRIC_TARGET_S) {
        this.repFlags.add('RUSHED_CONCENTRIC')
      }

      // STRICT PACING: Only advance to HOLDING once the full 5.0s concentric duration has elapsed AND arm is at target angle
      if (concentricElapsed >= CONFIG.CADENCE_CONCENTRIC_TARGET_S) {
        if (angle >= CONFIG.TARGET_HOLD_ENTER) {
          this.concentricDurationS = concentricElapsed
          this.phase = 'HOLDING'
          this.holdEnterT = timestampS
          this.accumulatedHoldS = 0
          holdRemaining = CONFIG.CADENCE_HOLD_TARGET_S
        } else {
          // Reached 5.0s but arm not yet elevated high enough
          paceStatus = 'TOO_SLOW'
          activeFlags.push('PACING_TOO_SLOW')
        }
      }

      // Unstickable exit: abort if the arm dropped back to rest during ascent, OR time out
      // a stalled ascent parked below the hold-enter angle (Invariant 1.3). Either way the
      // arm never reached target (peak < TARGET_HOLD_ENTER), so this is NOT a valid rep:
      // discard it and return cleanly to the idle rest state — no broken rep recorded, no
      // frozen screen (Invariant 1.6). The clean reset (restStartT/repFlags/peakAngleDeg)
      // also fixes the former abort, which left the machine re-arming every frame.
      if (
        this.phase === 'ASCENDING' &&
        ((angle < restingEnter && concentricElapsed > 2.0) ||
          concentricElapsed >= CONFIG.ASCENDING_TIMEOUT_S)
      ) {
        this.phase = 'RESTING'
        this.restStartT = timestampS
        this.repFlags.clear()
        this.peakAngleDeg = 0
      }
    } else if (this.phase === 'HOLDING') {
      const dt = this.lastTimestampS > 0 ? Math.max(0, Math.min(0.2, timestampS - this.lastTimestampS)) : 0.033
      concentricElapsed = this.concentricDurationS
      expectedAngle = CONFIG.TARGET_ANGLE_NOMINAL

      // Accumulate hold time whenever arm is in the active elevation zone (>= 68°)
      if (angle >= CONFIG.TARGET_HOLD_ZONE_MIN) {
        this.accumulatedHoldS += dt
        paceStatus = 'ON_TRACK'
      } else {
        // Arm dipped slightly below 68° but still above abort threshold (52°) -> pause timer and alert
        activeFlags.push('INCOMPLETE_HOLD')
        paceStatus = 'TOO_SLOW'
      }

      holdRemaining = Math.max(0, CONFIG.CADENCE_HOLD_TARGET_S - this.accumulatedHoldS)

      // Only transition to DESCENDING once full 5.0s of actual isometric hold is accumulated
      if (this.accumulatedHoldS >= CONFIG.CADENCE_HOLD_TARGET_S) {
        this.holdDurationS = this.accumulatedHoldS
        this.phase = 'DESCENDING'
        this.eccentricStartT = timestampS
        holdRemaining = 0
      } else if (
        angle < CONFIG.TARGET_HOLD_ABORT_THRESHOLD ||
        timestampS - this.holdEnterT >= CONFIG.HOLDING_TIMEOUT_S
      ) {
        // Unstickable exit (Invariant 1.3): the arm dropped below the abort threshold, OR
        // the hold timed out while parked between the abort threshold and the accumulate
        // zone (where the timer neither accrues nor aborts). The arm DID reach target to
        // enter HOLDING (peak >= TARGET_HOLD_ENTER), so this is a legitimate rep with a
        // short hold — finalize into descent carrying INCOMPLETE_HOLD, not discarded.
        this.holdDurationS = this.accumulatedHoldS
        this.repFlags.add('INCOMPLETE_HOLD')
        this.phase = 'DESCENDING'
        this.eccentricStartT = timestampS
        holdRemaining = 0
      }
    } else if (this.phase === 'DESCENDING') {
      eccentricElapsed = Math.max(0, timestampS - this.eccentricStartT)
      concentricElapsed = this.concentricDurationS

      // Dynamic expected angle along strict 5.0-second lowering curve
      const progress = Math.min(1.0, eccentricElapsed / CONFIG.CADENCE_ECCENTRIC_TARGET_S)
      expectedAngle = CONFIG.TARGET_ANGLE_NOMINAL - progress * (CONFIG.TARGET_ANGLE_NOMINAL - restingEnter)

      // Lowering pacing evaluation
      if (eccentricElapsed >= 0.8) {
        if (angle < expectedAngle - 16.0) {
          paceStatus = 'TOO_FAST'
          activeFlags.push('PACING_TOO_FAST')
          this.repFlags.add('PACING_TOO_FAST')
        } else if (angle > expectedAngle + 16.0 && eccentricElapsed > 1.5) {
          paceStatus = 'TOO_SLOW'
          activeFlags.push('PACING_TOO_SLOW')
          this.repFlags.add('PACING_TOO_SLOW')
        } else {
          paceStatus = 'ON_TRACK'
        }
      }

      // Check if user dropped hand down too fast
      if (angle <= restingEnter && eccentricElapsed < CONFIG.CADENCE_ECCENTRIC_TARGET_S) {
        this.repFlags.add('RUSHED_ECCENTRIC')
      }

      // STRICT PACING: Only finalize rep once the full 5.0s descent duration has elapsed AND arm has lowered.
      // Unstickable exit (Invariant 1.3): also finalize on timeout if the arm is parked above the lowered
      // threshold after DESCENDING_TIMEOUT_S — the concentric and hold already happened, and not returning
      // fully to rest is not a form fault worth hanging the machine on.
      const isTimeComplete = eccentricElapsed >= CONFIG.CADENCE_ECCENTRIC_TARGET_S
      const isArmLowered = angle <= (restingEnter + 8.0)
      const isTimedOut = eccentricElapsed >= CONFIG.DESCENDING_TIMEOUT_S

      if ((isTimeComplete && isArmLowered) || isTimedOut) {
        this.eccentricDurationS = eccentricElapsed

        if (this.peakAngleDeg >= CONFIG.TARGET_HOLD_ENTER) {
          completedRep = {
            index: this.nextRepIndex++,
            concentricDuration: Math.round(this.concentricDurationS * 10) / 10,
            holdDuration: Math.round(this.holdDurationS * 10) / 10,
            eccentricDuration: Math.round(this.eccentricDurationS * 10) / 10,
            peakElevation: Math.round(this.peakAngleDeg),
            flags: Array.from(this.repFlags),
            isClean: this.repFlags.size === 0,
          }
          this.repCount++
        }

        // Start 3-second post-rep recovery rest period
        this.phase = 'RESTING'
        this.restStartT = timestampS
        this.repFlags.clear()
        this.peakAngleDeg = 0
      }
    }

    this.lastTimestampS = timestampS

    return {
      rep: completedRep,
      live: {
        elevation: Math.round(angle),
        phase: this.phase,
        holdRemaining: Math.round(holdRemaining * 10) / 10,
        restRemaining: Math.round(restRemaining * 10) / 10,
        concentricElapsed: Math.round(concentricElapsed * 10) / 10,
        eccentricElapsed: Math.round(eccentricElapsed * 10) / 10,
        paceStatus,
        expectedAngle: Math.round(expectedAngle),
        isTargetZone,
        flags: activeFlags,
        repsCompleted: this.repCount,
        targetReps: this.targetReps,
      },
    }
  }
}
