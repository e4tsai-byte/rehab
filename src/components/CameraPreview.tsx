/* ─────────────────────────────────────────────────────────────────────────────
   Framing preview panel. Facilitator zone, cue stage only.

   Renders a <video> bound to a MediaStream and nothing else — see
   useCameraPreview.ts for the invariant 1 boundary this component sits behind.
   There is no canvas here and no code path that reads a frame.

   OPT-IN. Mounting this component does not request the camera; only the button
   does. A judge opening the demo URL sees an off panel and an explanation, never
   an unprompted permission dialog.

   Every unavailable path — denied, no camera, insecure origin, no support — is
   rendered as ordinary text at the same weight as the idle copy. None of them is
   an error state, because none of them stops the fixture demo working.
   ───────────────────────────────────────────────────────────────────────────── */

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

export function CameraPreview({
  status,
  attach,
  onStart,
  onStop,
}: {
  status: CameraStatus
  attach: (el: HTMLVideoElement | null) => void
  onStart: () => void
  onStop: () => void
}) {
  const live = status === 'live'

  return (
    <section className="cam no-print" aria-label={strings.camera.title}>
      <div className="cam__stage">
        {live ? (
          <>
            <video
              ref={attach}
              className="cam__video"
              muted
              playsInline
              /* Preview only: no controls, so there is no UI affordance that
                 could capture, download or record the stream. */
            />
            {/* Borders over the video, not a drawn overlay. Marks roughly where
                a seated participant should sit in frame. */}
            <div className="cam__guide" aria-hidden="true" />
          </>
        ) : (
          <p className="cam__fallback">{explain(status)}</p>
        )}
      </div>

      <div className="cam__side">
        {/* Deliberately not an <h2>. The trial screen has no <h1> — it is a
            kiosk readout, not a document — so a heading here would skip a level.
            The <section aria-label> above already names this region. */}
        <p className="cam__title">{strings.camera.title}</p>
        {/* When live, the stage shows the image and this carries the privacy
            statement; when off, the stage carries the explanation and this
            would repeat it. */}
        <p className="cam__note">{live ? strings.camera.privacy : strings.camera.idle}</p>

        <div className="cam__actions">
          {live ? (
            <RailButton variant="quiet" onClick={onStop}>
              {strings.camera.disable}
            </RailButton>
          ) : (
            <RailButton
              onClick={onStart}
              disabled={status === 'starting' || TERMINAL.includes(status)}
            >
              {strings.camera.enable}
            </RailButton>
          )}
        </div>
      </div>
    </section>
  )
}
