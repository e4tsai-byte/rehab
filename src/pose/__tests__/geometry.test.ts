// Layer 1 — static geometry fixtures with hand-computed ground truth, plus the
// migration regression guard (isSeated -> posture).
//
// Every world landmark is in meters. The abduction/flexion angle under test is
// angleBetweenVectorsDeg(shoulder->hip, shoulder->elbow); the fixtures pin an
// elbow 0.3 m from the shoulder so the expected degree is exact by construction.
// These catch sign errors, axis confusion, and reference-frame mistakes that are
// invisible in motion because the number still looks plausible.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  computeShoulderFlexion3D,
  SIDE_LYING_NO_TRUNK_AXIS,
} from '../shoulderKinematics.ts'
import type { Landmark3D } from '../shoulderKinematics.ts'
import {
  RIGHT_SHOULDER,
  LEFT_SHOULDER,
  RIGHT_ELBOW,
  RIGHT_HIP,
  LEFT_HIP,
  NOSE,
} from './_helpers.ts'

// Angles are exact by construction to ~1e-3 deg; assert to 0.01.
const TOL = 0.01
function assertAngle(actual: number, expected: number, msg: string): void {
  assert.ok(
    Math.abs(actual - expected) < TOL,
    `${msg}: expected ${expected}, got ${actual}`,
  )
}

test('sideLying in-band: 12 deg abduction against a visible up-side hip', () => {
  const lm: Landmark3D[] = []
  lm[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  lm[RIGHT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 1 }
  lm[RIGHT_ELBOW] = { x: 0.062372, y: 0.293445, z: 0 }
  assertAngle(computeShoulderFlexion3D(lm, 'sideLying'), 12.0, 'in-band')
})

test('sideLying over-elevation: 25 deg abduction is reported accurately', () => {
  const lm: Landmark3D[] = []
  lm[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  lm[RIGHT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 1 }
  lm[RIGHT_ELBOW] = { x: 0.126785, y: 0.271892, z: 0 }
  assertAngle(computeShoulderFlexion3D(lm, 'sideLying'), 25.0, 'over-elevation')
})

test('sideLying up-side hip occluded: falls back to the down-side (left) hip, same 12 deg', () => {
  const lm: Landmark3D[] = []
  lm[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  lm[RIGHT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 0.2 } // below the 0.4 gate
  lm[LEFT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 1 }
  lm[RIGHT_ELBOW] = { x: 0.062372, y: 0.293445, z: 0 }
  assertAngle(computeShoulderFlexion3D(lm, 'sideLying'), 12.0, 'left-hip fallback')
})

test('sideLying no trunk axis: both hips below the gate returns the sentinel, never a fabricated angle', () => {
  const lm: Landmark3D[] = []
  lm[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  lm[RIGHT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 0.2 }
  lm[LEFT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 0.2 }
  lm[RIGHT_ELBOW] = { x: 0.062372, y: 0.293445, z: 0 }
  assert.equal(
    computeShoulderFlexion3D(lm, 'sideLying'),
    SIDE_LYING_NO_TRUNK_AXIS,
    'no trunk axis -> -1',
  )
})

test('sideLying no trunk axis: left hip entirely absent also returns the sentinel', () => {
  const lm: Landmark3D[] = []
  lm[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  lm[RIGHT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 0.2 }
  // no LEFT_HIP at all
  lm[RIGHT_ELBOW] = { x: 0.062372, y: 0.293445, z: 0 }
  assert.equal(computeShoulderFlexion3D(lm, 'sideLying'), SIDE_LYING_NO_TRUNK_AXIS)
})

// ── Degeneracy: upright paths keep their existing 0 return on missing landmarks
// (only side-lying uses the -1 sentinel). ─────────────────────────────────────
test('missing elbow returns 0 in every posture (arm cannot be over-elevated)', () => {
  const lm: Landmark3D[] = []
  lm[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  lm[RIGHT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 1 }
  // no elbow
  assert.equal(computeShoulderFlexion3D(lm, 'standing'), 0)
  assert.equal(computeShoulderFlexion3D(lm, 'seated'), 0)
  assert.equal(computeShoulderFlexion3D(lm, 'sideLying'), 0)
})

// ── Regression guard: the isSeated(boolean) -> posture(union) migration must be
// behaviour-preserving for the upright paths. These reference values are the
// pre-refactor outputs for a representative pose; if the migration ever changes
// them, this fails. ───────────────────────────────────────────────────────────
test('standing (hips visible) hip-referenced trunk vector: 90 deg and 12 deg reference poses', () => {
  const base: Landmark3D[] = []
  base[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  base[RIGHT_HIP] = { x: 0, y: 0.5, z: 0, visibility: 1 }

  const armOut: Landmark3D[] = [...base]
  armOut[RIGHT_ELBOW] = { x: 0.3, y: 0, z: 0 } // perpendicular to the trunk
  assertAngle(computeShoulderFlexion3D(armOut, 'standing'), 90.0, 'standing 90')

  const armLow: Landmark3D[] = [...base]
  armLow[RIGHT_ELBOW] = { x: 0.062372, y: 0.293445, z: 0 }
  assertAngle(computeShoulderFlexion3D(armLow, 'standing'), 12.0, 'standing 12')
})

test('seated nose-spine fallback (hips occluded): 12 deg reference pose', () => {
  // Seated always uses the vertical nose->shoulder fallback (hips typically
  // occluded by a desk). midShoulder=(-0.2,0,0); spine-down = midShoulder-nose =
  // (0,0.5,0); arm = (0.062372,0.293445,0) -> 12 deg.
  const lm: Landmark3D[] = []
  lm[RIGHT_SHOULDER] = { x: 0, y: 0, z: 0 }
  lm[LEFT_SHOULDER] = { x: -0.4, y: 0, z: 0 }
  lm[NOSE] = { x: -0.2, y: -0.5, z: 0 }
  lm[RIGHT_ELBOW] = { x: 0.062372, y: 0.293445, z: 0 }
  assertAngle(computeShoulderFlexion3D(lm, 'seated'), 12.0, 'seated 12')
})
