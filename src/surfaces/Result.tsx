/* ─────────────────────────────────────────────────────────────────────────────
   Result — one participant, immediately after their trial.

   This is where the number finally appears. Showing someone their own time is
   fine and arguably owed to them; the dignity constraint is about COMPARISON,
   which is why the roster carries no times and there is no leaderboard anywhere.

   INVARIANT 3 (amended): this surface reports a measured time. It does not apply
   the 14-second threshold, does not grade, and renders no verdict. If a
   `passed`/`failed` badge ever appears here, the product has crossed the line it
   exists to stay behind.
   ───────────────────────────────────────────────────────────────────────────── */

import { Digits } from '../components/Digits'
import { RailButton } from '../components/RailButton'
import { StateChip } from '../components/StateChip'
import { outcomeDisplay } from '../domain/display'
import { elapsedMsOf, formatSeconds, repsOf, type Outcome, type Participant } from '../domain/types'
import { strings } from '../i18n/strings'

export function Result({
  participant,
  outcome,
  seatHeightCm,
  onAccept,
  onRedo,
  onCorrect,
}: {
  participant: Participant
  outcome: Outcome
  seatHeightCm: number | null
  onAccept: () => void
  onRedo: () => void
  onCorrect: () => void
}) {
  const ms = elapsedMsOf(outcome)
  const reps = repsOf(outcome)
  const perRep =
    outcome.kind === 'complete' || outcome.kind === 'incomplete' || outcome.kind === 'hand_contact'
      ? outcome.repTimesMs
      : []

  return (
    <div className="zones">
      <div className="field">
        <div className="result">
          <header className="result__head">
            <h1 className="result__title">{strings.result.title}</h1>
            <StateChip display={outcomeDisplay(outcome)} size="row" />
          </header>

          <div className="result__primary">
            {ms === null ? (
              <span className="result__time">{strings.result.noTime}</span>
            ) : (
              <>
                <span className="result__time">
                  <Digits value={formatSeconds(ms)} />
                </span>
                <span className="result__unit">{strings.result.seconds}</span>
              </>
            )}
          </div>

          <div className="result__facts">
            <div className="fact">
              <span className="fact__label">{strings.result.reps}</span>
              <span className="fact__value">
                <Digits value={reps} /> {strings.trial.repsLabel}
              </span>
            </div>
            {seatHeightCm !== null && (
              <div className="fact">
                <span className="fact__label">{strings.result.seatHeight}</span>
                <span className="fact__value">
                  <Digits value={seatHeightCm} /> {strings.result.cm}
                </span>
              </div>
            )}
          </div>

          {perRep.length > 0 && (
            <div className="perrep">
              <span className="perrep__title">{strings.result.perRep}</span>
              <div className="perrep__list">
                {perRep.map((t, i) => (
                  <div key={i} className="perrep__item">
                    <span className="perrep__n">{strings.result.repN(i + 1)}</span>
                    <span className="perrep__t">
                      <Digits value={formatSeconds(t)} /> {strings.result.seconds}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rail">
        <div className="rail__context">
          <span className="rail__context-id">{participant.id}</span>
          <span className="rail__context-label">{participant.label}</span>
        </div>
        <div className="rail__spacer" />
        <div className="rail__actions">
          <RailButton variant="quiet" onClick={onCorrect}>
            {strings.result.correct}
          </RailButton>
          <RailButton onClick={onRedo}>{strings.result.redo}</RailButton>
          <RailButton variant="primary" onClick={onAccept}>
            {strings.result.accept}
          </RailButton>
        </div>
      </div>
    </div>
  )
}
