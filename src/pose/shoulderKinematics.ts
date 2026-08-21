import type { FormFlag, PaceStatus, RehabPhase, RehabRepRecord, RehabLiveState } from '../domain/rehabTypes'

export interface Landmark3D {
  x: number
  y: number
  z: number
  visibility?: number
}

/**
 * Body orientation relative to gravity and the camera. Replaces the retired
 * `isSeated: boolean` (a boolean cannot carry three orientations — invariant 4,
 * §9 D1). Reference-frame meaning per value:
 *   - standing:  trunk vertical, subject faces the camera. Hip-referenced trunk
 *                vector when hips are visible, else a nose/gravity vertical fallback.
 *   - seated:    trunk vertical but hips are typically occluded by a desk, so the
 *                vertical (nose/gravity) fallback is the PRIMARY path, not a backup.
 *   - sideLying: trunk HORIZONTAL. The vertical fallbacks are geometrically wrong
 *                here and are barred; every angle is taken against the trunk long
 *                axis (shoulder->hip) directly, in the metric world frame.
 */
export type Posture = 'standing' | 'seated' | 'sideLying'

/**
 * Sentinel for the side-lying abduction path when no valid horizontal trunk axis
 * can be formed (both hips below the visibility gate, or a degenerate zero-norm
 * axis). It is deliberately OUTSIDE the physical 0–180° range so a caller can
 * detect "unmeasurable" and neither accumulate an isometric hold nor raise
 * OVER_ELEVATION from it — a lost landmark must never manufacture a fault
 * (invariant 1.2). The upright angle paths keep their existing 0 return on
 * missing landmarks; this sentinel is side-lying only.
 */
