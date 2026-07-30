/* ─────────────────────────────────────────────────────────────────────────────
   Logo PLACEHOLDER. Deliberately provisional, and it should look it.

   There is no brand for this product yet and inventing one here would be a
   claim the project cannot back. So the slot is filled with something that
   reads unmistakably as a placeholder rather than as a weak logo:

     - the mark sits in a DASHED outline, the universal convention for
       "artwork goes here"
     - it carries a 暫定 (provisional) label beside the wordmark
     - the mark is an abstract seat-and-rise diagram, not a crafted symbol

   Whoever designs the real identity replaces this file. Nothing else should
   need to change: it is one component, in one slot, at one size.
   ───────────────────────────────────────────────────────────────────────────── */

import { strings } from '../i18n/strings'

export function Logo() {
  return (
    <span className="logo" aria-label={strings.app.name}>
      <span className="logo__slot">
        <svg viewBox="0 0 24 24" className="logo__mark" aria-hidden="true" focusable="false">
          {/* Seat line, and a rising stroke off it. The literal movement the
              instrument measures, drawn as plainly as possible. */}
          <path
            d="M5 17h8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9 17V9l6-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="logo__text">
        <span className="logo__word">{strings.app.name}</span>
        <span className="logo__provisional">{strings.app.logoProvisional}</span>
      </span>
    </span>
  )
}
