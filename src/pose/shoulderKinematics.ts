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
  ASCENDING_TIMEOUT_S: 7.0,    // Target 5.0s + 2.0s timeout
  HOLDING_TIMEOUT_BUFFER_S: 2.0, // n + 2.0s, where n is user selected hold time
  DESCENDING_TIMEOUT_S: 7.0,   // Target 5.0s + 2.0s timeout

  COMPENSATION_ELBOW_MIN_DEG: 115.0, // Obvious inward bend (< 115°)
  COMPENSATION_ELBOW_REACH_RATIO: 0.78, // Inward arm collapse ratio
  COMPENSATION_SHOULDER_HIKE_RATIO_STANDING: 0.18,
  COMPENSATION_SHOULDER_HIKE_RATIO_SEATED: 0.22,
  COMPENSATION_TORSO_LEAN_DEG: 16.0,
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
// Elbow extension angle at the RIGHT elbow:
// Biomechanical reality: The human elbow is a uniaxial hinge that cannot bend backwards/outwards.
// Any outward angle variation is monocular camera depth foreshortening on a locked-out arm.
// A genuine compensation is strictly an INWARD curl towards the chest/shoulder (bicep fold),
// which collapses the direct reach ratio: dist(shoulder, wrist) / (upperArm + forearm).
// If reachRatio >= 0.78, the arm is fully extended forward -> returns 180° ("locked straight").
// If reachRatio < 0.78 AND interior angle < 115°, it reflects an obvious, true bicep fold cheat.
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

  const upperArmLen = Math.hypot(elbow.x - shoulder.x, elbow.y - shoulder.y, (elbow.z ?? 0) - (shoulder.z ?? 0))
  const forearmLen = Math.hypot(wrist.x - elbow.x, wrist.y - elbow.y, (wrist.z ?? 0) - (elbow.z ?? 0))
  const directReach = Math.hypot(wrist.x - shoulder.x, wrist.y - shoulder.y, (wrist.z ?? 0) - (shoulder.z ?? 0))
  const totalArmLen = upperArmLen + forearmLen

  if (totalArmLen < 1e-6) return 180

  const reachRatio = directReach / totalArmLen

  // If arm reach is extended forward (>= 0.78), the arm is structurally locked out.
  if (reachRatio >= CONFIG.COMPENSATION_ELBOW_REACH_RATIO) {
    return 180
  }

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
  private targetHoldDurationS: number

  private concentricStartT = 0
  private concentricDurationS = 0
  private holdEnterT = 0
  private holdDurationS = 0
  private eccentricStartT = 0
  private eccentricDurationS = 0
  private restStartT = 0
  private accumulatedHoldS = 0
  private lastTimestampS = 0

  private flagDurations: Record<string, number> = {}
  private peakAngleDeg = 0
  private smoothedBuffer: number[] = []

  constructor(targetReps = 10, isSeated = false, targetHoldDurationS = 5.0) {
    this.targetReps = targetReps
    this.isSeated = isSeated
    this.targetHoldDurationS = targetHoldDurationS
  }

  public setSeatedMode(seated: boolean): void {
    this.isSeated = seated
  }

  public setHoldDuration(durationS: number): void {
    this.targetHoldDurationS = durationS
  }

  public setTargetReps(reps: number): void {
    this.targetReps = reps
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
    timestampS: number,
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

    const dt = this.lastTimestampS > 0 ? Math.max(0, Math.min(0.2, timestampS - this.lastTimestampS)) : 0.033

    // Accumulate durations of compensations during active movement
    if (this.phase !== 'RESTING') {
      for (const f of activeFlags) {
        this.flagDurations[f] = (this.flagDurations[f] ?? 0) + dt
      }
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
        this.flagDurations = {}
        this.peakAngleDeg = angle
      }
    } else if (this.phase === 'ASCENDING') {
      concentricElapsed = Math.max(0, timestampS - this.concentricStartT)

      // Dynamic expected angle along strict 5.0-second curve
      const progress = Math.min(1.0, concentricElapsed / CONFIG.CADENCE_CONCENTRIC_TARGET_S)
      expectedAngle = restingEnter + progress * (CONFIG.TARGET_ANGLE_NOMINAL - restingEnter)

      // Live coaching pacing status (visual feedback only)
      if (concentricElapsed >= 0.8) {
        const delta = angle - expectedAngle
        if (delta > 18.0) {
          paceStatus = 'TOO_FAST'
          activeFlags.push('PACING_TOO_FAST')
        } else if (delta < -18.0 && concentricElapsed > 1.5) {
          paceStatus = 'TOO_SLOW'
          activeFlags.push('PACING_TOO_SLOW')
        } else {
          paceStatus = 'ON_TRACK'
        }
      }

      // STRICT PACING: Advance to HOLDING once full 5.0s concentric duration has elapsed AND arm reached target angle
      if (concentricElapsed >= CONFIG.CADENCE_CONCENTRIC_TARGET_S) {
        if (angle >= CONFIG.TARGET_HOLD_ENTER) {
          this.concentricDurationS = concentricElapsed
          this.phase = 'HOLDING'
          this.holdEnterT = timestampS
          this.accumulatedHoldS = 0
          holdRemaining = this.targetHoldDurationS
        } else {
          // Reached 5.0s but arm not yet elevated high enough
          paceStatus = 'TOO_SLOW'
          activeFlags.push('PACING_TOO_SLOW')
        }
      }

      // Safety timeout / abort if arm dropped completely during early ascent
      if (
        this.phase === 'ASCENDING' &&
        ((angle < restingEnter && concentricElapsed > 2.0) ||
          concentricElapsed >= CONFIG.ASCENDING_TIMEOUT_S)
      ) {
        this.phase = 'RESTING'
        this.restStartT = timestampS
        this.flagDurations = {}
        this.peakAngleDeg = 0
      }
    } else if (this.phase === 'HOLDING') {
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

      const targetHold = this.targetHoldDurationS
      const holdTimeout = targetHold + CONFIG.HOLDING_TIMEOUT_BUFFER_S // n + 2 seconds

      holdRemaining = Math.max(0, targetHold - this.accumulatedHoldS)

      // Transition to DESCENDING once target hold duration is accumulated
      if (this.accumulatedHoldS >= targetHold) {
        this.holdDurationS = this.accumulatedHoldS
        this.phase = 'DESCENDING'
        this.eccentricStartT = timestampS
        holdRemaining = 0
      } else if (
        angle < CONFIG.TARGET_HOLD_ABORT_THRESHOLD ||
        timestampS - this.holdEnterT >= holdTimeout
      ) {
        // Timed out or dropped below 52°
        this.holdDurationS = this.accumulatedHoldS
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

      // Lowering pacing evaluation (visual cues only)
      if (eccentricElapsed >= 0.8) {
        if (angle < expectedAngle - 18.0) {
          paceStatus = 'TOO_FAST'
          activeFlags.push('PACING_TOO_FAST')
        } else if (angle > expectedAngle + 18.0 && eccentricElapsed > 1.5) {
          paceStatus = 'TOO_SLOW'
          activeFlags.push('PACING_TOO_SLOW')
        } else {
          paceStatus = 'ON_TRACK'
        }
      }

      // Finalize rep once 5.0s has elapsed and arm is lowered
      const isTimeComplete = eccentricElapsed >= CONFIG.CADENCE_ECCENTRIC_TARGET_S
      const isArmLowered = angle <= (restingEnter + 10.0)
      const isTimedOut = eccentricElapsed >= CONFIG.DESCENDING_TIMEOUT_S

      if ((isTimeComplete && isArmLowered) || isTimedOut || (isTimeComplete && eccentricElapsed >= 5.3)) {
        this.eccentricDurationS = eccentricElapsed

        if (this.peakAngleDeg >= CONFIG.TARGET_HOLD_ENTER) {
          // Sustained compensation defect filtering (Clinical PM&R standard)
          const permanentFlags: FormFlag[] = []

          // Physical compensations: only penalize if sustained for >= 0.8s
          if ((this.flagDurations['SHOULDER_HIKE'] ?? 0) >= 0.8) {
            permanentFlags.push('SHOULDER_HIKE')
          }
          if ((this.flagDurations['TORSO_LEAN'] ?? 0) >= 0.8) {
            permanentFlags.push('TORSO_LEAN')
          }
          if ((this.flagDurations['ELBOW_BENT'] ?? 0) >= 0.8) {
            permanentFlags.push('ELBOW_BENT')
          }

          // Isometric Hold check: incomplete only if user held for < 75% of target
          if (this.holdDurationS < this.targetHoldDurationS * 0.75) {
            permanentFlags.push('INCOMPLETE_HOLD')
          }

          // Gross rushing checks (only if entire phase was done in < 2.5s)
          if (this.concentricDurationS < CONFIG.CADENCE_CONCENTRIC_MIN_S) {
            permanentFlags.push('RUSHED_CONCENTRIC')
          }
          if (this.eccentricDurationS < CONFIG.CADENCE_ECCENTRIC_MIN_S) {
            permanentFlags.push('RUSHED_ECCENTRIC')
          }

          completedRep = {
            index: this.nextRepIndex++,
            concentricDuration: Math.round(this.concentricDurationS * 10) / 10,
            holdDuration: Math.round(this.holdDurationS * 10) / 10,
            eccentricDuration: Math.round(this.eccentricDurationS * 10) / 10,
            peakElevation: Math.round(this.peakAngleDeg),
            flags: permanentFlags,
            isClean: permanentFlags.length === 0,
          }
          this.repCount++
        }

        // Start 3-second post-rep recovery rest period
        this.phase = 'RESTING'
        this.restStartT = timestampS
        this.flagDurations = {}
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