export const SIDE_LYING_NO_TRUNK_AXIS = -1

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

  /* ── Per-state wall-clock timeouts (invariant 1.3) ───────────────────────
     Measured against elapsed time in the state, so an arm parked in a dead
     band cannot defeat them.

     PROVENANCE: tuned by the author across repeated live runs on real
     hardware, superseding an earlier set of desk-derived placeholders
     (15.0 / 12.0). The earlier values were chosen to be deliberately generous
     on the theory that a slow rep must never be clipped; in practice they left
     the machine sitting in a state long after the user had visibly stopped.

     KNOWN TRADE-OFF, recorded rather than silently accepted: entry to HOLDING
     needs BOTH 5.0s elapsed and the target angle, so ASCENDING_TIMEOUT_S = 7.0
     leaves a 2-second window (5.0s → 7.0s) in which the arm must arrive. That
     is comfortable for the author's own shoulder. It may not be for a stiffer
     one — an adhesive-capsulitis or early post-op user working through a
     painful arc can take longer, and their rep is discarded rather than
     recorded short. Re-check this specific number first when the validation
     corpus exists, and check it against someone who is not the author. */
  ASCENDING_TIMEOUT_S: 7.0,      // 5.0s target + 2.0s to arrive
  HOLDING_TIMEOUT_BUFFER_S: 2.0, // n + 2.0s, n = user-selected hold duration
  DESCENDING_TIMEOUT_S: 7.0,     // 5.0s target + 2.0s

  /* ── Compensation thresholds ─────────────────────────────────────────────
     PROVENANCE: all five tuned by the author across repeated live runs against
     his own post-operative shoulder, replacing values that had been reasoned
     from anthropometry rather than observed. Every one was loosened, because
     the reasoned values fired near-continuously on real movement and an alert
     that is always on is an alert the user learns to ignore.

     WHAT THAT COSTS, stated plainly so the trade-off is visible to whoever
     reads this next: loosening moves every one of these toward FALSE
     NEGATIVES. For an unsupervised user that is the more expensive direction
     of error — a missed shrug is practised, a false alarm is merely annoying.
     The shrug ratio in particular is this product's headline claim, and at
     0.18 it flags a pronounced shrug rather than the smaller trapezius
     substitution that matters clinically.

     So these are calibrated against ONE shoulder — the right one, mid-recovery,
     in one room, in one lighting condition. That is real evidence and better
     than the numbers it replaced. It is not yet generalisation. The validation
     study is what turns it into one; until then treat every value here as
     n = 1.

     LIMITATION worth knowing before re-tuning: the hike metric is
     (lShoulder.y - rShoulder.y), a left-versus-right asymmetry. A symmetric
     bilateral shrug produces ~0 and is invisible at any threshold. */
  COMPENSATION_ELBOW_MIN_DEG: 115.0,          // obvious inward bend
  COMPENSATION_ELBOW_REACH_RATIO: 0.78,       // inward arm collapse
  COMPENSATION_SHOULDER_HIKE_RATIO_STANDING: 0.18, // of torso length
  COMPENSATION_SHOULDER_HIKE_RATIO_SEATED: 0.22,   // of shoulder width
  COMPENSATION_TORSO_LEAN_DEG: 16.0,

  /* ══ Side-lying supraspinatus ISOMETRIC HOLD (posture: 'sideLying') ═════════
     A SECOND, self-contained block for the second tracking model (§9 D2,
     invariant 1.3 amended). Consumed ONLY by ClientSideLyingHoldTracker. It does
     NOT reuse, and MUST NOT be tuned against, the paced flexion constants above:
     that machine reads a ~90° flexion FLOOR the arm climbs to; this one reads a
     low 10–15° abduction CEILING the arm must stay UNDER (§9 D1). Same geometry,
     opposite reference — conflating the two is a defect.

     PROVENANCE, split by author so the next reader knows what is clinical and
     what is tunable:
       • (PHYSIATRIST) — clinical values set by the physiatrist: the elevation
         band, the 20s target, the 30s stretch goal, 5 sets, the >18°/≈2s
         over-elevation invalidation default, and the straight-arm requirement.
       • (ME) — debounce / hysteresis / settle / rest / timeout numbers chosen by
         the measurement-engineer to keep a camera-noise signal from chattering
         the state machine. The physiatrist named 18°/≈2s as a clinician-tunable
         default and left the exact debounce to this layer.
     ALL are n = 1 and UNVALIDATED: there is no fixture corpus yet (§3 KNOWN GAP).
     Because these are NEW constants, the "no paced constant changes without a
     manual before/after" rule is satisfied by not touching anything above; these
     still get the corpus before anyone calls them validated.

     Cadence is INERT for this exercise: there is no concentric/eccentric tempo,
     so the tracker never emits RUSHED_* or PACING_* and there are no cadence
     constants here by design. Per invariant 4, any value that would differ by
     view is a named pair; nothing here does — this exercise ships side-lying
     only, so every constant is single-view and labelled sideLying. */

  HOLD_TARGET_ANGLE_DEG: 12.0,        // (PHYSIATRIST) abduction target; 0° = arm alongside trunk
  HOLD_TARGET_S: 20.0,                // (PHYSIATRIST) a set is COMPLETE at 20s accumulated in-band (loaded)
  HOLD_STRETCH_GOAL_S: 30.0,          // (PHYSIATRIST) pain-free stretch goal — NEVER a failure line; display only, gates nothing (invariant 1.6)

  HOLD_FLOOR_DEG: 5.0,                // (PHYSIATRIST) below this the arm is resting/unloaded: accumulation pauses; the observable "arm lowered mid-hold" is INCOMPLETE_HOLD
  HOLD_FLOOR_EXIT_DEG: 7.0,           // (ME) hysteresis exit for the floor — re-load only above 7° so a tremor at the 5° edge cannot flap the timer / INCOMPLETE cue (pair with HOLD_FLOOR_DEG)
  HOLD_GOOD_BAND_MIN_DEG: 10.0,       // (PHYSIATRIST) good-band lower edge (gauge display / isTargetZone)
  HOLD_GOOD_BAND_MAX_DEG: 15.0,       // (PHYSIATRIST) good-band upper edge

  HOLD_SETTLE_MIN_DEG: 5.0,           // (ME) band-settle lower edge = floor: the arm must be loaded to arm a set
  HOLD_SETTLE_MAX_DEG: 15.0,          // (ME) band-settle upper edge = over-elevation cue: do not arm a set already over-elevated
  HOLD_SETTLE_S: 0.7,                 // (ME) angle must dwell continuously in [settle_min, settle_max] this long before the hold clock starts, so a hand sweeping through 12° on the way up does not start a hold

  OVER_ELEVATION_CUE_DEG: 15.0,        // (PHYSIATRIST) gentle LIVE nudge above 15° — does NOT stop the timer or fail the set on its own
  OVER_ELEVATION_CUE_EXIT_DEG: 13.0,   // (ME) hysteresis exit for the live nudge so a tremor around 15° does not flap OVER_ELEVATION on/off (pair with OVER_ELEVATION_CUE_DEG)
  OVER_ELEVATION_INVALIDATE_ENTER_DEG: 18.0, // (PHYSIATRIST default) continuous elevation above this arms the set-invalidation timer
  OVER_ELEVATION_INVALIDATE_EXIT_DEG: 15.0,  // (PHYSIATRIST) re-arm/reset that timer only when back below 15° — hysteresis pair with the 18° enter, so chatter at 18° cannot repeatedly re-trigger
  OVER_ELEVATION_INVALIDATE_SUSTAIN_S: 2.0,  // (PHYSIATRIST default ≈2s) continuous seconds above 18° before the set is INVALIDATED (records OVER_ELEVATION)

  HOLD_ELBOW_MIN_DEG: 160.0,          // (PHYSIATRIST) a straight arm is required; elbow angle below this = ELBOW_BENT. SEPARATE constant from the paced COMPENSATION_ELBOW_MIN_DEG (115) — different exercise, do not conflate

  HOLD_FLAG_PERSIST_S: 0.8,           // (ME) a live fault must persist this long before it is RECORDED into the set (matches the paced machine) — single-frame landmark jitter must never record a fault
  HOLD_ABANDON_S: 4.0,                // (ME) arm held below the floor (unloaded) continuously this long = the user let go → end the set and record what accumulated
  HOLD_POSE_LOST_TIMEOUT_S: 6.0,      // (ME) SIDE_LYING_NO_TRUNK_AXIS / no-detection sustained this long → end the set. NO fabricated flag: a lost landmark must never manufacture a fault (invariant 1.2)
  HOLD_WALLCLOCK_TIMEOUT_S: 90.0,     // (ME) absolute unstickability backstop (invariant 1.3): no legitimate single set (30s stretch goal + pauses) approaches this; force-end regardless of angle
  HOLD_MIN_VALID_S: 3.0,              // (ME) a set that accumulated less than this is a blip, not an effort — discard, record no set. A short-but-real hold (≥3s, e.g. 15s) is still recorded and credited (invariant 1.6)
  HOLD_REST_BETWEEN_SETS_S: 5.0,      // (ME) enforced recovery between isometric sets before a new set can arm. Clinician-tunable; NOT the paced REST_BETWEEN_REPS_S
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

