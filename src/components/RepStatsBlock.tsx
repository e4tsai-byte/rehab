/* ─────────────────────────────────────────────────────────────────────────────
   Derived statistics for one trial, and the pre/post split overlay.

   Everything here is arithmetic on recorded times — see `domain/stats.ts` for
   what is deliberately absent and why. No velocity, no movement trace, no
   threshold, no band, no norm.

   THE OVERLAY IS NOT A TREND CHART. Two assessment points is what a 期 has, and
   they are drawn as two BLOCKS per rep — 前測 above, 後測 below, sharing one
   scale — rather than as a line across a time axis. There is no date axis and
   no third point could be added without changing the form, which is the
   property that keeps it inside the no-trend rule.

   FORM (dataviz): before/after per item is the dumbbell/grouped-bar case, so it
   is one hue in two shades rather than two categorical hues. Two series means a
   legend is required, and each bar is additionally prefixed with its series
   word, so identity never rests on colour alone. Values are direct-labelled.

   SCALE: the maximum across BOTH trials. A shared axis is what makes the two
   comparable, and it stays strictly internal to this participant's own two
   measurements — no external scale, so no norm is imported.
   ───────────────────────────────────────────────────────────────────────────── */

import { Digits } from './Digits'
import { repStats, sharedScaleMs } from '../domain/stats'
import { formatSeconds } from '../domain/types'
import { strings } from '../i18n/strings'

function secs(ms: number): string {
  return formatSeconds(Math.abs(ms))
}

export function RepStatsBlock({ repTimesMs }: { repTimesMs: readonly number[] }) {
  const st = repStats(repTimesMs)
  if (!st) return null

  const slowdown =
    st.slowdownMs > 0
      ? strings.detail.slowdownSlower(secs(st.slowdownMs))
      : st.slowdownMs < 0
        ? strings.detail.slowdownFaster(secs(st.slowdownMs))
        : strings.detail.slowdownSame

  return (
    <section className="stats">
      <h3 className="stats__title">{strings.detail.statsTitle}</h3>
      <p className="stats__hint">{strings.detail.statsHint}</p>

      <dl className="stats__grid">
        {/* The fatigue signal, in the time domain. Stated as arithmetic. */}
        <div className="stat stat--lead">
          <dt className="stat__label">{strings.detail.slowdownLabel}</dt>
          <dd className="stat__value">{slowdown}</dd>
        </div>
        <div className="stat">
          <dt className="stat__label">{strings.detail.meanLabel}</dt>
          <dd className="stat__value">
            <Digits value={formatSeconds(st.meanMs)} /> {strings.result.seconds}
          </dd>
        </div>
        <div className="stat">
          <dt className="stat__label">{strings.detail.fastestLabel}</dt>
          <dd className="stat__value">
            <Digits value={formatSeconds(st.fastestMs)} /> {strings.result.seconds}
            <span className="stat__note">{strings.detail.repNo(st.fastestRep)}</span>
          </dd>
        </div>
        <div className="stat">
          <dt className="stat__label">{strings.detail.slowestLabel}</dt>
          <dd className="stat__value">
            <Digits value={formatSeconds(st.slowestMs)} /> {strings.result.seconds}
            <span className="stat__note">{strings.detail.repNo(st.slowestRep)}</span>
          </dd>
        </div>
        <div className="stat">
          <dt className="stat__label">{strings.detail.spreadLabel}</dt>
          <dd className="stat__value">
            <Digits value={formatSeconds(st.spreadMs)} /> {strings.result.seconds}
          </dd>
        </div>
      </dl>
    </section>
  )
}

export function SplitOverlay({
  preMs,
  postMs,
}: {
  preMs: readonly number[]
  postMs: readonly number[]
}) {
  const both = preMs.length > 0 && postMs.length > 0
  const scale = sharedScaleMs(preMs, postMs)
  const rows = Math.max(preMs.length, postMs.length)

  return (
    <section className="ovl">
      <h3 className="ovl__title">{strings.detail.overlayTitle}</h3>
      <p className="ovl__hint">{strings.detail.overlayHint}</p>

      {!both ? (
        <p className="ovl__none">{strings.detail.overlayNeedsBoth}</p>
      ) : (
        <>
          {/* Two series, so a legend is required. It carries the shade AND the
              word, so identity never rests on colour alone. */}
          <ul className="ovl__key">
            <li className="ovl__key-item">
              <span className="ovl__swatch ovl__swatch--pre" aria-hidden="true" />
              {strings.phase.pre}
            </li>
            <li className="ovl__key-item">
              <span className="ovl__swatch ovl__swatch--post" aria-hidden="true" />
              {strings.phase.post}
            </li>
          </ul>

          <div className="ovl__plot">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="ovlrep">
                <span className="ovlrep__n">{strings.detail.splitOf(i + 1)}</span>
                <div className="ovlrep__bars">
                  {(
                    [
                      ['pre', preMs[i], strings.phase.pre],
                      ['post', postMs[i], strings.phase.post],
                    ] as const
                  ).map(([kind, ms, word]) => (
                    <div key={kind} className="ovlbar">
                      <span className="ovlbar__word">{word}</span>
                      <div className="ovlbar__track">
                        {ms !== undefined && (
                          <div
                            className={`ovlbar__fill ovlbar__fill--${kind}`}
                            style={{ width: `${(ms / scale) * 100}%` }}
                          />
                        )}
                      </div>
                      <span className="ovlbar__t">
                        {ms === undefined ? (
                          '—'
                        ) : (
                          <>
                            <Digits value={formatSeconds(ms)} /> {strings.result.seconds}
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* The same numbers as text, for a screen reader and for anyone who
              wants the values rather than the shape. */}
          <table className="sr-only">
            <caption>{strings.detail.overlayTitle}</caption>
            <thead>
              <tr>
                <th />
                <th>{strings.phase.pre}</th>
                <th>{strings.phase.post}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, i) => (
                <tr key={i}>
                  <th scope="row">{strings.detail.splitOf(i + 1)}</th>
                  <td>{preMs[i] === undefined ? '—' : formatSeconds(preMs[i]!)}</td>
                  <td>{postMs[i] === undefined ? '—' : formatSeconds(postMs[i]!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
