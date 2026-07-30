/* ─────────────────────────────────────────────────────────────────────────────
   Reading an append-only log.

   Records are never mutated. A correction is a new record pointing at an older
   one, so the "current" outcome for a participant is the tip of a chain. Every
   read goes through here so no surface accidentally reads a superseded record.
   ───────────────────────────────────────────────────────────────────────────── */

import {
  type AnyRecord,
  type Outcome,
  type ParticipantId,
  type RecordId,
  type TrialRecord,
  isAssessed,
} from './types'

export interface ResolvedTrial {
  /** The original trial record. Kept so the UI can show what was first recorded. */
  readonly original: TrialRecord
  /** Outcome after applying the correction chain. Equals `original.outcome` if none. */
  readonly outcome: Outcome
  /** Number of corrections applied. > 0 means the row shows a corrected marker. */
  readonly correctionCount: number
  readonly latestRecordId: RecordId
}

/**
 * Resolve every trial in a session to its current outcome.
 *
 * Correction chains are followed transitively: a correction of a correction is
 * legal, since forbidding it would push a facilitator toward editing.
 */
export function resolveTrials(records: readonly AnyRecord[]): ResolvedTrial[] {
  const trials = records.filter((r): r is TrialRecord => r.kind === 'trial')

  // correctsRecordId -> correction, keyed so we can walk a chain forward.
  const byCorrects = new Map<RecordId, Extract<AnyRecord, { kind: 'correction' }>>()
  for (const r of records) {
    if (r.kind === 'correction') byCorrects.set(r.correctsRecordId, r)
  }

  return trials.map((original) => {
    let outcome = original.outcome
    let latestRecordId = original.recordId
    let correctionCount = 0
    const seen = new Set<RecordId>([original.recordId])

    let next = byCorrects.get(original.recordId)
    while (next && !seen.has(next.recordId)) {
      seen.add(next.recordId)
      outcome = next.outcome
      latestRecordId = next.recordId
      correctionCount += 1
      next = byCorrects.get(next.recordId)
    }

    return { original, outcome, correctionCount, latestRecordId }
  })
}

/**
 * The trial that represents a participant in this session.
 *
 * A participant may have several trials: a void, a restart, an abort, then a
 * real one. The representative trial is the LAST assessed one, because that is
 * what the facilitator most recently stood there and did. Voids and aborts are
 * kept in the log for the field metric but never represent a participant.
 */
export function currentTrialFor(
  resolved: readonly ResolvedTrial[],
  participantId: ParticipantId,
): ResolvedTrial | null {
  const mine = resolved.filter((t) => t.original.participantId === participantId)
  const assessed = mine.filter((t) => isAssessed(t.outcome))
  const pick = assessed.length > 0 ? assessed[assessed.length - 1] : null
  return pick ?? null
}

/** All attempts for a participant, in log order. Used by the correction flow. */
export function attemptsFor(
  resolved: readonly ResolvedTrial[],
  participantId: ParticipantId,
): ResolvedTrial[] {
  return resolved.filter((t) => t.original.participantId === participantId)
}

/**
 * Void-and-restart rate. A named October acceptance metric, so it is computed
 * from the log rather than tallied ad hoc.
 */
export function voidRate(resolved: readonly ResolvedTrial[]): { voids: number; trials: number; rate: number } {
  const voids = resolved.filter((t) => t.outcome.kind === 'void').length
  const trials = resolved.length
  return { voids, trials, rate: trials === 0 ? 0 : voids / trials }
}
