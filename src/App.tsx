import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppHeader, type Place } from './components/AppHeader'
import { DemoBanner } from './components/DemoBanner'
import { RailButton } from './components/RailButton'
import { ScenarioSwitcher, type ScenarioActions } from './components/ScenarioSwitcher'
import { useDataSource } from './data/context'
import type { FixtureDataSource, TrialScript } from './data/fixtures'
import { currentTrialFor } from './domain/records'
import type { CorrectionNote, Outcome, Participant, ParticipantId, Phase } from './domain/types'
import { useSession } from './hooks/useSession'
import { strings } from './i18n/strings'
import { Result } from './surfaces/Result'
import { Roster } from './surfaces/Roster'
import { Sheet } from './surfaces/Sheet'
import { Trial } from './surfaces/Trial'
import { CorrectionDialog } from './surfaces/dialogs/CorrectionDialog'

type View =
  | { kind: 'roster' }
  | { kind: 'trial'; participantId: ParticipantId }
  /** `synthetic` is only set by the scenario switcher, for states not in the log. */
  | { kind: 'result'; participantId: ParticipantId; synthetic?: Outcome }
  | { kind: 'sheet' }

const SYNTHETIC: Record<string, Outcome> = {
  complete: { kind: 'complete', repsCompleted: 5, repTimesMs: [2400, 2500, 2600, 2700, 2900], totalMs: 13100 },
  incomplete: { kind: 'incomplete', repsCompleted: 3, repTimesMs: [4100, 4500, 4900], elapsedMs: 13500 },
  hand_contact: {
    kind: 'hand_contact',
    repsCompleted: 5,
    repTimesMs: [3000, 3200, 3600, 3900, 4200],
    elapsedMs: 17900,
    firstContactRep: 3,
    protocolInvalid: true,
  },
  unable: { kind: 'unable' },
  aborted: { kind: 'aborted', reason: 'interruption', repsCompleted: 1, elapsedMs: 3100 },
}

