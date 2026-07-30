/* ─────────────────────────────────────────────────────────────────────────────
   Participant self-view. The <video> the participant sees themselves in.

   MIRRORED. `transform: scaleX(-1)`. A self-view is the one case where the
   mirrored image is the correct one: the participant is using it to adjust their
   own position, and in an unmirrored feed leaning left moves your image right,
   which is disorienting for anyone and worse for an 80-year-old already
   concentrating on standing up. This is the opposite of the facilitator framing
   panel's requirement, which is why that one is deliberately NOT mirrored.

   TWO SIZES, AND THE SMALL ONE IS A BUDGET, NOT A STYLE:

     `frame` — before the cue, while positioning. Large. There is no number on
               screen yet, so nothing to compete with.
     `pip`   — during the timed trial. Small, cornered, and deliberately
               subordinate to the rep count. See DESIGN.md for the area budget
               and for the honest limitation: area is not the same as salience,
               because moving images attract gaze pre-attentively in a way a
               static numeral does not.

   STILL PREVIEW ONLY. This element renders a MediaStream. There is no canvas, no
   readback, no pose estimation, no landmark extraction, no retention. See
   useCameraPreview.ts for the full boundary.
   ───────────────────────────────────────────────────────────────────────────── */

import { strings } from '../i18n/strings'

export function CameraSelfView({
  attach,
  size,
}: {
  attach: (el: HTMLVideoElement | null) => void
  size: 'frame' | 'pip'
}) {
  return (
    <div className={`selfview selfview--${size}`}>
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
      {size === 'frame' && <span className="selfview__guide" aria-hidden="true" />}
    </div>
  )
}
