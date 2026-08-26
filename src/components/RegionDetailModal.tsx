import { useEffect, useRef } from 'react'
import {
  BODY_REGIONS,
  EXERCISE_CATALOG,
  type ExerciseDefinition,
  localizeExercise,
} from '../domain/exerciseCatalog'
import { REHAB_ROUTINES, type RehabRoutine, localizeRoutine } from '../domain/routineCatalog'
import type { BodyRegion } from '../domain/rehabTypes'
import { useT } from '../i18n/LocaleContext'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface RegionDetailModalProps {
  regionId: BodyRegion
  onClose: () => void
  onStartExercise: (exerciseId: string) => void
  onStartRoutine?: ((routine: RehabRoutine) => void) | undefined
  onNavigateToLibrary: () => void
}

export function RegionDetailModal({
  regionId,
  onClose,
  onStartExercise,
  onStartRoutine,
  onNavigateToLibrary,
}: RegionDetailModalProps) {
  const { t, locale } = useT()
  const modalRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock()
  const isEn = locale === 'en'

  const regionInfo = BODY_REGIONS.find((r) => r.id === regionId) ?? BODY_REGIONS[0]!

  // Exercises and routines for this region
  const regionExercises = EXERCISE_CATALOG.filter((e) => e.bodyRegion === regionId)
  const availableExercises = regionExercises.filter((e) => e.status === 'available')
  const upcomingExercises = regionExercises.filter((e) => e.status === 'upcoming')
  const regionRoutines = REHAB_ROUTINES.filter(
    (r) => (r.bodyRegion ?? 'shoulder') === regionId
  )

  // Close on Escape key and trap focus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    modalRef.current?.focus()
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const regionName = isEn ? regionInfo.nameEn : regionInfo.nameZh
  const regionTag = isEn ? regionInfo.tagEn : regionInfo.tagZh
  const regionDesc = isEn ? regionInfo.descriptionEn : regionInfo.descriptionZh
  const muscles = isEn ? regionInfo.primaryMusclesEn : regionInfo.primaryMusclesZh

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={modalRef}
        className="sheet sheet--wide region-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t('regionModal.aria', { name: regionName })}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Bar */}
        <div className="region-modal-header">
          <div className="region-modal-header__top-row">
            <button
              type="button"
              className="btn btn--quiet btn--sm region-modal-back-btn"
              onClick={onClose}
              aria-label={t('regionModal.backToFullBody')}
            >
              ← {t('regionModal.backToFullBody')}
            </button>
            <button
              type="button"
              className="btn btn--quiet btn--icon"
              onClick={onClose}
              aria-label={t('regionModal.close')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="region-modal-hero">
            <div className="region-modal-hero__icon-box">
              <span className="region-card__code-badge" style={{ fontSize: '1.1rem', width: '48px', height: '48px' }} aria-hidden="true">
                {regionInfo.code}
              </span>
            </div>
            <div className="region-modal-hero__content">
              <div className="region-modal-hero__tags">
                <span className="section-tag">
                  <span className="section-tag__dot" aria-hidden="true" />
                  <span>{regionTag}</span>
                </span>
                <span
                  className={`region-status-pill ${
                    regionInfo.status === 'active'
                      ? 'region-status-pill--active'
                      : 'region-status-pill--upcoming'
                  }`}
                >
                  {regionInfo.status === 'active'
                    ? t('regionModal.statusActive')
                    : t('regionModal.statusUpcoming')}
                </span>
              </div>
              <h1 className="region-modal-hero__title">{regionName}</h1>
              <p className="region-modal-hero__desc">{regionDesc}</p>

              {/* Target Musculature Chips */}
              <div className="region-modal-muscles">
                <span className="region-modal-muscles-label">
                  {t('anatomy.targetMuscles')}
                </span>
                {muscles.map((muscle) => (
                  <span key={muscle} className="muscle-chip muscle-chip--highlight">
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="region-modal-body">
          {/* 1. Available Coached Exercises */}
          <section className="region-modal-section" aria-labelledby="available-heading">
            <div className="region-modal-section__head">
              <h2 id="available-heading" className="region-modal-section__title">
                {t('regionModal.availableTitle')}
              </h2>
              <p className="region-modal-section__sub">
                {t('regionModal.availableSub')}
              </p>
            </div>

            {availableExercises.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <p className="empty-state__body">{t('regionModal.noAvailable')}</p>
              </div>
            ) : (
              <div className="region-exercises-grid">
                {availableExercises.map((ex: ExerciseDefinition) => {
                  const localized = localizeExercise(ex, locale)
                  const isHold = ex.trackingModel === 'isometricHold'

                  return (
                    <div key={ex.id} className="region-exercise-card">
                      <div className="region-exercise-card__media">
                        <img
                          src={ex.thumbnailUrl}
                          alt=""
                          className="region-exercise-card__img"
                          loading="lazy"
                        />
                        <span className="region-exercise-card__posture-badge">
                          {ex.posture === 'standing'
                            ? t('lib.catStanding')
                            : ex.posture === 'seated'
                            ? t('lib.catSeated')
                            : t('lib.catSideLying')}
                        </span>
                        <span className="region-exercise-card__angle-badge">
                          {ex.targetAngleDeg}°
                        </span>
                      </div>

                      <div className="region-exercise-card__content">
                        <div className="region-exercise-card__cat">
                          {localized.category}
                        </div>
                        <h3 className="region-exercise-card__title">
                          {localized.name}
                        </h3>
                        <p className="region-exercise-card__desc">
                          {localized.description}
                        </p>

                        <div className="region-exercise-card__specs">
                          <span className="spec-tag">
                            {ex.targetReps} {t('fmt.reps', { n: '' }).trim()}
                          </span>
                          <span className="spec-tag">
                            {isHold ? `${ex.holdDurationS}s hold` : `5-5-5s tempo`}
                          </span>
                          {ex.dailySessionTarget && (
                            <span className="spec-tag spec-tag--blue">
                              {ex.dailySessionTarget} {t('fmt.sets', { n: '' }).trim()}/day
                            </span>
                          )}
                        </div>

                        <div className="region-exercise-card__actions">
                          <button
                            type="button"
                            className="btn btn--primary btn--md"
                            style={{ width: '100%' }}
                            onClick={() => {
                              onClose()
                              onStartExercise(ex.id)
                            }}
                          >
                            {t('regionModal.quickStart')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 2. Multi-Exercise Routines (if available) */}
          {regionRoutines.length > 0 && (
            <section className="region-modal-section" aria-labelledby="routines-heading">
              <div className="region-modal-section__head">
                <h2 id="routines-heading" className="region-modal-section__title">
                  {t('regionModal.routinesTitle')}
                </h2>
                <p className="region-modal-section__sub">
                  {t('regionModal.routinesSub')}
                </p>
              </div>

              <div className="region-routines-grid">
                {regionRoutines.map((routine: RehabRoutine) => {
                  const localized = localizeRoutine(routine, locale)

                  return (
                    <div
                      key={routine.id}
                      className="region-routine-card"
                      role="button"
                      tabIndex={0}
                      aria-label={localized.name}
                      onClick={() => {
                        onClose()
                        if (onStartRoutine) onStartRoutine(routine)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onClose()
                          if (onStartRoutine) onStartRoutine(routine)
                        }
                      }}
                    >
                      <div className="region-routine-card__info">
                        <div className="section-tag" style={{ marginBottom: '4px' }}>
                          <span className="section-tag__dot" style={{ background: 'var(--rehab-green-deep)' }} aria-hidden="true" />
                          <span style={{ color: 'var(--rehab-green-deep)' }}>{localized.targetFocus}</span>
                        </div>
                        <h3 className="region-routine-card__title">
                          {localized.name}
                        </h3>
                        <p className="region-routine-card__desc">
                          {localized.description}
                        </p>
                        <div className="region-routine-card__meta">
                          <span>~{routine.estimatedDurationMin} min</span>
                          <span>·</span>
                          <span>{routine.stations.length} stations</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn--glass btn--md"
                        onClick={(e) => {
                          e.stopPropagation()
                          onClose()
                          if (onStartRoutine) onStartRoutine(routine)
                        }}
                      >
                        {t('regionModal.quickStart')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* 3. Upcoming & Roadmap Movements */}
          {upcomingExercises.length > 0 && (
            <section className="region-modal-section" aria-labelledby="upcoming-heading">
              <div className="region-modal-section__head">
                <h2 id="upcoming-heading" className="region-modal-section__title">
                  {t('regionModal.upcomingTitle')}
                </h2>
                <p className="region-modal-section__sub">
                  {t('regionModal.upcomingSub')}
                </p>
              </div>

              <div className="region-upcoming-list">
                {upcomingExercises.map((ex: ExerciseDefinition) => {
                  const localized = localizeExercise(ex, locale)

                  return (
                    <div key={ex.id} className="region-upcoming-card">
                      {ex.thumbnailUrl && (
                        <div className="region-upcoming-card__media">
                          <img
                            src={ex.thumbnailUrl}
                            alt=""
                            className="region-upcoming-card__img"
                            loading="lazy"
                          />
                          <span className="region-status-pill region-status-pill--upcoming region-upcoming-card__badge">
                            {t('anatomy.upcomingBadge')}
                          </span>
                        </div>
                      )}
                      <div className="region-upcoming-card__body">
                        <div className="region-upcoming-card__header">
                          <div>
                            <span className="region-upcoming-card__cat">
                              {localized.category}
                            </span>
                            <h4 className="region-upcoming-card__title">
                              {localized.name}
                            </h4>
                          </div>
                        </div>
                        <p className="region-upcoming-card__desc">
                          {localized.description}
                        </p>
                        <div className="region-upcoming-card__meta">
                          <span>{ex.targetAngleDeg}° target</span>
                          <span>·</span>
                          <span>
                            {ex.posture === 'standing'
                              ? t('lib.catStanding')
                              : ex.posture === 'seated'
                              ? t('lib.catSeated')
                              : t('lib.catSideLying')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="region-modal-footer">
          <button
            type="button"
            className="btn btn--quiet"
            onClick={onClose}
          >
            {t('settings.close')}
          </button>
          <button
            type="button"
            className="btn btn--glass"
            onClick={() => {
              onClose()
              onNavigateToLibrary()
            }}
          >
            {t('regionModal.exploreAll')} →
          </button>
        </div>
      </div>
    </div>
  )
}
