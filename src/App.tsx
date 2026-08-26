import { useState } from 'react'
import { RehabHeader } from './components/RehabHeader'
import { SettingsModal } from './components/SettingsModal'
import {
  calculateStreak,
  loadHistory,
  loadSettings,
  loadPrescriptions,
  saveSession,
  saveSettings,
} from './data/rehabStore'
import { EXERCISE_CATALOG } from './domain/exerciseCatalog'
import type { CompletedSession, UserSettings, UserPrescription } from './domain/rehabTypes'
import type { RehabRoutine } from './domain/routineCatalog'
import { RehabDashboard } from './surfaces/RehabDashboard'
import { ExerciseLibrary } from './surfaces/ExerciseLibrary'
import { PrescriptionPlanner } from './surfaces/PrescriptionPlanner'
import { RehabTraining } from './surfaces/RehabTraining'
import { SessionSummary } from './surfaces/SessionSummary'

type ViewMode = 'dashboard' | 'exercises' | 'prescriptions' | 'training' | 'summary'

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'exercises' | 'prescriptions'>('dashboard')
  const [view, setView] = useState<ViewMode>('dashboard')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISE_CATALOG[0]!.id)
  const [activeRoutine, setActiveRoutine] = useState<RehabRoutine | null>(null)
  const [routineStationIndex, setRoutineStationIndex] = useState<number>(0)
  const [settings, setSettings] = useState<UserSettings>(loadSettings)
  const [history, setHistory] = useState<CompletedSession[]>(loadHistory)
  const [prescriptions, setPrescriptions] = useState<UserPrescription[]>(loadPrescriptions)
  const [activeSession, setActiveSession] = useState<CompletedSession | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const streak = calculateStreak(history)

  function handleStartExercise(exerciseId: string) {
    setSelectedExerciseId(exerciseId)
    setActiveRoutine(null)
    setRoutineStationIndex(0)
    setView('training')
  }

  function handleStartRoutine(routine: RehabRoutine) {
    setActiveRoutine(routine)
    setRoutineStationIndex(0)
    const firstStation = routine.stations[0]
    if (firstStation) {
      setSelectedExerciseId(firstStation.exerciseId)
    }
    setView('training')
  }

  function handleFinishSession(session: CompletedSession) {
    const updatedHistory = saveSession(session)
    setHistory(updatedHistory)
    setActiveSession(session)

    // Check if there is a next station in active routine
    if (activeRoutine && routineStationIndex < activeRoutine.stations.length - 1) {
      const nextIndex = routineStationIndex + 1
      const nextStation = activeRoutine.stations[nextIndex]
      if (nextStation) {
        setRoutineStationIndex(nextIndex)
        setSelectedExerciseId(nextStation.exerciseId)
        // Show summary of station then user can continue, or direct to summary
        setView('summary')
        return
      }
    }

    setActiveRoutine(null)
    setRoutineStationIndex(0)
    setView('summary')
  }

  function handleSaveSettings(newSettings: UserSettings) {
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  return (
    <div className="rehab-app">
      {/* Top Header with Navigation Tabs */}
      <RehabHeader
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab)
          setView(tab)
        }}
        streak={streak}
        onOpenSettings={() => setSettingsOpen(true)}
        onGoHome={() => {
          setActiveTab('dashboard')
          setView('dashboard')
        }}
      />

      {/* Surface 1: Dashboard */}
      {view === 'dashboard' && (
        <RehabDashboard
          history={history}
          prescriptions={prescriptions}
          onStartExercise={handleStartExercise}
          onStartRoutine={handleStartRoutine}
          onNavigateToExercises={() => {
            setActiveTab('exercises')
            setView('exercises')
          }}
          onNavigateToPrescriptions={() => {
            setActiveTab('prescriptions')
            setView('prescriptions')
          }}
          onSelectSession={(session) => {
            setActiveSession(session)
            setView('summary')
          }}
        />
      )}

      {/* Surface 2: Exercise Library */}
      {view === 'exercises' && (
        <ExerciseLibrary
          settings={settings}
          prescriptions={prescriptions}
          onStartExercise={handleStartExercise}
          onStartRoutine={handleStartRoutine}
        />
      )}

      {/* Surface 3: My Prescriptions Planner */}
      {view === 'prescriptions' && (
        <PrescriptionPlanner
          prescriptions={prescriptions}
          onPrescriptionsChange={setPrescriptions}
          settings={settings}
          history={history}
          onStartExercise={handleStartExercise}
        />
      )}

      {/* Surface: Live Coaching */}
      {view === 'training' && (
        <RehabTraining
          exerciseId={selectedExerciseId}
          settings={settings}
          onFinishSession={handleFinishSession}
          onCancel={() => {
            setActiveRoutine(null)
            setView(activeTab)
          }}
        />
      )}

      {/* Surface: Post-Session Summary */}
      {view === 'summary' && activeSession && (
        <SessionSummary
          session={activeSession}
          onReturnHome={() => {
            setActiveRoutine(null)
            setView(activeTab)
          }}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export default App
