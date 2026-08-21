import { useState } from 'react'
import { RehabHeader } from './components/RehabHeader'
import { SettingsModal } from './components/SettingsModal'
import {
  calculateStreak,
  loadHistory,
  loadSettings,
  saveSession,
  saveSettings,
} from './data/rehabStore'
import { EXERCISE_CATALOG } from './domain/exerciseCatalog'
import type { CompletedSession, UserSettings } from './domain/rehabTypes'
import { RehabDashboard } from './surfaces/RehabDashboard'
import { RehabTraining } from './surfaces/RehabTraining'
import { SessionSummary } from './surfaces/SessionSummary'

type ViewMode = 'dashboard' | 'training' | 'summary'

export function App() {
  const [view, setView] = useState<ViewMode>('dashboard')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISE_CATALOG[0]!.id)
  const [settings, setSettings] = useState<UserSettings>(loadSettings)
  const [history, setHistory] = useState<CompletedSession[]>(loadHistory)
  const [activeSession, setActiveSession] = useState<CompletedSession | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const streak = calculateStreak(history)

  function handleStartExercise(exerciseId: string) {
    setSelectedExerciseId(exerciseId)
    setView('training')
  }

  function handleFinishSession(session: CompletedSession) {
    const updatedHistory = saveSession(session)
    setHistory(updatedHistory)
    setActiveSession(session)
    setView('summary')
  }

  function handleSaveSettings(newSettings: UserSettings) {
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  return (
    <div className="rehab-app">
      {/* Sleek Dark Mode Header */}
      <RehabHeader
        streak={streak}
        onOpenSettings={() => setSettingsOpen(true)}
        onGoHome={() => setView('dashboard')}
      />

      {/* Main Surfaces */}
      {view === 'dashboard' && (
        <RehabDashboard
          settings={settings}
          history={history}
          onStartExercise={handleStartExercise}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {view === 'training' && (
        <RehabTraining
          exerciseId={selectedExerciseId}
          settings={settings}
          onFinishSession={handleFinishSession}
          onCancel={() => setView('dashboard')}
        />
      )}

      {view === 'summary' && activeSession && (
        <SessionSummary
          session={activeSession}
          onReturnHome={() => setView('dashboard')}
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