// Angle definition — RIGHT-arm elevation of the humerus off the trunk long axis,
// in MediaPipe metric WORLD space (hip-centred, gravity-independent).
//
//   vArm       = rShoulder -> rElbow   (the humerus)
//   vTorsoDown = rShoulder -> rHip     (trunk long axis, pointing toward the pelvis)
//   returns angleBetweenVectorsDeg(vTorsoDown, vArm)
//
// Both vectors are anchored at the shoulder and expressed in the SAME metric world
// frame, so the result is the true 3D angle between humerus and trunk and does NOT
// depend on which way is up. On a human body:
//   0°  = arm lying alongside the trunk (down by the side / palm to thigh)
//   90° = arm held straight out, perpendicular to the trunk
//  180° = arm in line with the trunk past the head
//
// The one quantity is read differently per posture (why the catalog carries
// `posture` and each tracker interprets the number in its own frame):
//   - standing / seated: forward FLEXION toward a ~90° target — the target is a
//     FLOOR the user climbs to.
//   - sideLying:         ABDUCTION away from the body toward the ceiling. Because
//     the trunk long axis is roughly horizontal in side-lying and the arm lifts
//     off it, this SAME shoulder-to-hip computation is the abduction angle — see
//     §9 D1. The supraspinatus band is a low 10–15° and ABOVE it is the fault; the
//     target is a CEILING. The geometry is identical; only the reference differs.
//
// Degeneracies (invariant 1.2):
//   - Missing shoulder/elbow -> 0 (arm cannot be over-elevated; safe in every view).
//   - A genuine small angle (the 10–15° band) has non-zero vArm and vTorsoDown at a
//     small mutual angle — it is reported accurately because angleBetweenVectorsDeg
//     clamps the acos domain to [-1,1], so near-collinear arm/trunk does not yield NaN.
//   - side-lying with no usable trunk axis -> SIDE_LYING_NO_TRUNK_AXIS (never the
//     upright vertical fallback; never a fabricated in-band or over-band angle).
export function computeShoulderFlexion3D(worldLandmarks: Landmark3D[], posture: Posture = 'standing'): number {
  const rShoulder = worldLandmarks[LANDMARKS.RIGHT_SHOULDER]
  const lShoulder = worldLandmarks[LANDMARKS.LEFT_SHOULDER]
  const rHip = worldLandmarks[LANDMARKS.RIGHT_HIP]
  const lHip = worldLandmarks[LANDMARKS.LEFT_HIP]
  const rElbow = worldLandmarks[LANDMARKS.RIGHT_ELBOW]
  const nose = worldLandmarks[LANDMARKS.NOSE]
  if (!rShoulder || !rElbow) return 0

  const vArm = [rElbow.x - rShoulder.x, rElbow.y - rShoulder.y, rElbow.z - rShoulder.z]

  const hipsVisible = rHip && (rHip.visibility ?? 1) > 0.4

  // ── SIDE-LYING (additive; barred from the vertical fallbacks below) ──────────
  // The trunk is horizontal, so the nose/gravity fallbacks — which assume a
  // vertical trunk — are geometrically WRONG and never run for this posture.
  // Abduction is the angle of the humerus off the trunk long axis, exactly the
  // shoulder->hip computation used by the upright hips-visible branch. If the
  // up-side (right) hip drops below the visibility gate, fall back to the
  // down-side (left) hip: shoulder->left-hip still yields a shoulder->pelvis axis
  // in the SAME horizontal-trunk frame — never the vertical assumption. With no
  // usable hip (or a zero-norm axis) there is no trunk reference, so return the
  // sentinel rather than fabricate an angle.
  if (posture === 'sideLying') {
    const lHipVisible = lHip && (lHip.visibility ?? 1) > 0.4
    const hip = hipsVisible ? rHip : lHipVisible ? lHip : null
    if (!hip) return SIDE_LYING_NO_TRUNK_AXIS
    const vTorsoDown = [hip.x - rShoulder.x, hip.y - rShoulder.y, hip.z - rShoulder.z]
    if (norm(vTorsoDown) < 1e-6) return SIDE_LYING_NO_TRUNK_AXIS
    return angleBetweenVectorsDeg(vTorsoDown, vArm)
  }

  // ── STANDING (hip-referenced trunk vector; behaviour preserved) ─────────────
  if (posture === 'standing' && hipsVisible) {
    const vTorsoDown = [rHip.x - rShoulder.x, rHip.y - rShoulder.y, rHip.z - rShoulder.z]
    return angleBetweenVectorsDeg(vTorsoDown, vArm)
  }

  // ── STANDING (hips occluded) / SEATED: vertical nose-spine fallback ─────────
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

// Shoulder-hike (upper-trapezius shrug) magnitude. Definition holds only for an
// UPRIGHT subject: it is the RIGHT-vs-LEFT shoulder image-height difference
// (lShoulder.y - rShoulder.y), normalised by torso length (standing) or shoulder
// width (seated). 0 = level shoulders; positive = the right (working) shoulder
// riding up toward the ear. Image coordinates are used deliberately — a shrug is a
// small image-plane vertical migration and the world frame's hip-centring cancels
// much of it; the cost is that this only means anything while the shoulder line is
// roughly level, i.e. the subject is upright.
//
// SIDE-LYING (invariant 1.2 / §9 D3, honest verdict): return 0 (no hike). Lying on
// the side stacks the shoulders vertically, so (lShoulder.y - rShoulder.y) encodes
// how the body is rotated on the mat, NOT a trapezius shrug — it is meaningless
// here. A true up-side shrug (shoulder migrating toward the ear) is not separable
// from this single side view without a per-user rest baseline the pipeline does not
// capture. Returning 0 guarantees no false SHOULDER_HIKE; the side-lying tracker
// should not emit SHOULDER_HIKE at all (see design note). Barred from the upright
// branches below, which assume a level shoulder line.
export function computeShoulderHikeRatio(landmarks: Landmark3D[], posture: Posture = 'standing'): number {
  const rShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER]
  const lShoulder = landmarks[LANDMARKS.LEFT_SHOULDER]
  const rHip = landmarks[LANDMARKS.RIGHT_HIP]
  if (!rShoulder || !lShoulder) return 0

  if (posture === 'sideLying') return 0

  if (posture === 'seated' || !rHip || (rHip.visibility ?? 1) <= 0.4) {
    const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y)
    if (shoulderWidth < 1e-6) return 0
    return (lShoulder.y - rShoulder.y) / shoulderWidth
  }

  const torsoLen = Math.hypot(rShoulder.x - rHip.x, rShoulder.y - rHip.y)
  if (torsoLen < 1e-6) return 0
  return (lShoulder.y - rShoulder.y) / torsoLen
}

