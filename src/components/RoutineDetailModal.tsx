import { useEffect, useRef } from 'react'
import { localizeRoutine, type RehabRoutine } from '../domain/routineCatalog'
import { EXERCISE_CATALOG, localizeExercise } from '../domain/exerciseCatalog'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { assetUrl } from '../domain/assets'
import { useT } from '../i18n/LocaleContext'

interface RoutineDetailModalProps {
  routine: RehabRoutine
  onStartRoutine: (routine: RehabRoutine) => void
  onEditRoutine?: (routine: RehabRoutine) => void
  onDeleteRoutine?: (routineId: string) => void
  onClose: () => void
}

export function RoutineDetailModal({
  routine,
  onStartRoutine,
  onEditRoutine,
  onDeleteRoutine,
  onClose,
}: RoutineDetailModalProps) {
  const { t, locale } = useT()
  const r = localizeRoutine(routine, locale)
  const modalRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    modalRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleDelete() {
    if (window.confirm(t('rdetail.confirmDelete', { name: r.name }))) {
      if (onDeleteRoutine) {
        onDeleteRoutine(routine.id)
      }
      onClose()
    }
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={modalRef}
        className="sheet sheet--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="routine-detail-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <div className="sheet__head">
          <div>
            <div className="section-tag">
              <span className="section-tag__dot" style={{ background: 'var(--rehab-green-deep)' }} aria-hidden="true" />
              <span style={{ color: 'var(--rehab-green-deep)' }}>
                {routine.isCustom ? t('rdetail.customLabel') : t('rdetail.compoundLabel')} · {t('rdetail.minutes', { n: routine.estimatedDurationMin })}
              </span>
            </div>
            <h2 className="sheet__title" id="routine-detail-title">
              {r.name}
            </h2>
            <p className="sheet__sub" style={{ margin: '4px 0 0', color: 'var(--rehab-ink-secondary)', fontSize: 'var(--t-sm)' }}>
              {r.subtitle}
            </p>
          </div>
          <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label={t('rdetail.close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Thumbnail Preview Banner */}
        {routine.thumbnailUrl && (
          <div className="exercise-detail-diagram-wrap" style={{ maxHeight: '360px' }}>
            <img
              src={assetUrl(routine.thumbnailUrl)}
              alt={r.name}
              className="exercise-detail-diagram-img"
              style={{ maxHeight: '340px' }}
            />
          </div>
        )}

        {/* Focus Highlight Box */}
        <div className="routine-focus-box">
          <span className="routine-focus-box__label">{t('rdetail.focus')}</span>
          <span className="routine-focus-box__val">{r.targetFocus}</span>
        </div>

        {/* Description */}
        <p className="exercise-detail-section__desc">{r.description}</p>

        {/* Stations Breakdown */}
        <div className="routine-stations-section">
          <h3 className="routine-stations-section__title">{t('rdetail.flowTitle')}</h3>
          <div className="routine-stations-list">
            {routine.stations.map((station, idx) => {
              const exercise = EXERCISE_CATALOG.find((e) => e.id === station.exerciseId)
              if (!exercise) return null
              const ex = localizeExercise(exercise, locale)

              return (
                <div key={idx} className="routine-station-item">
                  <div className="routine-station-item__main">
                    <span className="routine-station-item__num">{idx + 1}</span>
                    <div className="routine-station-item__info">
                      <div className="routine-station-item__name-row">
                        <h4 className="routine-station-item__name">{ex.name}</h4>
                        <span className="routine-station-item__reps-tag">{t('rdetail.repsTag', { n: station.targetReps })}</span>
                      </div>
                      <p className="routine-station-item__desc">{ex.category}</p>
                    </div>
                  </div>

                  {station.restAfterS > 0 && (
                    <div className="routine-intermission-banner">
                      <span className="routine-intermission-banner__icon">☕</span>
                      <span>{t('rdetail.rest', { s: station.restAfterS })}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Clinical Note */}
        <div className="routine-card__reminders">
          <h4 className="routine-card__reminders-title">{t('rdetail.clinicalTitle')}</h4>
          <p style={{ margin: 0, fontSize: 'var(--t-xs)', color: 'var(--rehab-ink-secondary)', lineHeight: 1.5 }}>
            {t('rdetail.clinicalBody')}
          </p>
        </div>

        {/* Actions */}
        <div className="sheet__actions" style={{ marginTop: 'var(--s-4)', display: 'flex', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
          {onDeleteRoutine && (
            <button
              className="btn btn--quiet btn--sm"
              style={{ color: 'var(--rehab-red-deep)', padding: '0 var(--s-3)' }}
              onClick={handleDelete}
            >
              {t('rdetail.delete')}
            </button>
          )}

          {onEditRoutine && (
            <button
              className="btn btn--glass"
              onClick={() => {
                onClose()
                onEditRoutine(routine)
              }}
            >
              {t('rdetail.edit')}
            </button>
          )}

          <button
            className="btn btn--primary btn--lg"
            style={{ flex: 1, minWidth: '180px' }}
            onClick={() => {
              onClose()
              onStartRoutine(routine)
            }}
          >
            {t('rdetail.startAll')}
          </button>
        </div>
      </div>
    </div>
  )
}
