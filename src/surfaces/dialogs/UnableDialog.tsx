/* Record that the protocol cannot be performed at all (walker, wheelchair).

   The copy states plainly that this is a valid result and that the participant
   stays on the roster and still counts toward attendance. That is not
   reassurance for its own sake: excluding people from the class would push
   average attendance toward the fewer-than-ten cliff that voids the site's
   entire NT$36,000 期, which is the outcome constraint 6 exists to prevent. */

import { RailButton } from '../../components/RailButton'
import { strings } from '../../i18n/strings'
import { Dialog } from './Dialog'

export function UnableDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onCancel={onCancel} labelledBy="unable-title">
      <h2 className="dlg__title" id="unable-title">
        {strings.unable.title}
      </h2>
      <p className="dlg__body">{strings.unable.body}</p>
      <div className="dlg__actions">
        <RailButton variant="quiet" onClick={onCancel}>
          {strings.unable.cancel}
        </RailButton>
        <RailButton onClick={onConfirm}>{strings.unable.confirm}</RailButton>
      </div>
    </Dialog>
  )
}
