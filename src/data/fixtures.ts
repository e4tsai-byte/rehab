/* ─────────────────────────────────────────────────────────────────────────────
   Fixture data source. Implements SessionDataSource with simulated data.

   In October a LocalhostDataSource implements the identical interface against
   the Python pose pipeline. No UI code imports this file directly.

   The 期 is deliberately mid-flight: the pre session is fully assessed so the
   sheet can show a real pre/post comparison, and the post session is partway
   through with one of every edge case already in the log, including a void
   followed by a successful restart and a correction on top of a complete trial.
   ───────────────────────────────────────────────────────────────────────────── */

import {
  type AbortReason,
  type AnyRecord,
  type AssessmentSession,
  type Block,
  type CorrectionNote,
  type Outcome,
  type Participant,
  type ParticipantId,
  type RecordId,
  type SessionId,
  type TrackingState,
  type TrialEvent,
  PRESCRIBED_REPS,
} from '../domain/types'
import type { SessionDataSource, TrialId, Unsubscribe } from './SessionDataSource'

/* ── The 期 ───────────────────────────────────────────────────────────────── */

const PARTICIPANTS: readonly Participant[] = [
  { id: 'P-0041', label: '王阿姨' },
  { id: 'P-0042', label: '陳媽' },
  { id: 'P-0043', label: '林伯' },
  { id: 'P-0044', label: '張姐' },
  { id: 'P-0045', label: '李伯' },
  { id: 'P-0046', label: '黃阿姨' },
  { id: 'P-0047', label: '吳媽' },
  { id: 'P-0048', label: '蔡伯' },
  { id: 'P-0049', label: '鄭姐' },
  { id: 'P-0050', label: '許阿姨' },
  { id: 'P-0051', label: '曾伯' },
  { id: 'P-0052', label: '何媽' },
]

const BLOCK: Block = {
  blockId: 'B-2026-03',
  siteName: '示範社區照顧關懷據點',
  blockName: '115 年度第 3 期',
  startedIso: '2026-05-04',
  participants: PARTICIPANTS,
}

const SESSION_PRE: AssessmentSession = {
  sessionId: 'S-pre',
  blockId: BLOCK.blockId,
  phase: 'pre',
  dateIso: '2026-05-04',
}

const SESSION_POST: AssessmentSession = {
  sessionId: 'S-post',
  blockId: BLOCK.blockId,
  phase: 'post',
  dateIso: '2026-07-27',
}

const SEAT_CM = 45

/* ── Outcome builders ─────────────────────────────────────────────────────── */

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0)

function complete(repTimesMs: readonly number[]): Outcome {
  return { kind: 'complete', repsCompleted: 5, repTimesMs, totalMs: sum(repTimesMs) }
}

function incomplete(repTimesMs: readonly number[]): Outcome {
  return {
    kind: 'incomplete',
    repsCompleted: repTimesMs.length,
    repTimesMs,
    elapsedMs: sum(repTimesMs),
  }
}

function handContact(repTimesMs: readonly number[], firstContactRep: number): Outcome {
  return {
    kind: 'hand_contact',
    repsCompleted: repTimesMs.length,
    repTimesMs,
    elapsedMs: sum(repTimesMs),
    firstContactRep,
    protocolInvalid: true,
  }
}

const unable: Outcome = { kind: 'unable' }

/* ── The record log, append-only and in log order ─────────────────────────── */

let recordSeq = 0
const nextRecordId = (): RecordId => `R-${(++recordSeq).toString().padStart(4, '0')}`

function trial(
  sessionId: SessionId,
  participantId: ParticipantId,
  outcome: Outcome,
  startedIso: string,
): AnyRecord {
  return {
    recordId: nextRecordId(),
    kind: 'trial',
    sessionId,
    participantId,
    outcome,
    startedIso,
    seatHeightCm: outcome.kind === 'unable' ? null : SEAT_CM,
  }
}

