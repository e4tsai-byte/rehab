import { useState } from 'react'
import { EXERCISE_CATALOG, type ExerciseDefinition } from '../domain/exerciseCatalog'
import { REHAB_ROUTINES, type RehabRoutine } from '../domain/routineCatalog'
import type { UserSettings } from '../domain/rehabTypes'
import {
  loadCustomRoutines,
  saveCustomRoutine,
  deleteCustomRoutine,
  loadHiddenRoutineIds,
  hideRoutine,
  unhideAllRoutines,
} from '../data/rehabStore'
import { ExerciseVideoCard } from '../components/ExerciseVideoCard'
import { RoutineVideoCard } from '../components/RoutineVideoCard'
import { ExerciseDetailModal } from '../components/ExerciseDetailModal'
import { RoutineDetailModal } from '../components/RoutineDetailModal'
import { CustomRoutineBuilderModal } from '../components/CustomRoutineBuilderModal'
import { useT } from '../i18n/LocaleContext'
import type { StringKey } from '../i18n/uiStrings'

interface ExerciseLibraryProps {
  settings: UserSettings
  onStartExercise: (exerciseId: string) => void
  onStartRoutine: (routine: RehabRoutine) => void
}

type FilterCategory = 'all' | 'routines' | 'standing' | 'seated' | 'upcoming'

const CATEGORY_CHIPS: Array<{ id: FilterCategory; labelKey: StringKey; icon?: string }> = [
  { id: 'all', labelKey: 'lib.catAll' },
  { id: 'routines', labelKey: 'lib.catRoutines', icon: '📑' },
  { id: 'standing', labelKey: 'lib.catStanding', icon: '🧍' },
  { id: 'seated', labelKey: 'lib.catSeated', icon: '🪑' },
  { id: 'upcoming', labelKey: 'lib.catUpcoming', icon: '🔒' },
]

