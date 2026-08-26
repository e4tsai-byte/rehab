import { useState } from 'react'
import {
  EXERCISE_CATALOG,
  localizeExercise,
  type ExerciseDefinition,
} from '../domain/exerciseCatalog'
import type {
  UserPrescription,
  PrescriptionStatus,
  UserSettings,
  CompletedSession,
} from '../domain/rehabTypes'
import {
  savePrescription,
  deletePrescription,
  togglePrescriptionStatus,
} from '../data/rehabStore'
import { PrescriptionEditorModal } from '../components/PrescriptionEditorModal'
import { PrescriptionTimelineVisualizer } from '../components/PrescriptionTimelineVisualizer'
import { ExerciseDetailModal } from '../components/ExerciseDetailModal'
import { assetUrl } from '../domain/assets'
import { useT } from '../i18n/LocaleContext'

interface PrescriptionPlannerProps {
  prescriptions: UserPrescription[]
  onPrescriptionsChange: (updated: UserPrescription[]) => void
  settings: UserSettings
  history?: CompletedSession[]
  onStartExercise: (exerciseId: string) => void
}

export function PrescriptionPlanner({
  prescriptions,
  onPrescriptionsChange,
  settings,
  onStartExercise,
}: PrescriptionPlannerProps) {
  const { t, locale } = useT()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPrescription, setEditingPrescription] = useState<UserPrescription | null>(null)
  const [inspectingExercise, setInspectingExercise] = useState<ExerciseDefinition | null>(null)

  const activePrescriptions = prescriptions.filter((p) => p.status === 'active')
  const queuedPrescriptions = prescriptions.filter((p) => p.status === 'queued')
  const completedPrescriptions = prescriptions.filter((p) => p.status === 'completed')

  // Calculate maximum target days/week across active prescriptions
  const maxWeeklyDays = activePrescriptions.reduce(
    (max, p) => Math.max(max, p.targetDaysPerWeek),
    activePrescriptions[0]?.targetDaysPerWeek ?? 5
  )

  function handleSavePrescription(prescription: UserPrescription) {
    const updated = savePrescription(prescription)
    onPrescriptionsChange(updated)
    setEditingPrescription(null)
    setEditorOpen(false)
  }

  function handleEdit(prescription: UserPrescription) {
    setEditingPrescription(prescription)
    setEditorOpen(true)
  }

  function handleDelete(id: string) {
    const updated = deletePrescription(id)
    onPrescriptionsChange(updated)
  }

  function handleToggleStatus(id: string, newStatus: PrescriptionStatus) {
    const updated = togglePrescriptionStatus(id, newStatus)
    onPrescriptionsChange(updated)
  }

  // Calculate current week progress based on startedAt and durationWeeks
  function getWeekProgress(startedAt: number, durationWeeks: number): {
    currentWeek: number
    percent: number
  } {
    const now = Date.now()
    const diffMs = Math.max(0, now - startedAt)
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const currentWeek = Math.min(durationWeeks, Math.floor(diffDays / 7) + 1)
    const percent = Math.min(100, Math.round((currentWeek / durationWeeks) * 100))
    return { currentWeek, percent }
  }

  return (
    <div className="prescription-planner">
      {/* 1. Hero Header */}
      <div className="rx-hero">
        <div className="rx-hero__content">
          <div>
            <span className="section-tag" style={{ marginBottom: '6px' }}>
              <span className="section-tag__dot" aria-hidden="true" />
              <span>{t('rx.tag')}</span>
            </span>
            <h1 className="rx-hero__title">{t('rx.heroTitle')}</h1>
            <p className="rx-hero__sub">{t('rx.heroSub')}</p>
          </div>

          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={() => {
              setEditingPrescription(null)
              setEditorOpen(true)
            }}
          >
            {t('rx.createBtn')}
          </button>
        </div>

        {/* 2. Metric Strip */}
        <div className="rx-metrics-strip">
          <div className="rx-metric-cell">
            <span className="rx-metric-cell__label">{t('rx.metricActive')}</span>
            <span className="rx-metric-cell__value rx-metric-cell__value--blue">
              {activePrescriptions.length}
            </span>
          </div>

          <div className="rx-metric-cell">
            <span className="rx-metric-cell__label">{t('rx.metricQueued')}</span>
            <span className="rx-metric-cell__value">{queuedPrescriptions.length}</span>
          </div>

          <div className="rx-metric-cell">
            <span className="rx-metric-cell__label">{t('rx.metricDays')}</span>
            <span className="rx-metric-cell__value">
              {activePrescriptions.length > 0 ? maxWeeklyDays : '—'}
            </span>
          </div>

          <div className="rx-metric-cell">
            <span className="rx-metric-cell__label">{t('rx.metricCompleted')}</span>
            <span className="rx-metric-cell__value rx-metric-cell__value--green">
              {completedPrescriptions.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Cohesive Prescription Timeline Visualizer */}
      <PrescriptionTimelineVisualizer
        prescriptions={prescriptions}
        onSelectPrescription={handleEdit}
      />

      {/* 3. Timeline Tracks */}
      <div className="rx-tracks-container">
        {/* Track 1: Active Phase (Parallel In-Progress) */}
        <section className="rx-track rx-track--active" aria-labelledby="rx-active-heading">
          <div className="rx-track__head">
            <div>
              <div className="rx-track__title-row">
                <span className="rx-track__badge rx-track__badge--active">
                  {t('rx.statusActive')}
                </span>
                <h2 id="rx-active-heading" className="rx-track__title">
                  {t('rx.trackActive')}
                </h2>
              </div>
              <p className="rx-track__sub">{t('rx.trackActiveSub')}</p>
            </div>
          </div>

          {activePrescriptions.length > 0 ? (
            <div className="rx-cards-grid">
              {activePrescriptions.map((rx) => {
                const exercise = EXERCISE_CATALOG.find((e) => e.id === rx.exerciseId)
                if (!exercise) return null
                const loc = localizeExercise(exercise, locale)
                const { currentWeek, percent } = getWeekProgress(rx.startedAt, rx.durationWeeks)

                return (
                  <article key={rx.id} className="rx-card rx-card--active">
                    {/* Media Thumbnail */}
                    <div className="rx-card__media">
                      <img
                        src={assetUrl(exercise.thumbnailUrl || exercise.diagramUrl || '')}
                        alt={loc.name}
                        className="rx-card__img"
                        loading="lazy"
                      />
                      <span className="rx-card__posture-badge">
                        {exercise.posture === 'standing'
                          ? t('posture.standingShort')
                          : exercise.posture === 'seated'
                            ? t('posture.seatedShort')
                            : t('posture.sideLyingShort')}
                      </span>
                      <span className="rx-card__region-badge">
                        {exercise.bodyRegion.toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="rx-card__body">
                      <div className="rx-card__meta">
                        <span className="rx-card__cat">{loc.category}</span>
                        <span className="rx-card__limb">{loc.targetLimb}</span>
                      </div>

                      <h3 className="rx-card__title">
                        {rx.customTitle ? rx.customTitle : loc.name}
                      </h3>
                      {rx.customTitle && (
                        <p className="rx-card__original-name">{loc.name}</p>
                      )}

                      {/* Week Progress Bar */}
                      <div className="rx-progress-block">
                        <div className="rx-progress-block__label-row">
                          <span className="rx-progress-block__week">
                            {t('rx.weekProgress', {
                              current: String(currentWeek),
                              total: String(rx.durationWeeks),
                            })}
                          </span>
                          <span className="rx-progress-block__duration">
                            {t('rx.durationWeeks', { n: String(rx.durationWeeks) })}
                          </span>
                        </div>
                        <div className="rx-progress-bar">
                          <div
                            className="rx-progress-bar__fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Parameters Tags */}
                      <div className="rx-card__tags">
                        <span className="spec-tag spec-tag--blue">
                          {t('rx.setsPerDay', { n: String(rx.dailySetsTarget) })}
                        </span>
                        <span className="spec-tag">
                          {t('rx.daysPerWeek', { n: String(rx.targetDaysPerWeek) })}
                        </span>
                        <span className="spec-tag">
                          {exercise.trackingModel === 'isometricHold'
                            ? '10°–15°'
                            : `${exercise.targetAngleDeg}°`}
                        </span>
                      </div>

                      {/* Notes Quote (if provided) */}
                      {rx.notes && (
                        <blockquote className="rx-card__notes">
                          <span>{rx.notes}</span>
                        </blockquote>
                      )}

                      {/* Action Buttons */}
                      <div className="rx-card__actions">
                        <button
                          type="button"
                          className="btn btn--primary rx-card__start-btn"
                          onClick={() => onStartExercise(exercise.id)}
                        >
                          {t('rx.startBtn')}
                        </button>

                        <div className="rx-card__action-links">
                          <button
                            type="button"
                            className="btn btn--glass btn--sm"
                            onClick={() => setInspectingExercise(exercise)}
                          >
                            {t('detail.executeTitle')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--glass btn--sm"
                            onClick={() => handleToggleStatus(rx.id, 'completed')}
                          >
                            {t('rx.markDone')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--glass btn--sm"
                            onClick={() => handleEdit(rx)}
                          >
                            {t('rx.edit')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--glass btn--sm rx-card__delete-btn"
                            onClick={() => handleDelete(rx.id)}
                          >
                            {t('rx.delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rx-empty-track">
              <p className="rx-empty-track__msg">{t('rx.emptyTitle')}</p>
              <button
                type="button"
                className="btn btn--glass btn--sm"
                onClick={() => {
                  setEditingPrescription(null)
                  setEditorOpen(true)
                }}
              >
                {t('rx.createBtn')}
              </button>
            </div>
          )}
        </section>

        {/* Track 2: Queued Stages (Upcoming Next Phases) */}
        <section className="rx-track rx-track--queued" aria-labelledby="rx-queued-heading">
          <div className="rx-track__head">
            <div className="rx-track__title-row">
              <span className="rx-track__badge rx-track__badge--queued">
                {t('rx.statusQueued')}
              </span>
              <div>
                <h2 id="rx-queued-heading" className="rx-track__title">
                  {t('rx.trackQueued')}
                </h2>
                <p className="rx-track__sub">{t('rx.trackQueuedSub')}</p>
              </div>
            </div>
          </div>

          {queuedPrescriptions.length > 0 ? (
            <div className="rx-cards-grid">
              {queuedPrescriptions.map((rx) => {
                const exercise = EXERCISE_CATALOG.find((e) => e.id === rx.exerciseId)
                if (!exercise) return null
                const loc = localizeExercise(exercise, locale)

                return (
                  <article key={rx.id} className="rx-card rx-card--queued">
                    {/* Media */}
                    <div className="rx-card__media">
                      <img
                        src={assetUrl(exercise.thumbnailUrl || exercise.diagramUrl || '')}
                        alt={loc.name}
                        className="rx-card__img"
                        loading="lazy"
                      />
                      <span className="rx-card__posture-badge">
                        {exercise.posture === 'standing'
                          ? t('posture.standingShort')
                          : exercise.posture === 'seated'
                            ? t('posture.seatedShort')
                            : t('posture.sideLyingShort')}
                      </span>
                      <span className="rx-card__region-badge">
                        {exercise.bodyRegion.toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="rx-card__body">
                      <div className="rx-card__meta">
                        <span className="rx-card__cat">{loc.category}</span>
                        <span className="rx-card__limb">{loc.targetLimb}</span>
                      </div>

                      <h3 className="rx-card__title">
                        {rx.customTitle ? rx.customTitle : loc.name}
                      </h3>
                      {rx.customTitle && (
                        <p className="rx-card__original-name">{loc.name}</p>
                      )}

                      {/* Duration & Sets Info */}
                      <div className="rx-card__tags">
                        <span className="spec-tag spec-tag--blue">
                          {t('rx.durationWeeks', { n: String(rx.durationWeeks) })}
                        </span>
                        <span className="spec-tag">
                          {t('rx.setsPerDay', { n: String(rx.dailySetsTarget) })}
                        </span>
                        <span className="spec-tag">
                          {t('rx.daysPerWeek', { n: String(rx.targetDaysPerWeek) })}
                        </span>
                      </div>

                      {/* Notes Quote (if provided) */}
                      {rx.notes && (
                        <blockquote className="rx-card__notes">
                          <span>{rx.notes}</span>
                        </blockquote>
                      )}

                      {/* Action Buttons */}
                      <div className="rx-card__actions">
                        <button
                          type="button"
                          className="btn btn--primary rx-card__start-btn"
                          onClick={() => handleToggleStatus(rx.id, 'active')}
                        >
                          {t('rx.activateNow')}
                        </button>

                        <div className="rx-card__action-links">
                          <button
                            type="button"
                            className="btn btn--glass btn--sm"
                            onClick={() => setInspectingExercise(exercise)}
                          >
                            {t('detail.executeTitle')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--glass btn--sm"
                            onClick={() => handleEdit(rx)}
                          >
                            {t('rx.edit')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--glass btn--sm rx-card__delete-btn"
                            onClick={() => handleDelete(rx.id)}
                          >
                            {t('rx.delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rx-empty-track">
              <p className="rx-empty-track__msg">{t('rx.emptyTitle')}</p>
            </div>
          )}
        </section>

        {/* Track 3: Completed Goals (Archived) */}
        {completedPrescriptions.length > 0 && (
          <section className="rx-track rx-track--completed" aria-labelledby="rx-completed-heading">
            <div className="rx-track__head">
              <div>
                <div className="rx-track__title-row">
                  <span className="rx-track__badge rx-track__badge--completed" aria-hidden="true">
                    DONE
                  </span>
                  <h2 id="rx-completed-heading" className="rx-track__title">
                    {t('rx.trackCompleted')}
                  </h2>
                </div>
                <p className="rx-track__sub">{t('rx.trackCompletedSub')}</p>
              </div>
            </div>

            <div className="rx-cards-grid">
              {completedPrescriptions.map((rx) => {
                const exercise = EXERCISE_CATALOG.find((e) => e.id === rx.exerciseId)
                if (!exercise) return null
                const loc = localizeExercise(exercise, locale)

                return (
                  <article key={rx.id} className="rx-card rx-card--completed">
                    <div className="rx-card__body">
                      <div className="rx-card__meta">
                        <span className="rx-card__cat">{loc.category}</span>
                      </div>
                      <h3 className="rx-card__title">
                        {rx.customTitle ? rx.customTitle : loc.name}
                      </h3>
                      <div className="rx-card__tags">
                        <span className="spec-tag">
                          {t('rx.durationWeeks', { n: String(rx.durationWeeks) })}
                        </span>
                      </div>
                      <div className="rx-card__action-links" style={{ marginTop: 'var(--s-3)' }}>
                        <button
                          type="button"
                          className="btn btn--quiet btn--sm"
                          onClick={() => handleToggleStatus(rx.id, 'active')}
                        >
                          {t('rx.activateNow')}
                        </button>
                        <button
                          type="button"
                          className="btn btn--quiet btn--sm rx-card__delete-btn"
                          onClick={() => handleDelete(rx.id)}
                        >
                          {t('rx.delete')}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Prescription Editor Modal */}
      {editorOpen && (
        <PrescriptionEditorModal
          initialPrescription={editingPrescription}
          onSave={handleSavePrescription}
          onClose={() => {
            setEditorOpen(false)
            setEditingPrescription(null)
          }}
        />
      )}

      {/* Exercise Detail Modal for quick inspection */}
      {inspectingExercise && (
        <ExerciseDetailModal
          exercise={inspectingExercise}
          settings={settings}
          onStart={onStartExercise}
          onClose={() => setInspectingExercise(null)}
        />
      )}
    </div>
  )
}
