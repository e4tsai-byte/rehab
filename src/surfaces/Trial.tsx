/* ─────────────────────────────────────────────────────────────────────────────
   Trial — 5x sit-to-stand, arms crossed.

   THE ZONE LAW. The Participant Field above holds exactly one number and one pip
   row while a trial is running. No clock, no per-rep list, no name. The
   Facilitator Rail below holds every control and all machine state, on a
   different surface lightness so it reads as a separate device panel.

   DEVIATION FROM THE ORIGINAL BRIEF, recorded in DESIGN.md: no live timer. The
   participant reads at most four characters at a time and needs reps-remaining;
   the facilitator needs to know tracking is alive so they can catch a void. The
   elapsed time is captured throughout and appears on the result surface and the
   sheet. Nobody acts on it mid-trial.

   The clock starts on the staff press, never on first movement: cue-to-movement
   reaction time in this population is 0.3-1.0 s, larger than the whole October
   error budget and systematic rather than random.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { Digits } from '../components/Digits'
import { RailButton } from '../components/RailButton'
import { RepPips } from '../components/RepPips'
import { StateChip } from '../components/StateChip'
import { useDataSource } from '../data/context'
import type { TrialId } from '../data/SessionDataSource'
import { outcomeDisplay, trackingDisplay } from '../domain/display'
import {
  PRESCRIBED_REPS,
  type AbortReason,
  type AssessmentSession,
  type Outcome,
  type Participant,
} from '../domain/types'
import { useChime } from '../hooks/useChime'
import { useTracking } from '../hooks/useSession'
import { strings } from '../i18n/strings'
import { AbortDialog } from './dialogs/AbortDialog'
import { UnableDialog } from './dialogs/UnableDialog'

type Stage = 'cue' | 'running' | 'void' | 'settled'

export function Trial({
  participant,
  session,
  onSettled,
  onBack,
}: {
  participant: Participant
  session: AssessmentSession
  onSettled: (outcome: Outcome) => void
  onBack: () => void
}) {
  const src = useDataSource()
  const tracking = useTracking()
  const { chime, armAudio } = useChime()

  const [stage, setStage] = useState<Stage>('cue')
  const [reps, setReps] = useState(0)
  const [handContact, setHandContact] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [flash, setFlash] = useState(false)
  const [askAbort, setAskAbort] = useState(false)
  const [askUnable, setAskUnable] = useState(false)
  const trialIdRef = useRef<TrialId | null>(null)

  // Reset when the facilitator moves to a different participant.
  useEffect(() => {
    setStage('cue')
    setReps(0)
    setHandContact(false)
    setOutcome(null)
    trialIdRef.current = null
  }, [participant.id])

  async function begin() {
    armAudio() // the staff press is the gesture the browser requires
    const id = await src.startTrial(session.sessionId, participant.id)
    trialIdRef.current = id
    setReps(0)
    setHandContact(false)
    setOutcome(null)
    setStage('running')
  }

  // Subscribe to the live stream. Identical event shapes to the October pipeline.
  useEffect(() => {
    const id = trialIdRef.current
    if (stage !== 'running' || !id) return

    return src.subscribeTrial(id, (e) => {
      switch (e.type) {
        case 'rep':
          setReps(e.index)
          chime()
          break
        case 'hand_contact':
          // The field does NOT change. Telling a participant mid-effort that
          // they are doing it wrong is distracting and undignified; the
          // facilitator sees the flag and can cue them by voice.
          setHandContact(true)
          break
        case 'void':
          setStage('void')
          setFlash(true)
          window.setTimeout(() => setFlash(false), 400)
          break
        case 'settled':
          setOutcome(e.outcome)
          setStage(e.outcome.kind === 'void' ? 'void' : 'settled')
          break
        case 'tracking':
          break
      }
    })
  }, [stage, src, chime])

  async function endNow() {
    const id = trialIdRef.current
    if (!id) return
    const o = await src.endTrial(id)
    setOutcome(o)
    setStage('settled')
  }

  async function doAbort(reason: AbortReason) {
    const id = trialIdRef.current
    setAskAbort(false)
    if (!id) return
    await src.abortTrial(id, reason)
    onBack()
  }

  async function doUnable() {
    setAskUnable(false)
    await src.markUnable(session.sessionId, participant.id)
    onBack()
  }

  function restart() {
    setStage('cue')
    setReps(0)
    setHandContact(false)
    setOutcome(null)
    trialIdRef.current = null
  }

  const trackChip = trackingDisplay(stage === 'void' ? 'lost' : tracking)

  return (
    <div className="zones">
      {/* ── Participant Field ───────────────────────────────────────────── */}
      <div className="field field--locked">
        {stage === 'cue' && (
          <div className="cue">
            <p className="cue__title">{strings.trial.cue}</p>
            <p className="cue__hint">{strings.trial.cueHint}</p>
          </div>
        )}

        {stage === 'running' && (
          <div className="readout">
            <div className="readout__count">
              <Digits value={strings.trial.repsOf(reps, PRESCRIBED_REPS)} />
            </div>
            <div className="readout__unit">{strings.trial.repsLabel}</div>
            <RepPips done={reps} />
            {/* Announced politely so a screen reader follows without the visual
                field gaining a single extra character. */}
            <p className="sr-only" aria-live="polite">
              {strings.trial.srRepAnnounce(reps, PRESCRIBED_REPS)}
            </p>
          </div>
        )}

        {stage === 'settled' && outcome && (
          /* The participant sees 完成 and their pips. Nothing else.
             The outcome nuance (未完成五次 / 手部支撐) lives in the rail, for the
             facilitator. Putting "you did not complete five" in front of the
             participant at 48px is exactly the harm the tone rule forbids:
             a valid recorded outcome must not read as a failure. */
          <div className="done">
            <p className="done__word">{strings.trial.complete}</p>
            <RepPips done={reps} />
          </div>
        )}

        {stage === 'void' && (
          <div className="void-note">
            <p className="void-note__title">{strings.trial.voidTitle}</p>
            <p className="void-note__body">{strings.trial.voidBody}</p>
          </div>
        )}
      </div>

      {/* ── Facilitator Rail ────────────────────────────────────────────── */}
      <div className={flash ? 'rail rail--flash' : 'rail'}>
        <div className="rail__context">
          <span className="rail__context-id">{participant.id}</span>
          <span className="rail__context-label">{participant.label}</span>
        </div>

        <div className="rail__state">
          <StateChip display={trackChip} />
        </div>

        {/*
          Live camera preview -- facilitator-rail only, never in the locked
          participant field (THE ZONE LAW above still holds: one number, one
          pip row, nothing else competing for the participant's attention).
          Deliberate deviation from README.md's "not built, on purpose: any
          camera or MediaPipe code" -- added on explicit request so people can
          see their own movement. Only rendered against a real backend
          (`!src.isSimulated`); the fixture/demo source has no camera to show.
          URL is the same fixed localhost:8765 the README already documents
          for LocalhostDataSource -- not read from `src` because
          SessionDataSource doesn't expose a base URL, so if that ever
          changes this needs updating too.
        */}
        {!src.isSimulated && (
          <div className="rail__state rail__preview">
            <img
              src="http://127.0.0.1:8765/video"
              alt=""
              className="rail__preview-img"
            />
          </div>
        )}

        {/* Outcome detail is facilitator-facing, never participant-facing. */}
        {stage === 'settled' && outcome && outcome.kind !== 'complete' && (
          <div className="rail__state">
            <StateChip display={outcomeDisplay(outcome)} />
          </div>
        )}

        {handContact && stage === 'running' && (
          <div className="rail__state">
            <StateChip display={outcomeDisplay(HAND_CONTACT_SHAPE)} />
          </div>
        )}

        <div className="rail__spacer" />

        <div className="rail__actions">
          {stage === 'cue' && (
            <>
              <RailButton variant="quiet" onClick={onBack}>
                {strings.trial.backToRoster}
              </RailButton>
              <RailButton variant="quiet" onClick={() => setAskUnable(true)}>
                {strings.unable.action}
              </RailButton>
              <RailButton variant="primary" onClick={() => void begin()}>
                {strings.trial.begin}
              </RailButton>
            </>
          )}

          {stage === 'running' && (
            <>
              <RailButton onClick={() => setAskAbort(true)}>{strings.trial.discard}</RailButton>
              <RailButton variant="primary" onClick={() => void endNow()}>
                {strings.trial.end}
              </RailButton>
            </>
          )}

          {stage === 'settled' && outcome && (
            <RailButton variant="primary" onClick={() => onSettled(outcome)}>
              {strings.trial.viewResult}
            </RailButton>
          )}

          {stage === 'void' && (
            <>
              <RailButton variant="quiet" onClick={onBack}>
                {strings.trial.backToRoster}
              </RailButton>
              <RailButton variant="primary" onClick={restart}>
                {strings.trial.restart}
              </RailButton>
            </>
          )}
        </div>
      </div>

      <AbortDialog open={askAbort} onCancel={() => setAskAbort(false)} onConfirm={doAbort} />
      <UnableDialog
        open={askUnable}
        onCancel={() => setAskUnable(false)}
        onConfirm={() => void doUnable()}
      />
    </div>
  )
}

/* A minimal hand-contact outcome purely for the rail chip's word+shape. The real
   outcome is assembled by the data source when the trial settles. */
const HAND_CONTACT_SHAPE = {
  kind: 'hand_contact',
  repsCompleted: 0,
  repTimesMs: [],
  elapsedMs: 0,
  firstContactRep: 0,
  protocolInvalid: true,
} as const
