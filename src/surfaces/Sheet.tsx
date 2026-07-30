/* ─────────────────────────────────────────────────────────────────────────────
   THE SHEET. This is the product.

   PRODUCT.md: "The printed sheet is the product. Not the screen." The 據點負責人
   is rarely present at a session and never sees the UI. This page is their entire
   experience of VeloCare, and it is what they file with a funding report.

   Constraints: A4 portrait, exactly one page, large type, no clipped columns.

   INVARIANT 3 (amended) — the footer is a REGULATORY SURFACE, not boilerplate. The
   sheet reports measured times to a human. It does not apply the 14-second ICOPE
   threshold, does not grade, and states no determination. There is deliberately
   no pass/fail column and no highlighted row.
   ───────────────────────────────────────────────────────────────────────────── */

import { useDataSource } from '../data/context'
import { rocDate, rocToday } from '../domain/dates'
import { awaitingDisplay, outcomeDisplay } from '../domain/display'
import { currentTrialFor, type ResolvedTrial } from '../domain/records'
import {
  elapsedMsOf,
  formatSeconds,
  isAssessed,
  isProtocolValid,
  repsOf,
  type AssessmentSession,
  type Block,
  type SessionId,
} from '../domain/types'
import { strings } from '../i18n/strings'
import { RailButton } from '../components/RailButton'
import { Shape } from '../components/Shape'

