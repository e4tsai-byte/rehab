import { useState } from 'react'
import {
  BODY_REGIONS,
  EXERCISE_CATALOG,
  type ExerciseDefinition,
  type BodyRegionInfo,
} from '../domain/exerciseCatalog'
import { REHAB_ROUTINES, type RehabRoutine } from '../domain/routineCatalog'
import type { UserSettings, BodyRegion } from '../domain/rehabTypes'
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
  prescriptions?: import('../domain/rehabTypes').UserPrescription[] | undefined
  onStartExercise: (exerciseId: string) => void
  onStartRoutine: (routine: RehabRoutine) => void
}

type FilterCategory =
  | 'all'
  | 'shoulder'
  | 'knee'
  | 'hip'
  | 'elbow'
  | 'spine'
  | 'ankle'
  | 'routines'
  | 'standing'
  | 'seated'
  | 'sideLying'
  | 'upcoming'

const CATEGORY_CHIPS: Array<{ id: FilterCategory; labelKey: StringKey }> = [
  { id: 'all', labelKey: 'lib.catAll' },
  { id: 'shoulder', labelKey: 'region.shoulder' },
  { id: 'knee', labelKey: 'region.knee' },
  { id: 'hip', labelKey: 'region.hip' },
  { id: 'elbow', labelKey: 'region.elbow' },
  { id: 'spine', labelKey: 'region.spine' },
  { id: 'ankle', labelKey: 'region.ankle' },
  { id: 'routines', labelKey: 'lib.catRoutines' },
  { id: 'standing', labelKey: 'lib.catStanding' },
  { id: 'seated', labelKey: 'lib.catSeated' },
  { id: 'sideLying', labelKey: 'lib.catSideLying' },
  { id: 'upcoming', labelKey: 'lib.catUpcoming' },
]

export function ExerciseLibrary({
  settings,
  prescriptions = [],
  onStartExercise,
  onStartRoutine,
}: ExerciseLibraryProps) {
  const { t, locale } = useT()
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all')
  const [customRoutines, setCustomRoutines] = useState<RehabRoutine[]>(loadCustomRoutines)
  const [hiddenRoutineIds, setHiddenRoutineIds] = useState<string[]>(loadHiddenRoutineIds)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<RehabRoutine | null>(null)
  const [inspectingExercise, setInspectingExercise] = useState<ExerciseDefinition | null>(null)
  const [inspectingRoutine, setInspectingRoutine] = useState<RehabRoutine | null>(null)
  const isEn = locale === 'en'

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

  // Filter routines
  const showRoutines = activeFilter === 'all' || activeFilter === 'routines'

  // Helper: sort exercises so available / ready-to-perform come FIRST
  function sortAvailableFirst(exercises: ExerciseDefinition[]): ExerciseDefinition[] {
    return [...exercises].sort((a, b) => {
      if (a.status === 'available' && b.status !== 'available') return -1
      if (a.status !== 'available' && b.status === 'available') return 1
      return 0
    })
  }

  // Helper: get exercises for a region with active filter applied
  function getExercisesForRegion(regionId: BodyRegion): ExerciseDefinition[] {
    const regionExercises = EXERCISE_CATALOG.filter((ex) => ex.bodyRegion === regionId)
    const filtered = regionExercises.filter((ex) => {
      if (activeFilter === 'all' || activeFilter === regionId) return true
      if (activeFilter === 'routines') return false
      if (activeFilter === 'standing') return ex.posture === 'standing'
      if (activeFilter === 'seated') return ex.posture === 'seated'
      if (activeFilter === 'sideLying') return ex.posture === 'sideLying'
      if (activeFilter === 'upcoming') return ex.status === 'upcoming'
      return true
    })
    return sortAvailableFirst(filtered)
  }

  // Regions to render based on current filter
  const targetRegions = BODY_REGIONS.filter((region) => {
    if (activeFilter === 'routines') return false
    if (activeFilter === 'all') return true
    if (
      activeFilter === 'shoulder' ||
      activeFilter === 'knee' ||
      activeFilter === 'hip' ||
      activeFilter === 'elbow' ||
      activeFilter === 'spine' ||
      activeFilter === 'ankle'
    ) {
      return region.id === activeFilter
    }
    // For posture / upcoming filters, only show region if it has matching exercises
    const matches = getExercisesForRegion(region.id)
    return matches.length > 0
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
            <span>{t(chip.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* 1. Multi-Exercise Compound Routines (if visible) */}
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

      {/* 2. Anatomical Region-Grouped Exercises (Ready to Perform FIRST) */}
      {targetRegions.map((region: BodyRegionInfo) => {
        const exercises = getExercisesForRegion(region.id)
        if (exercises.length === 0) return null

        const regionName = isEn ? region.nameEn : region.nameZh
        const regionTag = isEn ? region.tagEn : region.tagZh
        const regionDesc = isEn ? region.descriptionEn : region.descriptionZh
        const isActive = region.status === 'active'

        return (
          <section key={region.id} className="library-region-section" aria-labelledby={`region-title-${region.id}`}>
            <div className="library-region-section__head">
              <div className="library-region-section__info">
                <div className="library-region-section__title-row">
                  <span className="region-card__code-badge" aria-hidden="true">
                    {region.code}
                  </span>
                  <div>
                    <h2 id={`region-title-${region.id}`} className="library-region-section__title">
                      {regionName}
                    </h2>
                    <span className="library-region-section__tag">
                      {regionTag}
                    </span>
                  </div>
                </div>
                <p className="library-region-section__desc">
                  {regionDesc}
                </p>
              </div>

              <div className="library-region-section__status">
                <span
                  className={`region-status-pill ${
                    isActive ? 'region-status-pill--active' : 'region-status-pill--upcoming'
                  }`}
                >
                  {isActive ? t('anatomy.activeBadge') : t('anatomy.upcomingBadge')}
                </span>
              </div>
            </div>

            {/* Grid with Available Exercises First */}
            <div className="video-cards-grid">
              {exercises.map((exercise) => {
                const isInPlan = prescriptions.some(
                  (p) => p.exerciseId === exercise.id && p.status === 'active'
                )
                return (
                  <ExerciseVideoCard
                    key={exercise.id}
                    exercise={exercise}
                    isInPlan={isInPlan}
                    onSelect={setInspectingExercise}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Empty State if Filter matches nothing */}
      {targetRegions.length === 0 && !showRoutines && (
        <div className="empty-state">
          <p className="empty-state__body">{t('lib.noResults')}</p>
        </div>
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