export function App() {
  const src = useDataSource()
  const [phase, setPhase] = useState<Phase>('post')
  const [view, setView] = useState<View>({ kind: 'roster' })
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [correcting, setCorrecting] = useState(false)

  const { block, sessions, active, resolved, allResolved } = useSession(phase)

  // The scenario switcher needs the fixture-only `nextScript` knob. Narrowed
  // here rather than widening SessionDataSource, so the October implementation
  // is not obliged to grow a demo affordance.
  const fixture = src as unknown as Partial<FixtureDataSource>

  const participantsById = useMemo(() => {
    const m = new Map<ParticipantId, Participant>()
    for (const p of block?.participants ?? []) m.set(p.id, p)
    return m
  }, [block])

  // Scenario switcher: S toggles. Ignored while typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.key === 's' || e.key === 'S') setScenarioOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const firstOutstanding = useCallback((): Participant | null => {
    for (const p of block?.participants ?? []) {
      if (currentTrialFor(resolved, p.id) === null) return p
    }
    return block?.participants[0] ?? null
  }, [block, resolved])

  const actions: ScenarioActions = {
    gotoRoster: (p) => {
      setPhase(p)
      setView({ kind: 'roster' })
    },
    gotoSheet: () => setView({ kind: 'sheet' }),
    runTrial: (script: TrialScript) => {
      if (fixture.nextScript !== undefined) fixture.nextScript = script
      const p = firstOutstanding()
      if (p) setView({ kind: 'trial', participantId: p.id })
    },
    showResult: (kind) => {
      const p = firstOutstanding()
      const outcome = SYNTHETIC[kind]
      if (p && outcome) setView({ kind: 'result', participantId: p.id, synthetic: outcome })
    },
  }

  if (!block || !active) {
    return (
      <div className="app">
        <DemoBanner simulated={src.isSimulated} />
        <div className="field" />
      </div>
    )
  }

  const current = view.kind !== 'roster' && view.kind !== 'sheet' ? participantsById.get(view.participantId) : undefined
  const currentTrial = current ? currentTrialFor(resolved, current.id) : null

  const resultOutcome: Outcome | null =
    view.kind === 'result' ? (view.synthetic ?? currentTrial?.outcome ?? null) : null

  /* Hub and spoke: the roster is the only surface without a way back, which is
     what identifies it as the hub. Everything else returns to exactly one
     place, by exactly one control. */
  const place: Place =
    view.kind === 'roster'
      ? { title: strings.nav.placeRoster, icon: 'roster' }
      : view.kind === 'sheet'
        ? { title: strings.nav.placeSheet, icon: 'sheet' }
        : view.kind === 'trial'
          ? { title: strings.nav.placeTrial(current?.label ?? ''), icon: 'trial' }
          : { title: strings.nav.placeResult(current?.label ?? ''), icon: 'record' }

  const phaseWord = phase === 'pre' ? strings.phase.pre : strings.phase.post

  async function submitCorrection(outcome: Outcome, note: CorrectionNote) {
    setCorrecting(false)
    if (!current || !currentTrial || !active) return
    await src.appendCorrection({
      sessionId: active.sessionId,
      participantId: current.id,
      correctsRecordId: currentTrial.latestRecordId,
      outcome,
      note,
    })
  }

  return (
    <div className="app">
      <AppHeader
        place={place}
        phaseWord={phaseWord}
        onBack={view.kind === 'roster' ? undefined : () => setView({ kind: 'roster' })}
      />
      <DemoBanner simulated={src.isSimulated} />

      {view.kind === 'roster' && (
        <div className="zones">
          <div className="field">
            <Roster
              block={block}
              resolved={resolved}
              onStart={(p) => setView({ kind: 'trial', participantId: p.id })}
              onReview={(p) => setView({ kind: 'result', participantId: p.id })}
            />
          </div>
          <div className="rail">
            <div className="rail__context">
              <span className="rail__context-id">{block.siteName}</span>
              <span className="rail__context-label">{block.blockName}</span>
            </div>
            <div className="rail__spacer" />
            <div className="rail__actions">
              <RailButton
                icon="phase-swap"
                onClick={() => setPhase(phase === 'post' ? 'pre' : 'post')}
              >
                {phase === 'post' ? strings.nav.switchToPre : strings.nav.switchToPost}
              </RailButton>
              <RailButton variant="primary" icon="sheet" onClick={() => setView({ kind: 'sheet' })}>
                {strings.roster.openSheet}
              </RailButton>
            </div>
          </div>
        </div>
      )}

      {view.kind === 'trial' && current && (
        <Trial
          participant={current}
          session={active}
          onSettled={() => setView({ kind: 'result', participantId: current.id })}
          onBack={() => setView({ kind: 'roster' })}
        />
      )}

      {view.kind === 'result' && current && resultOutcome && (
        <>
          <Result
            participant={current}
            outcome={resultOutcome}
            seatHeightCm={currentTrial?.original.seatHeightCm ?? (view.synthetic ? 45 : null)}
            onAccept={() => setView({ kind: 'roster' })}
            onRedo={() => setView({ kind: 'trial', participantId: current.id })}
            onCorrect={() => setCorrecting(true)}
          />
          {currentTrial && (
            <CorrectionDialog
              open={correcting}
              original={currentTrial.outcome}
              onCancel={() => setCorrecting(false)}
              onConfirm={(o, n) => void submitCorrection(o, n)}
            />
          )}
        </>
      )}

      {view.kind === 'sheet' && (
        <Sheet block={block} sessions={sessions} allResolved={allResolved} />
      )}

      <ScenarioSwitcher
        open={scenarioOpen}
        onOpen={() => setScenarioOpen(true)}
        onClose={() => setScenarioOpen(false)}
        actions={actions}
      />
    </div>
  )
}