export function Sheet({
  block,
  sessions,
  allResolved,
  onClose,
}: {
  block: Block
  sessions: readonly AssessmentSession[]
  allResolved: ReadonlyMap<SessionId, readonly ResolvedTrial[]>
  onClose: () => void
}) {
  const src = useDataSource()
  const pre = sessions.find((s) => s.phase === 'pre') ?? null
  const post = sessions.find((s) => s.phase === 'post') ?? null
  const preTrials = (pre && allResolved.get(pre.sessionId)) ?? []
  const postTrials = (post && allResolved.get(post.sessionId)) ?? []

  const rows = block.participants.map((p) => {
    const a = currentTrialFor(preTrials, p.id)
    const b = currentTrialFor(postTrials, p.id)
    const preMs = a ? elapsedMsOf(a.outcome) : null
    const postMs = b ? elapsedMsOf(b.outcome) : null

    /* A difference is only meaningful when the two trials measured the same
       thing. Comparing a 5-rep time against a 4-rep time produces a large
       apparent improvement for a participant who actually did LESS work, and
       this sheet is filed to justify funding. Both trials must therefore be
       protocol-valid AND over the same number of repetitions; otherwise the
       cell reads 不可比較 and the footer explains why. */
    const comparable =
      a !== null &&
      b !== null &&
      preMs !== null &&
      postMs !== null &&
      isProtocolValid(a.outcome) &&
      isProtocolValid(b.outcome) &&
      repsOf(a.outcome) === repsOf(b.outcome)

    const delta = comparable && preMs !== null && postMs !== null ? (postMs - preMs) / 1000 : null

    return { participant: p, pre: a, post: b, preMs, postMs, delta }
  })

  const assessed = rows.filter((r) => r.post !== null && isAssessed(r.post.outcome)).length
  const valid = rows.filter((r) => r.post !== null && isProtocolValid(r.post.outcome)).length

  return (
    <div className="sheet-screen">
      <div className="sheet-screen__bar no-print">
        <RailButton variant="quiet" onClick={onClose}>
          {strings.sheet.close}
        </RailButton>
        <RailButton variant="primary" onClick={() => window.print()}>
          {strings.sheet.print}
        </RailButton>
      </div>

      <div className="sheet-wrap">
        <article className="sheet">
          <header className="sheet__head">
            <h1 className="sheet__title">{strings.sheet.title}</h1>
            <p className="sheet__subtitle">{strings.sheet.subtitle}</p>
            <div className="sheet__meta">
              <span className="sheet__meta-item">
                <span className="sheet__meta-label">{strings.sheet.site}</span>
                <span className="sheet__meta-value">{block.siteName}</span>
              </span>
              <span className="sheet__meta-item">
                <span className="sheet__meta-label">{strings.sheet.block}</span>
                <span className="sheet__meta-value">{block.blockName}</span>
              </span>
              {pre && (
                <span className="sheet__meta-item">
                  <span className="sheet__meta-label">{strings.phase.pre}</span>
                  <span className="sheet__meta-value">{rocDate(pre.dateIso)}</span>
                </span>
              )}
              {post && (
                <span className="sheet__meta-item">
                  <span className="sheet__meta-label">{strings.phase.post}</span>
                  <span className="sheet__meta-value">{rocDate(post.dateIso)}</span>
                </span>
              )}
              <span className="sheet__meta-item">
                <span className="sheet__meta-label">{strings.sheet.printedOn}</span>
                <span className="sheet__meta-value">{rocToday()}</span>
              </span>
            </div>
          </header>

          <table className="sheet__table">
            <thead>
              <tr>
                <th>{strings.sheet.colId}</th>
                <th>{strings.sheet.colLabel}</th>
                <th className="num">{strings.sheet.colPre}</th>
                <th className="num">{strings.sheet.colPost}</th>
                <th className="num">{strings.sheet.colChange}</th>
                <th>{strings.sheet.colNote}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ participant, post: b, preMs, postMs, delta }) => {
                /* The note describes the POST trial, which is the operative
                   column. Falling back to the pre outcome made a participant
                   with no post trial read as though she had been measured. */
                const note = b ? outcomeDisplay(b.outcome) : awaitingDisplay
                return (
                  <tr key={participant.id}>
                    <td className="sheet__id">{participant.id}</td>
                    <td className="sheet__label">{participant.label}</td>
                    <td className="num">
                      <span className={preMs === null ? 'sheet__num sheet__num--absent' : 'sheet__num'}>
                        {preMs === null ? strings.sheet.notRecorded : formatSeconds(preMs)}
                      </span>
                    </td>
                    <td className="num">
                      <span className={postMs === null ? 'sheet__num sheet__num--absent' : 'sheet__num'}>
                        {postMs === null ? strings.sheet.notRecorded : formatSeconds(postMs)}
                      </span>
                    </td>
                    <td className="num">
                      <span
                        className={delta === null ? 'sheet__num sheet__num--absent' : 'sheet__num'}
                      >
                        {delta === null
                          ? postMs === null || preMs === null
                            ? '—'
                            : strings.sheet.notComparable
                          : `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta).toFixed(1)}`}
                      </span>
                    </td>
                    <td className="sheet__state">
                      {note && (
                        <>
                          <Shape kind={note.shape} className="sheet__shape" />
                          {note.word}
                        </>
                      )}
                      {b && b.correctionCount > 0 && strings.sheet.aside(strings.status.corrected)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="sheet__summary">
            <span className="sheet__summary-item">
              <span>{strings.sheet.summaryAttendance}</span>
              <span className="sheet__summary-value">{block.participants.length}</span>
            </span>
            <span className="sheet__summary-item">
              <span>{strings.sheet.summaryAssessed}</span>
              <span className="sheet__summary-value">{assessed}</span>
            </span>
            <span className="sheet__summary-item">
              <span>{strings.sheet.summaryProtocolValid}</span>
              <span className="sheet__summary-value">{valid}</span>
            </span>
          </div>

          <footer className="sheet__foot">
            <p>{strings.sheet.footerScope}</p>
            <p>{strings.sheet.footerComparable}</p>
            <p>{strings.sheet.footerHandContact}</p>
            <p>{strings.sheet.footerPrivacy}</p>
            {src.isSimulated && (
              <p>
                <strong>{strings.demo.badge}</strong>　{strings.demo.detail}
              </p>
            )}
            <div className="sheet__sign">
              <span className="sheet__sign-field">{strings.sheet.signFacilitator}</span>
              <span className="sheet__sign-field">{strings.sheet.signLead}</span>
            </div>
          </footer>
        </article>
      </div>
    </div>
  )
}
