/* ─────────────────────────────────────────────────────────────────────────────
   Participant self-view. The <video> the participant sees themselves in.

   MIRRORED. `transform: scaleX(-1)`. A self-view is the one case where the
   mirrored image is the correct one: the participant is using it to adjust their
   own position, and in an unmirrored feed leaning left moves your image right,
   which is disorienting for anyone and worse for an 80-year-old already
   concentrating on standing up.

   It fills its half of the split edge to edge and top to bottom, like the remote
   pane of a video call, with `object-fit: cover`. There is one presentation now
   rather than the earlier frame/pip pair: the layout decides how much room the
   video gets, and the video simply fills what it is given.

   STILL PREVIEW ONLY. This element renders a MediaStream. There is no canvas, no
   readback, no pose estimation, no landmark extraction, no retention. See
   useCameraPreview.ts for the full boundary.
   ───────────────────────────────────────────────────────────────────────────── */

import { strings } from '../i18n/strings'

export function CameraSelfView({
  attach,
  guide = false,
}: {
  attach: (el: HTMLVideoElement | null) => void
  /** Framing rectangle. Shown while positioning, hidden once the trial runs. */
  guide?: boolean
}) {
  return (
    <div className="selfview">
      <video
        ref={attach}
        className="selfview__video"
        muted
        playsInline
        /* No `controls`: a control strip would offer picture-in-picture and
           download affordances, which must not exist on this element. */
        aria-label={strings.camera.selfView}
      />
      {/* CSS-only framing guide, drawn with borders over the video. A canvas
          overlay would mean compositing the frame, which invariant 1 forbids. */}
      {guide && <span className="selfview__guide" aria-hidden="true" />}
    </div>
  )
}
