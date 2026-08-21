// Shared fixtures + a synthetic-frame driver for the shoulderKinematics tests.
//
// This file is intentionally NOT named *.test.ts, so `node --test` does not try
// to run it as a test — it is imported by the real test files. It is still
// typechecked (it lives under src/, which tsconfig includes).
//
// Everything here builds MediaPipe-style WORLD landmark arrays in meters and
// synthesizes deterministic frame streams. Nothing touches a camera, a clock,
// or the DOM: the trackers are pure functions of (landmarks, timestamp).

import type {
  Landmark3D,
} from '../shoulderKinematics.ts'
import type {
  RehabLiveState,
  RehabRepRecord,
} from '../../domain/rehabTypes.ts'

const D2R = Math.PI / 180

// MediaPipe pose landmark indices used by the kinematics (mirror of LANDMARKS).
const NOSE = 0
const LEFT_SHOULDER = 11
const RIGHT_SHOULDER = 12
const RIGHT_ELBOW = 14
const RIGHT_WRIST = 16
const LEFT_HIP = 23
const RIGHT_HIP = 24

export interface Frame {
  world: Landmark3D[]
  l2d: Landmark3D[]
}

/**
 * A side-lying frame whose RIGHT-arm abduction off the trunk long axis is
 * exactly `angleDeg`.
 *
 * Construction: right shoulder at the origin, right hip at (0, 0.5, 0) so the
 * trunk long axis (shoulder->hip) points along +y. The elbow is placed at
 * 0.3 m from the shoulder at `angleDeg` off that axis, so
 * computeShoulderFlexion3D(..., 'sideLying') returns `angleDeg` by construction.
 * The wrist is placed collinear beyond the elbow (a straight, locked-out arm),
 * which drives computeElbowExtensionDeg's reach ratio to 1.0 -> 180 deg, so no
 * ELBOW_BENT is ever raised. 2D landmarks carry full visibility.
 */
export function sideLyingFrame(angleDeg: number): Frame {
  const th = angleDeg * D2R
  const s = Math.sin(th)
  const c = Math.cos(th)
  const world: Landmark3D[] = []
  world[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  world[RIGHT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 1 }
  world[RIGHT_ELBOW] = { x: 0.3 * s, y: 0.3 * c, z: 0 }
  world[RIGHT_WRIST] = { x: 0.6 * s, y: 0.6 * c, z: 0 } // collinear -> straight arm
  const l2d: Landmark3D[] = []
  l2d[RIGHT_ELBOW] = { x: 0.5, y: 0.5, z: 0, visibility: 1 }
  l2d[RIGHT_WRIST] = { x: 0.6, y: 0.5, z: 0, visibility: 1 }
  return { world, l2d }
}

/**
 * A side-lying frame that is UNMEASURABLE: the up-side (right) hip is below the
 * visibility gate and there is no left hip, so no horizontal trunk axis can be
 * formed and computeShoulderFlexion3D returns SIDE_LYING_NO_TRUNK_AXIS (-1).
 * The arm landmarks are present and plausible so this is specifically a
 * lost-trunk-axis case, not a lost-arm case.
 */
export function unmeasurableFrame(): Frame {
  const world: Landmark3D[] = []
  world[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  world[RIGHT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 0.2 } // occluded
  world[RIGHT_ELBOW] = { x: 0.062372, y: 0.293445, z: 0 }
  world[RIGHT_WRIST] = { x: 0.124744, y: 0.586890, z: 0 }
  // no LEFT_HIP -> no fallback trunk axis
  const l2d: Landmark3D[] = []
  l2d[RIGHT_ELBOW] = { x: 0.5, y: 0.5, z: 0, visibility: 1 }
  l2d[RIGHT_WRIST] = { x: 0.6, y: 0.5, z: 0, visibility: 1 }
  return { world, l2d }
}

// A tracker with the process() shape both classes share, so the driver is generic.
export interface ProcessLike {
  process(
    world: Landmark3D[] | null,
    l2d: Landmark3D[] | null,
    timestampS: number,
  ): { rep: RehabRepRecord | null; live: RehabLiveState }
}

export interface Segment {
  frame: Frame
  seconds: number
}

export interface DriveResult {
  reps: RehabRepRecord[]
  liveLog: RehabLiveState[]
  lastLive: RehabLiveState
}

/**
 * Drive a tracker over a list of (frame, seconds) segments at ~30 fps, advancing
 * a monotonic timestamp. Collects every emitted rep and every live state. When
 * `stopOnFirstRep` is set, playback halts on the frame that emits the first rep
 * (so a completed set does not silently arm a second one).
 */
export function drive(
  tracker: ProcessLike,
  segments: Segment[],
  opts: { fps?: number; stopOnFirstRep?: boolean } = {},
): DriveResult {
  const fps = opts.fps ?? 30
  const dt = 1 / fps
  let t = 0
  const reps: RehabRepRecord[] = []
  const liveLog: RehabLiveState[] = []
  let lastLive: RehabLiveState | null = null

  for (const seg of segments) {
    const frames = Math.round(seg.seconds * fps)
    for (let i = 0; i < frames; i++) {
      t += dt
      const { rep, live } = tracker.process(seg.frame.world, seg.frame.l2d, t)
      liveLog.push(live)
      lastLive = live
      if (rep) {
        reps.push(rep)
        if (opts.stopOnFirstRep) {
          return { reps, liveLog, lastLive }
        }
      }
    }
  }

  if (!lastLive) throw new Error('drive() ran zero frames')
  return { reps, liveLog, lastLive }
}

export { NOSE, LEFT_SHOULDER, RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST, LEFT_HIP, RIGHT_HIP }
