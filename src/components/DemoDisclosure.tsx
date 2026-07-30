/* ─────────────────────────────────────────────────────────────────────────────
   Persistent honesty marker. Not dismissible.

   This build ships as a public URL for a competition submission, so it must be
   self-evidently a UI prototype with simulated data. It must never imply a
   working measurement system exists.

   FOLDED INTO THE HEADER. It used to be a full-width strip under the header,
   which cost every surface a second band of chrome before any content. The
   badge is now a header control and the full sentence sits behind it in a
   popover.

   THE DISCLOSURE IS NOT WEAKENED BY THAT, and it is worth being precise about
   why, because "we made the disclaimer smaller" is exactly the move this
   comment exists to prevent:

   - The badge itself is ALWAYS visible, on every surface, and cannot be
     dismissed. There is no state in which the product does not say 示範模式.
   - The full sentence is permanently visible, un-collapsed, on the SETUP
     screen — the first surface anyone opening the demo URL lands on.
   - It is also in the printed sheet's footer, which is the artifact that
     actually leaves the building.
   - The popover opens on click or focus, never hover alone, so it is reachable
     by keyboard and touch.

   So the claim is made in full at the entry point and on paper, and marked
   permanently everywhere else.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useId, useRef, useState } from 'react'
import { strings } from '../i18n/strings'

export function DemoBadge({ simulated }: { simulated: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!simulated) return null

  return (
    <div className="demo no-print" ref={ref}>
      <button
        type="button"
        className="demo__badge"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        {strings.demo.badge}
      </button>
      {open && (
        <p className="demo__pop" id={id} role="note">
          {strings.demo.detail}
        </p>
      )}
    </div>
  )
}

/** The full sentence, un-collapsed. Rendered on the setup screen, which is where
    anyone opening the demo URL arrives. */
export function DemoNotice({ simulated }: { simulated: boolean }) {
  if (!simulated) return null
  return (
    <p className="demo-notice no-print" role="note">
      <span className="demo-notice__badge">{strings.demo.badge}</span>
      <span>{strings.demo.detail}</span>
    </p>
  )
}
