/* ─────────────────────────────────────────────────────────────────────────────
   Per-rep split times WITHIN ONE TRIAL.

   WHAT THIS IS NOT, and must never become:

   - **Not a longitudinal trend chart.** The design doc's "Explicitly NOT
     building" list names those. The x axis here is rep 1..5 inside a single
     30-second measurement; it is never 期 over 期, never a date axis, never two
     trials on one plot. Within-trial detail is a different object from a trend.
   - **Not a determination.** No 14-second threshold line, no target band, no
     pass/fail colouring, no percentile against published norms, no reference
     range of any kind. A norm line would be exactly the clinical output
     invariant 3 exists to keep this product away from. The bars report measured
     durations; a qualified human reads them.

   FORM (per the dataviz method): the job is "compare magnitude, low to high"
   across five ordered items, one series. That is a column chart with a
   SEQUENTIAL single hue — not categorical, because the reps are one series and
   not five identities that need telling apart. One series needs no legend; the
   title names it. Values are direct-labelled, so the chart never depends on an
   axis a reader has to trace back.

   Marks follow the spec: bars capped in thickness rather than filling their
   slot, 4px rounded data-end with a square baseline, a surface-coloured gap
   between neighbours, and recessive axis furniture.
   ───────────────────────────────────────────────────────────────────────────── */

import { Digits } from './Digits'
import { formatSeconds } from '../domain/types'
import { strings } from '../i18n/strings'

export function RepSplits({
  repTimesMs,
  phaseWord,
}: {
  repTimesMs: readonly number[]
  /** Qualifies the caption. Both phase blocks render this component, and an
      unqualified caption gave a screen reader two identical tables. */
  phaseWord: string
}) {
  if (repTimesMs.length === 0) return null

  const max = Math.max(...repTimesMs)

  return (
    <figure className="splits">
      <figcaption className="splits__head">
        <span className="splits__title">
          {strings.detail.splitsTitle}
          <span className="sr-only">（{phaseWord}）</span>
        </span>
        <span className="splits__hint">{strings.detail.splitsHint}</span>
      </figcaption>

      <div className="splits__plot">
        {repTimesMs.map((ms, i) => (
          <div key={i} className="split">
            <span className="split__n">{strings.detail.splitOf(i + 1)}</span>
            <div className="split__track">
              {/* Width against the trial's own longest rep, so the comparison is
                  strictly internal to this measurement. There is no external
                  scale, and adding one would import a norm. */}
              <div
                className="split__bar"
                style={{ width: `${(ms / max) * 100}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="split__t">
              <Digits value={formatSeconds(ms)} /> {strings.result.seconds}
            </span>
          </div>
        ))}
      </div>

      {/* The same numbers as text, for a screen reader and for anyone who wants
          the values rather than the shape. */}
      <table className="sr-only">
        <caption>
          {strings.detail.splitsTitle}（{phaseWord}）
        </caption>
        <tbody>
          {repTimesMs.map((ms, i) => (
            <tr key={i}>
              <th scope="row">{strings.detail.splitOf(i + 1)}</th>
              <td>
                {formatSeconds(ms)} {strings.result.seconds}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
