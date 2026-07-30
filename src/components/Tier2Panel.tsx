/* ─────────────────────────────────────────────────────────────────────────────
   Tier 2 roadmap. A STATEMENT OF INTENT, NEVER A PREVIEW OF DATA.

   This panel is the only place in the product allowed to say the words peak
   velocity, mean velocity and velocity loss — and it may say them only as
   PLANNED outputs of work that does not exist.

   HARD RULES, and the panel is built so breaking one is conspicuous:

   - **No numbers. No mock values. No placeholder chart.** Not a greyed-out
     figure, not a "—", not a dimmed sparkline, not lorem data. There is no pose
     estimation in this build, so any velocity figure on this screen would be
     fabricated, and a fabricated number beside real measured times is worse
     than no number at all. This component renders a list of NAMES and prose.
   - **Visually subordinate and materially different.** Its own ground, a dashed
     border, and no numerals anywhere, so it cannot be mistaken at a glance for
     the measured blocks above it.
   - **The gate is stated with its actual criteria**, including that an
     indeterminate result counts as failure. A pre-registration with a silent
     middle is not a pre-registration, and a roadmap that omits its own failure
     conditions is marketing.

   If a value ever needs to appear here, that means Tier 2 shipped — at which
   point it belongs in a measured block above, not in a roadmap panel.
   ───────────────────────────────────────────────────────────────────────────── */

import { strings } from '../i18n/strings'

export function Tier2Panel() {
  return (
    <section className="t2" aria-labelledby="t2-title">
      <header className="t2__head">
        <h3 className="t2__title" id="t2-title">
          {strings.tier2.title}
        </h3>
        <span className="t2__status">{strings.tier2.status}</span>
      </header>

      <p className="t2__body">{strings.tier2.body}</p>

      <div className="t2__group">
        <h4 className="t2__sub">{strings.tier2.plannedTitle}</h4>
        {/* Names only. If this list ever grows a value column, the rule above
            has been broken. */}
        <ul className="t2__list">
          {strings.tier2.planned.map((item) => (
            <li key={item} className="t2__item">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="t2__group">
        <h4 className="t2__sub">{strings.tier2.gateTitle}</h4>
        <p className="t2__body">{strings.tier2.gate}</p>
        <ul className="t2__criteria">
          <li>{strings.tier2.survives}</li>
          <li>{strings.tier2.fails}</li>
          <li>{strings.tier2.indeterminate}</li>
        </ul>
        <p className="t2__body">{strings.tier2.fallback}</p>
      </div>
    </section>
  )
}
