/* Discard this trial with a reason code. Distinct from 結束 (end and record),
   which produces a valid `incomplete` outcome. Abort means "this attempt should
   not count", not "the participant failed". */

import { useState } from 'react'
import { RailButton } from '../../components/RailButton'
import type { AbortReason } from '../../domain/types'
import { strings } from '../../i18n/strings'
import { Dialog } from './Dialog'

const REASONS: readonly AbortReason[] = [
  'interruption',
  'wrong_participant',
  'participant_declined',
  'equipment',
  'other',
]

export function AbortDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: (r: AbortReason) => void
}) {
  const [reason, setReason] = useState<AbortReason>('interruption')

  return (
    <Dialog open={open} onCancel={onCancel} labelledBy="abort-title">
      <h2 className="dlg__title" id="abort-title">
        {strings.abort.title}
      </h2>
      <p className="dlg__body">{strings.abort.body}</p>

      <div className="dlg__group">
        <span className="dlg__legend">{strings.correction.noteLabel}</span>
        {REASONS.map((r) => (
          <label key={r} className="opt">
            <input
              type="radio"
              name="abort-reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
            />
            <span className="opt__text">{strings.abort.reasons[r]}</span>
          </label>
        ))}
      </div>

      <div className="dlg__actions">
        <RailButton variant="quiet" onClick={onCancel}>
          {strings.abort.cancel}
        </RailButton>
        <RailButton onClick={() => onConfirm(reason)}>{strings.abort.confirm}</RailButton>
      </div>
    </Dialog>
  )
}