/** Valid ISO timestamp from a minute offset. Minutes above 59 roll into hours. */
function at(dateIso: string, fromHour: number, minuteOffset: number, second = 0): string {
  const h = fromHour + Math.floor(minuteOffset / 60)
  const m = minuteOffset % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${dateIso}T${pad(h)}:${pad(m)}:${pad(second)}`
}

function buildLog(): AnyRecord[] {
  const log: AnyRecord[] = []

  /* ── PRE session: all 12 assessed ─────────────────────────────────────── */
  const pre = (min: number, sec = 0) => at(SESSION_PRE.dateIso, 9, min, sec)
  log.push(trial(SESSION_PRE.sessionId, 'P-0041', complete([2900, 3100, 3200, 3400, 3600]), pre(12)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0042', complete([3400, 3600, 3900, 4100, 4400]), pre(18)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0043', complete([2400, 2500, 2600, 2700, 2800]), pre(24)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0044', complete([3800, 4000, 4300, 4600, 5000]), pre(31)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0045', complete([2700, 2800, 2900, 3000, 3200]), pre(37)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0046', incomplete([4200, 4600, 5100]), pre(43)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0047', complete([3100, 3300, 3400, 3600, 3800]), pre(49)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0048', handContact([3300, 3500, 3900, 4300, 4700], 3), pre(55)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0049', complete([2600, 2700, 2800, 3000, 3100]), pre(61)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0050', unable, pre(66)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0051', complete([3000, 3200, 3300, 3500, 3700]), pre(70)))
  log.push(trial(SESSION_PRE.sessionId, 'P-0052', complete([3600, 3800, 4100, 4400, 4800]), pre(76)))

  /* ── POST session: mid-flight, 7 of 12 assessed ───────────────────────── */
  const post = (min: number, sec = 0) => at(SESSION_POST.dateIso, 9, min, sec)

  // Straightforward improvements.
  log.push(trial(SESSION_POST.sessionId, 'P-0041', complete([2500, 2600, 2700, 2800, 2900]), post(10)))
  log.push(trial(SESSION_POST.sessionId, 'P-0042', complete([3000, 3100, 3300, 3500, 3700]), post(16)))

  // EDGE: void from tracking loss, then a successful restart. Both stay in the
  // log; only the restart represents the participant. Feeds the void-rate metric.
  log.push(
    trial(
      SESSION_POST.sessionId,
      'P-0043',
      { kind: 'void', reason: 'roi_multiple_people', repsCompleted: 2 },
      post(21),
    ),
  )
  log.push(trial(SESSION_POST.sessionId, 'P-0043', complete([2200, 2300, 2300, 2400, 2500]), post(22, 30)))

  // EDGE: incomplete. Three reps is a valid recorded outcome, not an error.
  log.push(trial(SESSION_POST.sessionId, 'P-0044', incomplete([4000, 4300, 4700]), post(28)))

  // EDGE: abort with a reason. Does not represent the participant, so P-0045
  // still reads as outstanding on the roster.
  log.push(
    trial(
      SESSION_POST.sessionId,
      'P-0045',
      { kind: 'aborted', reason: 'interruption', repsCompleted: 1, elapsedMs: 3100 },
      post(33),
    ),
  )

  // EDGE: hand contact. Recorded in full, marked protocol-invalid, no alarm.
  log.push(trial(SESSION_POST.sessionId, 'P-0048', handContact([3000, 3200, 3500, 3800, 4000], 4), post(39)))

  // EDGE: unable to perform the protocol. Still enrolled, still counted present.
  log.push(trial(SESSION_POST.sessionId, 'P-0050', unable, post(45)))

  // EDGE: a correction appended on top of a complete trial. The original is
  // preserved forever; the roster shows the corrected outcome plus a marker.
  const miscounted = trial(SESSION_POST.sessionId, 'P-0047', complete([3000, 3200, 3300, 3500, 3600]), post(51))
  log.push(miscounted)
  log.push({
    recordId: nextRecordId(),
    kind: 'correction',
    sessionId: SESSION_POST.sessionId,
    participantId: 'P-0047',
    correctsRecordId: miscounted.recordId,
    outcome: incomplete([3000, 3200, 3300, 3500]),
    note: 'rep_miscount',
    atIso: post(52, 30),
  })

  // Outstanding at post: P-0046, P-0049, P-0051, P-0052, and P-0045 (abort only).
  return log
}

/* ── Live trial simulation ────────────────────────────────────────────────────
   Scripts the scenario switcher can select. Each emits the same TrialEvent shapes
   the Python pipeline will emit in October.
   ───────────────────────────────────────────────────────────────────────────── */

export type TrialScript =
  | 'complete_typical'
  | 'complete_slow'
  | 'incomplete_three'
  | 'hand_contact'
  | 'void_midway'

const SCRIPTS: Record<TrialScript, { reps: readonly number[]; handContactRep?: number; voidAfter?: number }> = {
  complete_typical: { reps: [2400, 2500, 2600, 2700, 2900] },
  complete_slow: { reps: [3400, 3700, 3900, 4200, 4600] },
  // Ends after 3 reps and then waits: the facilitator presses 結束, which is
  // what produces `incomplete`. The instrument never decides someone is done.
  incomplete_three: { reps: [4100, 4500, 4900] },
  hand_contact: { reps: [3000, 3200, 3600, 3900, 4200], handContactRep: 3 },
  void_midway: { reps: [2600, 2700], voidAfter: 2 },
}

interface LiveTrial {
  readonly trialId: TrialId
  readonly sessionId: SessionId
  readonly participantId: ParticipantId
  readonly script: TrialScript
  readonly startedIso: string
  handlers: Set<(e: TrialEvent) => void>
  timers: number[]
  repTimes: number[]
  handContactAt: number | null
  voided: boolean
  settled: boolean
}

/* ── The source ───────────────────────────────────────────────────────────── */

export class FixtureDataSource implements SessionDataSource {
  readonly isSimulated = true

  private log: AnyRecord[] = buildLog()
  private tracking: TrackingState = 'idle'
  private trackingHandlers = new Set<(s: TrackingState) => void>()
  private recordHandlers = new Set<() => void>()
  private live: LiveTrial | null = null
  private trialSeq = 0

  /** Selected by the scenario switcher. Drives the next live trial. */
  nextScript: TrialScript = 'complete_typical'

  async getBlock(): Promise<Block> {
    return BLOCK
  }

  async getSessions(): Promise<readonly AssessmentSession[]> {
    return [SESSION_PRE, SESSION_POST]
  }

  async getRecords(sessionId: SessionId): Promise<readonly AnyRecord[]> {
    return this.log.filter((r) => r.sessionId === sessionId)
  }

  getTrackingState(): TrackingState {
    return this.tracking
  }

  subscribeTracking(handler: (s: TrackingState) => void): Unsubscribe {
    this.trackingHandlers.add(handler)
    return () => this.trackingHandlers.delete(handler)
  }

  subscribeRecords(handler: () => void): Unsubscribe {
    this.recordHandlers.add(handler)
    return () => this.recordHandlers.delete(handler)
  }

  private setTracking(s: TrackingState) {
    this.tracking = s
    for (const h of this.trackingHandlers) h(s)
    this.emit({ type: 'tracking', state: s })
  }

  private emit(e: TrialEvent) {
    if (!this.live) return
    for (const h of this.live.handlers) h(e)
  }

  private announceRecords() {
    for (const h of this.recordHandlers) h()
  }

  private append(r: AnyRecord) {
    this.log = [...this.log, r]
    this.announceRecords()
  }

  async startTrial(sessionId: SessionId, participantId: ParticipantId): Promise<TrialId> {
    this.clearLive()
    const trialId = `T-${++this.trialSeq}`
    const script = this.nextScript
    this.live = {
      trialId,
      sessionId,
      participantId,
      script,
      startedIso: new Date().toISOString(),
      handlers: new Set(),
      timers: [],
      repTimes: [],
      handContactAt: null,
      voided: false,
      settled: false,
    }
    // Tracking goes live one frame after the cue, as it would on the appliance.
    const t = window.setTimeout(() => this.beginScript(), 120)
    this.live.timers.push(t)
    return trialId
  }

  private beginScript() {
    const live = this.live
    if (!live) return
    this.setTracking('live')

    const spec = SCRIPTS[live.script]
    let elapsed = 0

    spec.reps.forEach((repMs, i) => {
      elapsed += repMs
      const at = elapsed
      const index = i + 1
      const t = window.setTimeout(() => {
        if (!this.live || this.live.trialId !== live.trialId || this.live.settled) return

        if (spec.voidAfter !== undefined && index > spec.voidAfter) return

        this.live.repTimes.push(repMs)
        this.emit({ type: 'rep', index, repMs, elapsedMs: at })

        if (spec.handContactRep === index) {
          this.live.handContactAt = index
          this.emit({ type: 'hand_contact', repIndex: index })
        }

        // Auto-settle only at the prescribed rep count. Fewer reps require the
        // facilitator to press 結束; the instrument never decides.
        if (index === PRESCRIBED_REPS) {
          this.settleComplete()
        }
      }, at)
      live.timers.push(t)
    })

    if (spec.voidAfter !== undefined) {
      const voidAtRep = spec.reps.slice(0, spec.voidAfter)
      const voidAt = sum(voidAtRep) + 900
      const t = window.setTimeout(() => {
        if (!this.live || this.live.trialId !== live.trialId || this.live.settled) return
        this.live.voided = true
        this.live.settled = true
        this.setTracking('lost')
        const outcome: Outcome = {
          kind: 'void',
          reason: 'roi_multiple_people',
          repsCompleted: this.live.repTimes.length,
        }
        this.append(this.toRecord(this.live, outcome))
        this.emit({ type: 'void', reason: 'roi_multiple_people' })
        this.emit({ type: 'settled', outcome })
      }, voidAt)
      live.timers.push(t)
    }
  }

  private toRecord(live: LiveTrial, outcome: Outcome): AnyRecord {
    return {
      recordId: nextRecordId(),
      kind: 'trial',
      sessionId: live.sessionId,
      participantId: live.participantId,
      outcome,
      startedIso: live.startedIso,
      seatHeightCm: outcome.kind === 'unable' ? null : SEAT_CM,
    }
  }

  private settleComplete() {
    const live = this.live
    if (!live || live.settled) return
    live.settled = true
    this.setTracking('idle')

    const outcome: Outcome =
      live.handContactAt !== null
        ? handContact(live.repTimes, live.handContactAt)
        : complete(live.repTimes)

    this.append(this.toRecord(live, outcome))
    this.emit({ type: 'settled', outcome })
  }

  async endTrial(): Promise<Outcome> {
    const live = this.live
    if (!live) throw new Error('no live trial')
    if (live.settled) throw new Error('trial already settled')

    live.settled = true
    this.clearTimers(live)
    this.setTracking('idle')

    const reps = live.repTimes
    const outcome: Outcome =
      live.handContactAt !== null
        ? handContact(reps, live.handContactAt)
        : reps.length >= PRESCRIBED_REPS
          ? complete(reps)
          : incomplete(reps)

    this.append(this.toRecord(live, outcome))
    this.emit({ type: 'settled', outcome })
    return outcome
  }

  async abortTrial(_trialId: TrialId, reason: AbortReason): Promise<Outcome> {
    const live = this.live
    if (!live) throw new Error('no live trial')
    live.settled = true
    this.clearTimers(live)
    this.setTracking('idle')

    const outcome: Outcome = {
      kind: 'aborted',
      reason,
      repsCompleted: live.repTimes.length,
      elapsedMs: sum(live.repTimes),
    }
    this.append(this.toRecord(live, outcome))
    this.emit({ type: 'settled', outcome })
    return outcome
  }

  async markUnable(sessionId: SessionId, participantId: ParticipantId): Promise<Outcome> {
    const outcome: Outcome = { kind: 'unable' }
    this.append({
      recordId: nextRecordId(),
      kind: 'trial',
      sessionId,
      participantId,
      outcome,
      startedIso: new Date().toISOString(),
      seatHeightCm: null,
    })
    return outcome
  }

  async appendCorrection(input: {
    sessionId: SessionId
    participantId: ParticipantId
    correctsRecordId: RecordId
    outcome: Outcome
    note: CorrectionNote
  }): Promise<void> {
    this.append({
      recordId: nextRecordId(),
      kind: 'correction',
      sessionId: input.sessionId,
      participantId: input.participantId,
      correctsRecordId: input.correctsRecordId,
      outcome: input.outcome,
      note: input.note,
      atIso: new Date().toISOString(),
    })
  }

  subscribeTrial(trialId: TrialId, handler: (e: TrialEvent) => void): Unsubscribe {
    const live = this.live
    if (!live || live.trialId !== trialId) return () => {}
    live.handlers.add(handler)
    return () => {
      live.handlers.delete(handler)
    }
  }

  /** Reset a void so the facilitator can restart from the cue. */
  discardLive() {
    this.clearLive()
    this.setTracking('idle')
  }

  private clearTimers(live: LiveTrial) {
    for (const t of live.timers) window.clearTimeout(t)
    live.timers = []
  }

  private clearLive() {
    if (this.live) this.clearTimers(this.live)
    this.live = null
  }
}