// Torso lean away from IMAGE-VERTICAL, in degrees. Definition assumes an UPRIGHT
// subject: the trunk vector (hip-midpoint -> shoulder-midpoint, or the nose->
// shoulder head vector when hips are occluded) is compared against image-up [0,-1].
// 0 = trunk plumb vertical; larger = leaning. Image coordinates are intentional —
// "lean" is defined relative to the room's vertical, which only the image frame
// carries.
//
// SIDE-LYING (invariant 1.2 / §9 D3, honest verdict): return 0 (no lean). A
// side-lying trunk is horizontal, so its tilt from image-vertical is ~90° every
// frame — this metric would raise TORSO_LEAN continuously and means nothing here. A
// genuine side-lying trunk fault (rolling forward/back off true side-lying, or
// piking at the hip) is largely a depth-axis motion that a single side camera
// cannot see reliably. Returning 0 guarantees no false TORSO_LEAN; the side-lying
// tracker should not emit TORSO_LEAN (see design note). Barred from the
// vertical-reference branches below.
export function computeTorsoTiltDeg(landmarks: Landmark3D[], posture: Posture = 'standing'): number {
  const rShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER]
  const lShoulder = landmarks[LANDMARKS.LEFT_SHOULDER]
  const rHip = landmarks[LANDMARKS.RIGHT_HIP]
  const lHip = landmarks[LANDMARKS.LEFT_HIP]
  const nose = landmarks[LANDMARKS.NOSE]
  if (!rShoulder || !lShoulder) return 0

  if (posture === 'sideLying') return 0

  const shoulderMid = [(rShoulder.x + lShoulder.x) / 2, (rShoulder.y + lShoulder.y) / 2]

  if (posture === 'seated' || !rHip || !lHip || (rHip.visibility ?? 1) <= 0.4) {
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
  // Paced-elevation tracker: only ever driven with 'standing' | 'seated' (the
  // side-lying isometric hold gets its own tracker class — §9 D2, added by
  // measurement-engineer). Kept as the full Posture union so the seam is honest
  // and the compiler forbids anyone silently coercing a third orientation onto
  // the seated branch.
  private posture: Posture
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

  constructor(targetReps = 10, posture: Posture = 'standing', targetHoldDurationS = 5.0) {
    this.targetReps = targetReps
    this.posture = posture
    this.targetHoldDurationS = targetHoldDurationS
  }

  public setPosture(posture: Posture): void {
    this.posture = posture
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

    const rawAngle = computeShoulderFlexion3D(worldLandmarks, this.posture)
    const angle = this.getSmoothedAngle(rawAngle)

    const activeFlags: FormFlag[] = []
    const elbowAngle = computeElbowExtensionDeg(worldLandmarks, landmarks2D)
    if (elbowAngle < CONFIG.COMPENSATION_ELBOW_MIN_DEG) {
      activeFlags.push('ELBOW_BENT')
    }

    const hikeRatio = computeShoulderHikeRatio(landmarks2D, this.posture)
    const hikeThreshold = this.posture === 'seated'
      ? CONFIG.COMPENSATION_SHOULDER_HIKE_RATIO_SEATED
      : CONFIG.COMPENSATION_SHOULDER_HIKE_RATIO_STANDING
    if (hikeRatio > hikeThreshold) {
      activeFlags.push('SHOULDER_HIKE')
    }

    const torsoTilt = computeTorsoTiltDeg(landmarks2D, this.posture)
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

    const restingEnter = this.posture === 'seated' ? CONFIG.RESTING_ENTER_SEATED : CONFIG.RESTING_ENTER_STANDING
    const restingExit = this.posture === 'seated' ? CONFIG.RESTING_EXIT_SEATED : CONFIG.RESTING_EXIT_STANDING

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
          // A flag must persist ~0.8s before it is recorded. Landmark jitter
          // produces single-frame spikes on otherwise clean movement, and a
          // corrective cue that flickers is worse than none. Author's judgment
          // from live runs — not a published standard, despite an earlier
          // comment here claiming one.
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

/**
 * Second tracking model (§9 D2): the side-lying supraspinatus ISOMETRIC HOLD.
 *
 * This is NOT the paced flexion machine with different numbers — it is a
 * different state machine for a different movement. There is no concentric or
 * eccentric phase and no tempo: the user lifts the arm a low 10–15° off the
 * (horizontal) trunk and simply HOLDS it there for an accumulated 20s. The
 * target is a CEILING, not a floor (§9 D1) — going ABOVE the band is the fault,
 * not going below it.
 *
 * Architect's state names READY → HOLDING → READY map onto the existing
 * RehabPhase values with no widening of the union: READY = 'RESTING' (the phase
 * already means "between efforts / waiting"), HOLDING = 'HOLDING'. 'ASCENDING'
 * and 'DESCENDING' are simply never entered by this machine — there is no ramp.
 *
 * MEASURABLE FLAGS (kinematicist's binding verdict): this tracker emits ONLY
 * OVER_ELEVATION, INCOMPLETE_HOLD, ELBOW_BENT. SHOULDER_HIKE and TORSO_LEAN are
 * not reliably measurable side-lying (their helpers return 0 for sideLying) and
 * are never computed here. RUSHED_* / PACING_* belong to a paced tempo this
 * exercise does not have and are never emitted. paceStatus is pinned 'IDLE'.
 *
 * UNMEASURABLE POSE: computeShoulderFlexion3D returns SIDE_LYING_NO_TRUNK_AXIS
 * (-1) when no horizontal trunk axis can be formed. On -1 (and on total
 * detection loss) the machine PAUSES: it does not accumulate hold time, does not
 * raise OVER_ELEVATION, and does not raise INCOMPLETE_HOLD off the -1 — a lost
 * landmark must never manufacture a fault (invariant 1.2). A sustained -1 ends
 * the set via HOLD_POSE_LOST_TIMEOUT_S with no fabricated flag.
 *
 * UNSTICKABILITY (invariant 1.3), proven per state:
 *   RESTING (READY): exits when the arm settles in-band (HOLD_SETTLE_S dwell)
 *     AND the between-sets rest has elapsed. It needs no forced timeout: it only
 *     WAITS for the user and runs no accumulator that can trap it; the bounded
 *     HOLD_REST_BETWEEN_SETS_S countdown always completes, after which arming is
 *     purely user-driven. (This mirrors the paced machine's RESTING.)
 *   HOLDING: exits on ANY of — 20s accumulated (complete); OVER_ELEVATION
 *     sustained (invalidate); arm unloaded HOLD_ABANDON_S (abandon); pose lost
 *     HOLD_POSE_LOST_TIMEOUT_S; or the absolute HOLD_WALLCLOCK_TIMEOUT_S backstop.
 *     PROOF it cannot freeze: every frame advances exactly one of
 *     {accumulatedHoldS (loaded), belowFloorElapsedS (unloaded),
 *     poseLostElapsedS (unmeasurable)} by dt, and the wall clock advances
 *     unconditionally — so a terminating condition is always approaching no
 *     matter where in the band the arm parks or how the pose degrades.
 */
export class ClientSideLyingHoldTracker {
  private phase: RehabPhase = 'RESTING' // READY = 'RESTING', HOLDING = 'HOLDING'
  private repCount = 0
  private nextRepIndex = 1
  private targetReps: number
  // Fixed by construction: this tracker is side-lying only. Kept explicit so the
  // geometry calls read the same `posture` argument the paced machine does.
  private readonly posture: Posture = 'sideLying'
  private targetHoldDurationS: number

  private smoothedBuffer: number[] = []
  private lastTimestampS = 0

  // READY (settle + between-sets rest)
  private settleElapsedS = 0
  private restStartT = 0

  // HOLDING
  private holdEnterT = 0
  private accumulatedHoldS = 0
  private peakAngleDeg = 0

  // Per-hold fault timers / hysteresis latches
  private belowFloor = false
  private belowFloorElapsedS = 0
  private overElevatingCue = false
  private overSustainedS = 0
  private elbowBentElapsedS = 0
  private poseLostElapsedS = 0
  private setFlags: Set<FormFlag> = new Set()

  constructor(targetReps = 5, targetHoldDurationS = CONFIG.HOLD_TARGET_S) {
    this.targetReps = targetReps
    this.targetHoldDurationS = targetHoldDurationS
  }

  public setHoldDuration(durationS: number): void {
    this.targetHoldDurationS = durationS
  }

  public setTargetReps(reps: number): void {
    this.targetReps = reps
  }

  // 5-sample median, identical to the paced machine. Safe here: this tracker
  // only THRESHOLDS and integrates elapsed time — it never DIFFERENTIATES the
  // angle framewise, so the median filter's stepwise output raises no spurious
  // velocity (the standing lesson in autoregulation/velocity.py does not apply).
  private getSmoothedAngle(rawAngle: number): number {
    this.smoothedBuffer.push(rawAngle)
    if (this.smoothedBuffer.length > 5) this.smoothedBuffer.shift()
    const sorted = [...this.smoothedBuffer].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted[mid] ?? rawAngle
  }

  private resetHoldState(): void {
    this.accumulatedHoldS = 0
    this.peakAngleDeg = 0
    this.belowFloor = false
    this.belowFloorElapsedS = 0
    this.overElevatingCue = false
    this.overSustainedS = 0
    this.elbowBentElapsedS = 0
    this.poseLostElapsedS = 0
    this.setFlags = new Set()
  }

  // Build the paused/idle live state shared by RESTING-idle and pose-loss frames.
  private pausedLive(
    elevation: number,
    holdRemaining: number,
    restRemaining: number,
    isTargetZone: boolean,
    flags: FormFlag[],
  ): RehabLiveState {
    return {
      elevation,
      phase: this.phase,
      holdRemaining: Math.round(holdRemaining * 10) / 10,
      restRemaining: Math.round(restRemaining * 10) / 10,
      concentricElapsed: 0,
      eccentricElapsed: 0,
      paceStatus: 'IDLE',
      expectedAngle: Math.round(CONFIG.HOLD_TARGET_ANGLE_DEG),
      isTargetZone,
      flags,
      repsCompleted: this.repCount,
      targetReps: this.targetReps,
    }
  }

  // Finalize the current set into a RehabRepRecord, or discard it if it never
  // accumulated a meaningful hold. Always returns the machine to RESTING and
  // starts the between-sets rest. holdDuration = accumulated IN-BAND seconds;
  // concentric/eccentric = 0 (no such phases). isClean = no recorded faults.
  private finalizeSet(timestampS: number): RehabRepRecord | null {
    const accumulated = this.accumulatedHoldS
    const peak = this.peakAngleDeg
    const flags = [...this.setFlags]

    // Record the set if it was a genuine attempt; discard only faultless blips.
    // A "blip" is a set that armed then ended with negligible time AND no recorded
    // fault — in practice a pose-loss/tracking glitch, not the user's doing, so
    // manufacturing a record from it would violate invariant 1.2. But a set that
    // carries a recorded fault (OVER_ELEVATION / INCOMPLETE_HOLD) is an informative
    // attempt even if brief — the fault IS the outcome worth showing — so it is
    // recorded regardless of duration. A short-but-clean hold (>= HOLD_MIN_VALID_S,
    // e.g. 15s) is likewise a valid credited outcome, never a failure (invariant 1.6).
    const isAttempt = accumulated >= CONFIG.HOLD_MIN_VALID_S || flags.length > 0

    let rep: RehabRepRecord | null = null
    if (isAttempt) {
      rep = {
        index: this.nextRepIndex++,
        concentricDuration: 0,
        holdDuration: Math.round(accumulated * 10) / 10,
        eccentricDuration: 0,
        peakElevation: Math.round(peak),
        flags,
        isClean: flags.length === 0,
      }
      this.repCount++
    }

    this.phase = 'RESTING'
    this.restStartT = timestampS
    this.settleElapsedS = 0
    this.resetHoldState()
    return rep
  }

  public process(
    worldLandmarks: Landmark3D[] | null,
    landmarks2D: Landmark3D[] | null,
    timestampS: number,
  ): { rep: RehabRepRecord | null; live: RehabLiveState } {
    const dt = this.lastTimestampS > 0 ? Math.max(0, Math.min(0.2, timestampS - this.lastTimestampS)) : 0.033
    this.lastTimestampS = timestampS

    const noPose = !worldLandmarks || !landmarks2D
    const rawAngle = noPose ? SIDE_LYING_NO_TRUNK_AXIS : computeShoulderFlexion3D(worldLandmarks!, this.posture)
    // The sentinel must NOT be median-smoothed with real angles (it would corrupt
    // the buffer with -1). Treat any unmeasurable frame as a hard "no reading".
    const measurable = rawAngle !== SIDE_LYING_NO_TRUNK_AXIS
    const angle = measurable ? this.getSmoothedAngle(rawAngle) : SIDE_LYING_NO_TRUNK_AXIS

    // ── RESTING (READY): wait out the between-sets rest, then settle to arm ──────
    if (this.phase === 'RESTING') {
      let restRemaining = 0
      if (this.restStartT > 0) {
        const restElapsed = Math.max(0, timestampS - this.restStartT)
        restRemaining = Math.max(0, CONFIG.HOLD_REST_BETWEEN_SETS_S - restElapsed)
      }

      if (!measurable) {
        this.settleElapsedS = 0
        return { rep: null, live: this.pausedLive(0, 0, restRemaining, false, []) }
      }

      const inSettleBand = angle >= CONFIG.HOLD_SETTLE_MIN_DEG && angle <= CONFIG.HOLD_SETTLE_MAX_DEG
      const isTargetZone = angle >= CONFIG.HOLD_GOOD_BAND_MIN_DEG && angle <= CONFIG.HOLD_GOOD_BAND_MAX_DEG

      // Band-settle only counts once the rest has elapsed. The continuous-dwell
      // requirement (not just "is in band") is what stops a hand sweeping up
      // through 12° from arming a set — it is only momentarily in-band.
      if (restRemaining <= 0 && inSettleBand) {
        this.settleElapsedS += dt
      } else {
        this.settleElapsedS = 0
      }

      if (this.settleElapsedS >= CONFIG.HOLD_SETTLE_S) {
        this.phase = 'HOLDING'
        this.holdEnterT = timestampS
        this.restStartT = 0
        this.settleElapsedS = 0
        this.resetHoldState()
        this.peakAngleDeg = angle
      }

      return {
        rep: null,
        live: this.pausedLive(
          Math.round(angle),
          CONFIG.HOLD_TARGET_S,
          restRemaining,
          isTargetZone,
          [],
        ),
      }
    }

    // ── HOLDING ─────────────────────────────────────────────────────────────────
    const wallElapsed = timestampS - this.holdEnterT

    // Unmeasurable frame (sentinel or no detection): PAUSE everything. Advance
    // only the pose-lost timer (and the wall clock, implicitly). Never accumulate,
    // never flag — the -1 is "waiting for a valid pose", not a fault.
    if (!measurable) {
      this.poseLostElapsedS += dt
      if (
        this.poseLostElapsedS >= CONFIG.HOLD_POSE_LOST_TIMEOUT_S ||
        wallElapsed >= CONFIG.HOLD_WALLCLOCK_TIMEOUT_S
      ) {
        const rep = this.finalizeSet(timestampS)
        return { rep, live: this.pausedLive(0, 0, 0, false, []) }
      }
      const holdRemaining = Math.max(0, this.targetHoldDurationS - this.accumulatedHoldS)
      return { rep: null, live: this.pausedLive(0, holdRemaining, 0, false, []) }
    }

    this.poseLostElapsedS = 0
    if (angle > this.peakAngleDeg) this.peakAngleDeg = angle

    const liveFlags: FormFlag[] = []

    // Floor detection with hysteresis (5° enter / 7° exit) drives BOTH the
    // accumulation gate and INCOMPLETE_HOLD.
    if (angle < CONFIG.HOLD_FLOOR_DEG) this.belowFloor = true
    else if (angle > CONFIG.HOLD_FLOOR_EXIT_DEG) this.belowFloor = false

    if (this.belowFloor) {
      // Arm lowered toward the resting floor mid-hold: pause the clock and nudge.
      this.belowFloorElapsedS += dt
      liveFlags.push('INCOMPLETE_HOLD')
      if (this.belowFloorElapsedS >= CONFIG.HOLD_FLAG_PERSIST_S) {
        this.setFlags.add('INCOMPLETE_HOLD')
      }
    } else {
      // Loaded (>= floor): this is the in-band accumulation the 20s target counts.
      // Over-elevation is a quality flag layered on top; it does NOT stop the clock.
      this.belowFloorElapsedS = 0
      this.accumulatedHoldS += dt
    }

    // Over-elevation LIVE cue with hysteresis (15° enter / 13° exit): a gentle
    // nudge that neither stops the clock nor fails the set on its own.
    if (angle > CONFIG.OVER_ELEVATION_CUE_DEG) this.overElevatingCue = true
    else if (angle < CONFIG.OVER_ELEVATION_CUE_EXIT_DEG) this.overElevatingCue = false
    if (this.overElevatingCue) liveFlags.push('OVER_ELEVATION')

    // Over-elevation INVALIDATION timer with hysteresis (18° enter / 15° reset):
    // continuous seconds above 18° accrue; dropping below 15° re-arms (resets);
    // the 15–18° band freezes the timer so chatter at 18° cannot re-trigger.
    if (angle > CONFIG.OVER_ELEVATION_INVALIDATE_ENTER_DEG) {
      this.overSustainedS += dt
    } else if (angle < CONFIG.OVER_ELEVATION_INVALIDATE_EXIT_DEG) {
      this.overSustainedS = 0
    }

    // Elbow-straight requirement: ELBOW_BENT below HOLD_ELBOW_MIN_DEG (160°),
    // recorded only once persisted. computeElbowExtensionDeg is posture-independent.
    const elbowAngle = computeElbowExtensionDeg(worldLandmarks!, landmarks2D!)
    if (elbowAngle < CONFIG.HOLD_ELBOW_MIN_DEG) {
      liveFlags.push('ELBOW_BENT')
      this.elbowBentElapsedS += dt
      if (this.elbowBentElapsedS >= CONFIG.HOLD_FLAG_PERSIST_S) {
        this.setFlags.add('ELBOW_BENT')
      }
    } else {
      this.elbowBentElapsedS = 0
    }

    // ── Exit conditions ─────────────────────────────────────────────────────────
    let rep: RehabRepRecord | null = null
    let ended = false

    if (this.accumulatedHoldS >= this.targetHoldDurationS) {
      // Complete.
      ended = true
    } else if (this.overSustainedS >= CONFIG.OVER_ELEVATION_INVALIDATE_SUSTAIN_S) {
      // Sustained over-elevation invalidates the set — record the fault, still
      // credit the effort by recording the set.
      this.setFlags.add('OVER_ELEVATION')
      ended = true
    } else if (this.belowFloorElapsedS >= CONFIG.HOLD_ABANDON_S) {
      // Arm set down: the user let go. INCOMPLETE_HOLD is already recorded.
      ended = true
    } else if (wallElapsed >= CONFIG.HOLD_WALLCLOCK_TIMEOUT_S) {
      // Absolute unstickability backstop.
      ended = true
    }

    const holdRemaining = Math.max(0, this.targetHoldDurationS - this.accumulatedHoldS)
    const isTargetZone = angle >= CONFIG.HOLD_GOOD_BAND_MIN_DEG && angle <= CONFIG.HOLD_GOOD_BAND_MAX_DEG

    if (ended) {
      rep = this.finalizeSet(timestampS)
      return {
        rep,
        live: this.pausedLive(Math.round(angle), 0, 0, false, []),
      }
    }

    return {
      rep: null,
      live: this.pausedLive(Math.round(angle), holdRemaining, 0, isTargetZone, liveFlags),
    }
  }
}
