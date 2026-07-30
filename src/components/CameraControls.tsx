/* ─────────────────────────────────────────────────────────────────────────────
   Camera controls — the FACILITATOR half of the framing preview.

   The image itself now lives in the participant field (`CameraSelfView`),
   because the participant is the one who needs to see it. What stays here is
   everything the facilitator operates: the opt-in button, the privacy statement,
   and the unavailable-path explanations.

   ONE VIDEO ELEMENT, AND IT IS MIRRORED. An earlier revision had a second,
   unmirrored feed here for framing, on the argument that a mirrored image makes
   "move them left" mean the wrong thing. That argument loses to the
   participant's: they are adjusting their own body against the image, and a
   reversed self-view is disorienting. The facilitator is standing beside the
   person and can see them directly; from the screen they only need "is the whole
   person inside the box", which mirroring does not affect.

   OPT-IN. Rendering this component requests nothing; only the button does. A
   judge opening the demo URL is never hit with an unasked permission dialog.

   Every unavailable path — denied, no camera, insecure origin, no support — is
   ordinary text at the same weight as the idle copy. None of them is an error,
   because none of them stops the fixture demo working.
   ───────────────────────────────────────────────────────────────────────────── */

import { Icon } from './Icon'
import { RailButton } from './RailButton'
import type { CameraStatus } from '../hooks/useCameraPreview'
import { strings } from '../i18n/strings'

/** Statuses where retrying is pointless: the capability is absent, not refused. */
const TERMINAL: readonly CameraStatus[] = ['insecure', 'unsupported', 'notfound']

function explain(status: CameraStatus): string {
  switch (status) {
    case 'off':
      return strings.camera.idle
    case 'starting':
      return strings.camera.starting
    case 'live':
      return strings.camera.privacy
    case 'denied':
      return strings.camera.denied
    case 'notfound':
      return strings.camera.notfound
    case 'insecure':
      return strings.camera.insecure
    case 'unsupported':
      return strings.camera.unsupported
    case 'error':
      return strings.camera.error
  }
}

export function CameraControls({
  status,
  onStart,
  onStop,
}: {
  status: CameraStatus
  onStart: () => void
  onStop: () => void
}) {
  const live = status === 'live'

  return (
    <section className="camctl no-print" aria-label={strings.camera.title}>
      <div className="camctl__text">
        <p className="camctl__title">
          <Icon kind={live ? 'camera' : 'camera-off'} />
          <span>{strings.camera.title}</span>
        </p>
        {/* The privacy statement sits with the control that turns the camera on,
            not in a settings page a facilitator will never open. */}
        <p className="camctl__note">{explain(status)}</p>
      </div>

      <div className="camctl__actions">
        {live ? (
          <RailButton variant="quiet" icon="camera-off" onClick={onStop}>
            {strings.camera.disable}
          </RailButton>
        ) : (
          <RailButton
            icon="camera"
            onClick={onStart}
            disabled={status === 'starting' || TERMINAL.includes(status)}
          >
            {strings.camera.enable}
          </RailButton>
        )}
      </div>
    </section>
  )
}
