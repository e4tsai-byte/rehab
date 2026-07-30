import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppHeader, type Crumb } from './components/AppHeader'
import { DemoBanner } from './components/DemoBanner'
import { RailButton } from './components/RailButton'
import { ScenarioSwitcher, type ScenarioActions } from './components/ScenarioSwitcher'
import { useDataSource } from './data/context'
import type { FixtureDataSource, TrialScript } from './data/fixtures'
import { currentTrialFor } from './domain/records'
import type {
  CorrectionNote,
  Outcome,
  Participant,
  ParticipantId,
  Phase,
  SessionSetup,
} from './domain/types'
import { useSession } from './hooks/useSession'
import { strings } from './i18n/strings'
import { ParticipantDetail } from './surfaces/ParticipantDetail'
import { Result } from './surfaces/Result'
import { Roster } from './surfaces/Roster'
import { Setup } from './surfaces/Setup'
import { Sheet } from './surfaces/Sheet'
import { Trial } from './surfaces/Trial'
import { CorrectionDialog } from './surfaces/dialogs/CorrectionDialog'

/**
 * The surfaces nest, and the header renders that nesting as a path:
 *
 *   setup ──► roster ──┬──► trial ──► result ──► detail
 *                      ├──► detail
 *                      └──► sheet
 *
 * `result` is the post-trial surface: this person's time, and move on. It is
 * deliberately NOT `detail` — see the dignity constraint in Result.tsx.
 *
 * `back` is therefore structural — the level above — rather than a visit
 * history. Someone who reaches 紀錄 from a finished trial goes UP to the
 * roster, not back into the trial they just completed.
 */
type View =
  | { kind: 'setup' }
  | { kind: 'roster' }
  | { kind: 'trial'; participantId: ParticipantId }
  /** Immediately after a trial. Carries the settled outcome so the surface does
      not have to re-derive which of several attempts it is showing. */
  | { kind: 'result'; participantId: ParticipantId; outcome: Outcome }
  | { kind: 'detail'; participantId: ParticipantId }
  | { kind: 'sheet' }

export function App() {
  const src = useDataSource()
  const [phase, setPhase] = useState<Phase>('post')
  const [view, setView] = useState<View>({ kind: 'setup' })
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [correcting, setCorrecting] = useState(false)

  const { block, sessions, active, resolved, allResolved, refresh } = useSession(phase)

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
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
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

  /**
   * The next person still to be measured, skipping the one just finished.
   *
   * Roster order, not "nearest after this index": a facilitator calls the class
   * in list order, and after a mid-list redo the next name should still be the
   * first outstanding one rather than whoever happens to sit below.
   */
  const nextOutstanding = useCallback(
    (afterId: ParticipantId): Participant | null => {
      for (const p of block?.participants ?? []) {
        if (p.id !== afterId && currentTrialFor(resolved, p.id) === null) return p
      }
      return null
    },
    [block, resolved],
  )

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
    showResult: () => {
      const p = firstOutstanding()
      if (p) setView({ kind: 'detail', participantId: p.id })
    },
  }

  async function beginSession(setup: SessionSetup) {
    await src.openSession(setup)
    setPhase(setup.phase)
    refresh()
    setView({ kind: 'roster' })
  }

  const current =
    view.kind === 'trial' || view.kind === 'detail' || view.kind === 'result'
      ? participantsById.get(view.participantId)
      : undefined
  const currentTrial = current ? currentTrialFor(resolved, current.id) : null

  const goSetup = () => setView({ kind: 'setup' })
  const goRoster = () => setView({ kind: 'roster' })

  /* The path to the current surface. Root first, current last; the last entry
     has no `go`, which is what marks it as current and makes it the <h1>. */
  const trail: Crumb[] = [
    { title: strings.nav.placeSetup, icon: 'roster', go: view.kind === 'setup' ? undefined : goSetup },
  ]
  if (view.kind !== 'setup') {
    trail.push({
      title: strings.nav.placeRoster,
      icon: 'roster',
      go: view.kind === 'roster' ? undefined : goRoster,
    })
  }
  if (view.kind === 'trial') {
    trail.push({ title: strings.nav.placeTrial(current?.label ?? ''), icon: 'trial' })
  } else if (view.kind === 'result') {
    trail.push({ title: strings.nav.placeTrialResult(current?.label ?? ''), icon: 'record' })
  } else if (view.kind === 'detail') {
    trail.push({ title: strings.nav.placeResult(current?.label ?? ''), icon: 'record' })
  } else if (view.kind === 'sheet') {
    trail.push({ title: strings.nav.placeSheet, icon: 'sheet' })
  }
  // The setup screen has no phase yet — it is where phase gets chosen.
  const phaseWord =
    view.kind === 'setup' ? null : phase === 'pre' ? strings.phase.pre : strings.phase.post

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

  const shell = (body: React.ReactNode) => (
    <div className="app">
      <AppHeader
        trail={trail}
        phaseWord={phaseWord}
        scenarioSlot={
          <ScenarioSwitcher
            open={scenarioOpen}
            onOpen={() => setScenarioOpen(true)}
            onClose={() => setScenarioOpen(false)}
            actions={actions}
          />
        }
      />
      <DemoBanner simulated={src.isSimulated} />
      {body}
    </div>
  )

  if (view.kind === 'setup') return shell(<Setup onBegin={(s) => void beginSession(s)} />)

  if (!block || !active) return shell(<div className="field" />)

  return shell(
    <>
      {view.kind === 'roster' && (
        <div className="zones">
          <div className="field">
            <Roster
              block={block}
              resolved={resolved}
              onStart={(p) => setView({ kind: 'trial', participantId: p.id })}
              onReview={(p) => setView({ kind: 'detail', participantId: p.id })}
            />
          </div>
          <div className="rail">
            <div className="rail__context">
              <span className="rail__context-id">{block.siteName}</span>
              <span className="rail__context-label">{block.blockName}</span>
            </div>
            <div className="rail__spacer" />
            <div className="rail__actions">
              {/* No phase toggle here any more. Phase is chosen once, on setup. */}
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
          onSettled={(outcome) => setView({ kind: 'result', participantId: current.id, outcome })}
          onBack={goRoster}
        />
      )}

      {view.kind === 'result' && current && (
        <Result
          participant={current}
          outcome={view.outcome}
          seatHeightCm={currentTrial?.original.seatHeightCm ?? null}
          nextParticipant={nextOutstanding(current.id)}
          onNext={() => {
            const n = nextOutstanding(current.id)
            setView(n ? { kind: 'trial', participantId: n.id } : { kind: 'roster' })
          }}
          onFullRecord={() => setView({ kind: 'detail', participantId: current.id })}
        />
      )}

      {view.kind === 'detail' && current && (
        <>
          <ParticipantDetail
            participant={current}
            sessions={sessions}
            allResolved={allResolved}
            onCorrect={() => setCorrecting(true)}
            onRemeasure={() => setView({ kind: 'trial', participantId: current.id })}
            onDone={goRoster}
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
    </>,
  )
}
