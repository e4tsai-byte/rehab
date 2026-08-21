// Layer 2/3 — sequence + degeneracy tests for ClientSideLyingHoldTracker.
//
// Each test synthesizes a landmark stream at ~30 fps and asserts the recorded
// set: hold duration, peak angle, which flags landed, and whether the set is
// clean. Tests are named after the real-world scenario, not the code path.
//
// The tracker arms a set only after the arm SETTLES in-band (>= HOLD_SETTLE_S in
// [5,15] deg), so every scenario that needs a live hold begins with a short
// settle segment near 12 deg before moving the arm to the angle under test.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { ClientSideLyingHoldTracker } from '../shoulderKinematics.ts'
import type { FormFlag } from '../../domain/rehabTypes.ts'
import { drive, sideLyingFrame, unmeasurableFrame } from './_helpers.ts'

function hasFlag(flags: readonly FormFlag[], f: FormFlag): boolean {
  return flags.includes(f)
}

test('a steady 12 deg hold for >=20s records a completed, clean set', () => {
  const tracker = new ClientSideLyingHoldTracker()
  // One 22s segment at 12 deg: the tracker settles (~0.7s), then accumulates 20s.
  const { reps } = drive(
    tracker,
    [{ frame: sideLyingFrame(12), seconds: 22 }],
    { stopOnFirstRep: true },
  )
  assert.equal(reps.length, 1, 'exactly one set recorded')
  const rep = reps[0]!
  assert.ok(
    Math.abs(rep.holdDuration - 20) <= 0.2,
    `holdDuration ~= 20, got ${rep.holdDuration}`,
  )
  assert.equal(rep.peakElevation, 12, 'peak ~= 12 deg')
  assert.equal(rep.isClean, true, 'clean set')
  assert.equal(rep.flags.length, 0, 'no flags')
  assert.equal(rep.concentricDuration, 0, 'no concentric phase side-lying')
  assert.equal(rep.eccentricDuration, 0, 'no eccentric phase side-lying')
})

test('a 0.3s sweep through the band does not arm a hold (settle gate)', () => {
  const tracker = new ClientSideLyingHoldTracker()
  const { reps, liveLog } = drive(tracker, [
    { frame: sideLyingFrame(12), seconds: 0.3 }, // too brief to settle
    { frame: sideLyingFrame(0), seconds: 2.0 }, // arm back down
  ])
  assert.equal(reps.length, 0, 'no set armed or recorded')
  assert.ok(
    liveLog.every((l) => l.phase === 'RESTING'),
    'machine never left RESTING',
  )
})

test('a sustained ~25 deg over-elevation invalidates the set (OVER_ELEVATION recorded, not clean)', () => {
  const tracker = new ClientSideLyingHoldTracker()
  const { reps } = drive(
    tracker,
    [
      { frame: sideLyingFrame(12), seconds: 1.0 }, // settle + arm
      { frame: sideLyingFrame(25), seconds: 3.0 }, // >18 deg sustained > 2s
    ],
    { stopOnFirstRep: true },
  )
  assert.equal(reps.length, 1, 'the invalidated set is still recorded (the fault is the outcome)')
  const rep = reps[0]!
  assert.ok(hasFlag(rep.flags, 'OVER_ELEVATION'), 'OVER_ELEVATION recorded')
  assert.equal(rep.isClean, false, 'not clean')
})

test('arm dropped below the 5 deg floor mid-hold records INCOMPLETE_HOLD', () => {
  const tracker = new ClientSideLyingHoldTracker()
  const { reps } = drive(
    tracker,
    [
      { frame: sideLyingFrame(12), seconds: 1.0 }, // settle + arm
      { frame: sideLyingFrame(12), seconds: 5.0 }, // real hold
      { frame: sideLyingFrame(2), seconds: 5.0 }, // arm lowered > HOLD_ABANDON_S
    ],
    { stopOnFirstRep: true },
  )
  assert.equal(reps.length, 1, 'the partial set is recorded')
  const rep = reps[0]!
  assert.ok(hasFlag(rep.flags, 'INCOMPLETE_HOLD'), 'INCOMPLETE_HOLD recorded')
  assert.equal(rep.isClean, false, 'not clean')
  assert.ok(rep.holdDuration >= 3, `credited the ~5s that was held, got ${rep.holdDuration}`)
})

test('a sustained unmeasurable pose fabricates no flag and ends the set via the pose-lost timeout', () => {
  const tracker = new ClientSideLyingHoldTracker()
  const { reps, liveLog } = drive(
    tracker,
    [
      { frame: sideLyingFrame(12), seconds: 1.0 }, // settle + arm
      { frame: sideLyingFrame(12), seconds: 4.0 }, // ~4s of real hold
      { frame: unmeasurableFrame(), seconds: 6.5 }, // pose lost > HOLD_POSE_LOST_TIMEOUT_S
    ],
    { stopOnFirstRep: true },
  )
  assert.equal(reps.length, 1, 'the pre-loss effort is recorded')
  const rep = reps[0]!
  assert.equal(rep.flags.length, 0, 'no fabricated flag from lost landmarks')
  assert.equal(rep.isClean, true, 'clean: a lost pose is not a fault')
  // Accumulation paused during the loss: the recorded hold is the pre-loss ~4s,
  // not the ~10s of wall time that elapsed.
  assert.ok(
    rep.holdDuration >= 3.5 && rep.holdDuration <= 5.0,
    `hold ~= pre-loss 4s, not wall time; got ${rep.holdDuration}`,
  )
  // No live frame during the whole stream raised any flag.
  assert.ok(liveLog.every((l) => l.flags.length === 0), 'no live flag ever raised')
  // Machine returned to RESTING after the timeout.
  assert.equal(tracker.process(null, null, 999).live.phase, 'RESTING')
})

test('a gentle 16 deg hold completes CLEAN with a live over-elevation cue but no recorded OVER_ELEVATION', () => {
  const tracker = new ClientSideLyingHoldTracker()
  const { reps, liveLog } = drive(
    tracker,
    [
      { frame: sideLyingFrame(13), seconds: 1.0 }, // settle in-band + arm
      { frame: sideLyingFrame(16), seconds: 21 }, // above the 15 deg cue, below the 18 deg invalidation line
    ],
    { stopOnFirstRep: true },
  )
  assert.equal(reps.length, 1, 'the set completes')
  const rep = reps[0]!
  assert.equal(rep.isClean, true, 'clean: 16 deg never crossed the 18 deg invalidation line')
  assert.ok(!hasFlag(rep.flags, 'OVER_ELEVATION'), 'OVER_ELEVATION NOT recorded on the rep')
  // But the live cue was present while the arm sat at 16 deg.
  assert.ok(
    liveLog.some((l) => hasFlag(l.flags, 'OVER_ELEVATION')),
    'live OVER_ELEVATION cue was shown during the hold',
  )
})
