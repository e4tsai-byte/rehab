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

  /* Split into two halves of equal length rather than letting a multi-column
     flow decide. Column-major: the left half is the first six in call order,
     the right the next six. Each half is its own grid with IDENTICAL explicit
     tracks, so a status chip lands at the same offset in both. */
  const half = Math.ceil(rows.length / 2)
  const halves = [rows.slice(0, half), rows.slice(half)]

  return (
    <div className="roster">
      {/* The title and the phase chip live in the app header, which is the
          single place that answers "where am I". */}
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
        <div className="roster__cols">
          {halves.map((group, gi) => (
            <ul className="rgrid" key={gi}>
              {group.map(({ participant, trial }) => {
                const display = trial ? outcomeDisplay(trial.outcome) : awaitingDisplay
                return (
                  /* Every row emits the SAME FIVE CELLS in the same order, and
                     the modifier cell is rendered even when empty. That is what
                     keeps 吳媽's 已更正 from pushing her status and action out of
                     the column everyone else is aligned to. */
                  <li className="rgrid__row" key={participant.id}>
                    <span className="rgrid__id">{participant.id}</span>
                    <span className="rgrid__label">{participant.label}</span>
                    <span className="rgrid__state">
                      <StateChip display={display} size="row" />
                    </span>
                    <span className="rgrid__mod">
                      {trial && trial.correctionCount > 0 ? strings.status.corrected : ''}
                    </span>
                    <span className="rgrid__action">
                      {trial ? (
                        <RailButton
                          variant="quiet"
                          icon="record"
                          ariaLabel={strings.roster.reviewFor(participant.label)}
                          onClick={() => onReview(participant, trial)}
                        >
                          {strings.roster.review}
                        </RailButton>
                      ) : (
                        <RailButton
                          icon="start"
                          ariaLabel={strings.roster.startFor(participant.label)}
                          onClick={() => onStart(participant)}
                        >
                          {strings.roster.start}
                        </RailButton>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          ))}
        </div>
      )}
    </div>
  )
}