export function ExerciseLibrary({
  settings,
  onStartExercise,
  onStartRoutine,
}: ExerciseLibraryProps) {
  const { t } = useT()
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all')
  const [customRoutines, setCustomRoutines] = useState<RehabRoutine[]>(loadCustomRoutines)
  const [hiddenRoutineIds, setHiddenRoutineIds] = useState<string[]>(loadHiddenRoutineIds)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<RehabRoutine | null>(null)
  const [inspectingExercise, setInspectingExercise] = useState<ExerciseDefinition | null>(null)
  const [inspectingRoutine, setInspectingRoutine] = useState<RehabRoutine | null>(null)

  // Combined routines: custom routines on top, then non-hidden default presets
  const allRoutines = [
    ...customRoutines,
    ...REHAB_ROUTINES.filter((r) => !hiddenRoutineIds.includes(r.id)),
  ]

  function handleSaveCustomRoutine(newRoutine: RehabRoutine) {
    const updated = saveCustomRoutine(newRoutine)
    setCustomRoutines(updated)
    setEditingRoutine(null)
    setBuilderOpen(false)
  }

  function handleEditRoutine(routine: RehabRoutine) {
    setEditingRoutine(routine)
    setBuilderOpen(true)
  }

  function handleDeleteRoutine(routineId: string) {
    const isCustom = customRoutines.some((r) => r.id === routineId)
    if (isCustom) {
      const updated = deleteCustomRoutine(routineId)
      setCustomRoutines(updated)
    } else {
      const updated = hideRoutine(routineId)
      setHiddenRoutineIds(updated)
    }
  }

  function handleRestoreDefaultRoutines() {
    const updated = unhideAllRoutines()
    setHiddenRoutineIds(updated)
  }

  // Filter routines and exercises
  const showRoutines = activeFilter === 'all' || activeFilter === 'routines'
  const filteredExercises = EXERCISE_CATALOG.filter((ex) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'routines') return false
    if (activeFilter === 'standing') return ex.posture === 'standing' && ex.status === 'prescribed'
    if (activeFilter === 'seated') return ex.posture === 'seated' && ex.status === 'prescribed'
    if (activeFilter === 'upcoming') return ex.status === 'upcoming'
    return true
  })

  return (
    <div className="exercise-library">
      {/* Hero Header */}
      <div className="library-hero">
        <div>
          <span className="section-tag" style={{ marginBottom: '4px' }}>
            <span className="section-tag__dot" aria-hidden="true" />
            <span>{t('lib.tag')}</span>
          </span>
          <h1 className="library-hero__title">{t('lib.heroTitle')}</h1>
          <p className="library-hero__sub">{t('lib.heroSub')}</p>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="library-filters" role="tablist" aria-label={t('lib.filtersAria')}>
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            role="tab"
            aria-selected={activeFilter === chip.id}
            className={`filter-chip ${activeFilter === chip.id ? 'filter-chip--active' : ''}`}
            onClick={() => setActiveFilter(chip.id)}
          >
            {chip.icon && <span aria-hidden="true">{chip.icon}</span>}
            <span>{t(chip.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* 1. Multi-Exercise Routines Section (if visible) */}
      {showRoutines && (
        <section className="library-section" aria-label={t('lib.routinesAria')}>
          <div className="library-section__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--s-3)' }}>
            <div>
              <h2 className="library-section__title">{t('lib.routinesTitle')}</h2>
              <p className="library-section__sub">{t('lib.routinesSub')}</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
              {hiddenRoutineIds.length > 0 && (
                <button
                  type="button"
                  className="btn btn--quiet btn--sm"
                  onClick={handleRestoreDefaultRoutines}
                  title={t('lib.restoreDefaultsTitle')}
                >
                  {t('lib.restoreDefaults')}
                </button>
              )}
              <button
                type="button"
                className="btn btn--glass"
                onClick={() => {
                  setEditingRoutine(null)
                  setBuilderOpen(true)
                }}
                style={{ fontWeight: 600 }}
              >
                {t('lib.createCustom')}
              </button>
            </div>
          </div>

          <div className="routine-cards-grid">
            {allRoutines.map((routine) => (
              <RoutineVideoCard
                key={routine.id}
                routine={routine}
                onSelect={setInspectingRoutine}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Individual Exercises Section */}
      {filteredExercises.length > 0 && (
        <section className="library-section" aria-label={t('lib.exercisesAria')}>
          <div className="library-section__head">
            <div>
              <h2 className="library-section__title">
                {activeFilter === 'upcoming' ? t('lib.upcomingTitle') : t('lib.selfTitle')}
              </h2>
              <p className="library-section__sub">
                {activeFilter === 'upcoming' ? t('lib.upcomingSub') : t('lib.selfSub')}
              </p>
            </div>
          </div>

          <div className="video-cards-grid">
            {filteredExercises.map((exercise) => (
              <ExerciseVideoCard
                key={exercise.id}
                exercise={exercise}
                onSelect={setInspectingExercise}
              />
            ))}
          </div>
        </section>
      )}

      {/* Exercise Detail Modal */}
      {inspectingExercise && (
        <ExerciseDetailModal
          exercise={inspectingExercise}
          settings={settings}
          onStart={onStartExercise}
          onClose={() => setInspectingExercise(null)}
        />
      )}

      {/* Routine Detail Modal */}
      {inspectingRoutine && (
        <RoutineDetailModal
          routine={inspectingRoutine}
          onStartRoutine={onStartRoutine}
          onEditRoutine={handleEditRoutine}
          onDeleteRoutine={handleDeleteRoutine}
          onClose={() => setInspectingRoutine(null)}
        />
      )}

      {/* Custom Routine Builder / Editor Modal */}
      {builderOpen && (
        <CustomRoutineBuilderModal
          initialRoutine={editingRoutine}
          onSave={handleSaveCustomRoutine}
          onClose={() => {
            setBuilderOpen(false)
            setEditingRoutine(null)
          }}
        />
      )}
    </div>
  )
}
