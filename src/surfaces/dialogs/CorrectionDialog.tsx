/* ─────────────────────────────────────────────────────────────────────────────
   Correction. Appends a record; never edits one.

   PRODUCT.md principle 5: a facilitator who cannot fix the machine will either
   stop using it or start gaming it, so correcting must feel ordinary. The copy
   says the original is kept and that this is normal operation. No warning tone,
   no confirmation-of-destruction language, because nothing is destroyed.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { RailButton } from '../../components/RailButton'
import {
  PRESCRIBED_REPS,
  type CorrectionNote,
  type Outcome,
} from '../../domain/types'
import { strings } from '../../i18n/strings'
import { Dialog } from './Dialog'

const NOTES: readonly CorrectionNote[] = [
  'rep_miscount',
  'hand_contact_missed',
  'wrong_participant',
  'other',
]

/** Rebuild an outcome at a corrected rep count, preserving the recorded times. */
function withReps(original: Outcome, reps: number): Outcome {
  const times =
    original.kind === 'complete' || original.kind === 'incomplete' || original.kind === 'hand_contact'
      ? original.repTimesMs
      : []
  const kept = times.slice(0, reps)
  const elapsed = kept.reduce((a, b) => a + b, 0)

  if (original.kind === 'hand_contact') {
    return {
      kind: 'hand_contact',
      repsCompleted: reps,
      repTimesMs: kept,
      elapsedMs: elapsed,
      firstContactRep: Math.min(original.firstContactRep, Math.max(reps, 1)),
      protocolInvalid: true,
    }
  }
  if (reps >= PRESCRIBED_REPS) {
    return { kind: 'complete', repsCompleted: 5, repTimesMs: kept, totalMs: elapsed }
  }
  return { kind: 'incomplete', repsCompleted: reps, repTimesMs: kept, elapsedMs: elapsed }
}

export function CorrectionDialog({
  open,
  original,
  onCancel,
  onConfirm,
}: {
  open: boolean
  original: Outcome
  onCancel: () => void
  onConfirm: (outcome: Outcome, note: CorrectionNote) => void
}) {
  const initialReps =
    original.kind === 'complete' ||
    original.kind === 'incomplete' ||
    original.kind === 'hand_contact'
      ? original.repsCompleted
      : 0

  const [reps, setReps] = useState(initialReps)
  const [note, setNote] = useState<CorrectionNote>('rep_miscount')

  useEffect(() => {
    if (open) setReps(initialReps)
  }, [open, initialReps])

  const maxReps =
    original.kind === 'complete' ||
    original.kind === 'incomplete' ||
    original.kind === 'hand_contact'
      ? Math.max(original.repTimesMs.length, PRESCRIBED_REPS)
      : PRESCRIBED_REPS

  return (
    <Dialog open={open} onCancel={onCancel} labelledBy="correct-title">
      <h2 className="dlg__title" id="correct-title">
        {strings.correction.title}
      </h2>
      <p className="dlg__body">{strings.correction.body}</p>

      <div className="dlg__group">
        <span className="dlg__legend">{strings.correction.repsLabel}</span>
        <div className="stepper">
          <RailButton onClick={() => setReps((n) => Math.max(0, n - 1))} disabled={reps <= 0}>
            −
          </RailButton>
          <span className="stepper__value" aria-live="polite">
            {reps}
          </span>
          <RailButton
            onClick={() => setReps((n) => Math.min(maxReps, n + 1))}
            disabled={reps >= maxReps}
          >
            ＋
          </RailButton>
        </div>
      </div>

      <div className="dlg__group">
        <span className="dlg__legend">{strings.correction.noteLabel}</span>
        {NOTES.map((n) => (
          <label key={n} className="opt">
            <input
              type="radio"
              name="correction-note"
              value={n}
              checked={note === n}
              onChange={() => setNote(n)}
            />
            <span className="opt__text">{strings.correction.notes[n]}</span>
          </label>
        ))}
      </div>

      <div className="dlg__actions">
        <RailButton variant="quiet" onClick={onCancel}>
          {strings.correction.cancel}
        </RailButton>
        <RailButton variant="primary" onClick={() => onConfirm(withReps(original, reps), note)}>
          {strings.correction.submit}
        </RailButton>
      </div>

      <p className="dlg__note">{strings.correction.appendNote}</p>
    </Dialog>
  )
}
