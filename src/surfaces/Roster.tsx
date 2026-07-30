/* ─────────────────────────────────────────────────────────────────────────────
   Roster — the working screen. This is where the facilitator lives.

   Carries NO TIMES, deliberately. Ten older adults listed with their times in a
   small shared room is a leaderboard; the design doc names that as the most
   likely route to facilitator veto and a real dignity harm. Status only. Numbers
   live on the result surface (one participant at a time) and on the sheet (read
   alone by the site lead).
   ───────────────────────────────────────────────────────────────────────────── */

import { RailButton } from '../components/RailButton'
import { StateChip } from '../components/StateChip'
import { awaitingDisplay, outcomeDisplay } from '../domain/display'
import { currentTrialFor, type ResolvedTrial } from '../domain/records'
import type { Block, Participant } from '../domain/types'
import { strings } from '../i18n/strings'

export function Roster({
  block,
  resolved,
  onStart,
  onReview,
}: {
  block: Block
  resolved: readonly ResolvedTrial[]
  onStart: (p: Participant) => void
  onReview: (p: Participant, trial: ResolvedTrial) => void
}) {
  const rows = block.participants.map((p) => ({
    participant: p,
    trial: currentTrialFor(resolved, p.id),
  }))

  const doneCount = rows.filter((r) => r.trial !== null).length

  return (
    <div className="roster">
      {/* The title and the phase chip moved to the app header, which is now the
          single place that answers "where am I". Repeating them here would be a
          second answer to the same question, and it cost the list a row. */}
      <div className="roster__meta">
        <span>{block.siteName}</span>
        <span>{block.blockName}</span>
        <span>{strings.roster.progress(doneCount, block.participants.length)}</span>
        <span>{strings.roster.attendanceNote(block.participants.length)}</span>
      </div>

      {rows.length === 0 ? (
        <div className="cue">
          <p className="cue__title">{strings.roster.emptyTitle}</p>
          <p className="cue__hint">{strings.roster.emptyBody}</p>
        </div>
      ) : (
        <ul className="roster__list">
          {rows.map(({ participant, trial }) => {
            const display = trial ? outcomeDisplay(trial.outcome) : awaitingDisplay
            return (
              // Only outstanding rows carry a container: a measured row needs
              // nothing done to it, so it is plain on the field.
              <li key={participant.id} className={trial ? 'row' : 'row row--todo'}>
                <span className="row__id">{participant.id}</span>
                <span className="row__label">{participant.label}</span>
                <span className="row__state">
                  <StateChip display={display} size="row" />
                </span>
                {trial && trial.correctionCount > 0 && (
                  <span className="row__corrected">{strings.status.corrected}</span>
                )}
                <span className="row__action">
                  {trial ? (
                    <RailButton
                      variant="quiet"
                      icon="record"
                      onClick={() => onReview(participant, trial)}
                    >
                      {strings.roster.review}
                    </RailButton>
                  ) : (
                    <RailButton icon="start" onClick={() => onStart(participant)}>
                      {strings.roster.start}
                    </RailButton>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
