import { useEffect, useRef } from 'react'
import { localizeExercise, type ExerciseDefinition } from '../domain/exerciseCatalog'
import type { UserSettings } from '../domain/rehabTypes'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { assetUrl } from '../domain/assets'
import { useT } from '../i18n/LocaleContext'

interface ExerciseDetailModalProps {
  exercise: ExerciseDefinition
  settings: UserSettings
  onStart: (exerciseId: string) => void
  onClose: () => void
}

export function ExerciseDetailModal({
  exercise,
  settings,
  onStart,
  onClose,
}: ExerciseDetailModalProps) {
  const { t, locale } = useT()
  const ex = localizeExercise(exercise, locale)
  const modalRef = useRef<HTMLDivElement>(null)
  const isPrescribed = exercise.status === 'prescribed'

  useBodyScrollLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    modalRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={modalRef}
        className="sheet sheet--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-detail-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <div className="sheet__head">
          <div>
            <div className="section-tag">
              <span className="section-tag__dot" aria-hidden="true" />
              <span>{ex.category} · {ex.targetLimb}</span>
            </div>
            <h2 className="sheet__title" id="exercise-detail-title">
              {ex.name}
            </h2>
          </div>
          <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label={t('detail.close')}>
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

        {/* Diagram Banner */}
        {exercise.diagramUrl && (
          <div className="exercise-detail-diagram-wrap">
            <img
              src={assetUrl(exercise.diagramUrl)}
              alt={t('detail.diagramAlt', { name: ex.name })}
              className="exercise-detail-diagram-img"
            />
          </div>
        )}

        {/* Specs Grid */}
        <div className="routine-card__specs">
          <span className="spec-pill">
            <span className="spec-pill__label">{t('spec.targetAngle')}</span>
            <span className="spec-pill__val">{settings.targetAngleDeg}°</span>
          </span>
          <span className="spec-pill">
            <span className="spec-pill__label">{t('spec.topHold')}</span>
            <span className="spec-pill__val">{t('spec.secondsValue', { n: settings.holdDurationS.toFixed(1) })}</span>
          </span>
          <span className="spec-pill">
            <span className="spec-pill__label">{t('spec.riseFall')}</span>
            <span className="spec-pill__val">
              {settings.concentricCadenceS}s / {settings.eccentricCadenceS}s
            </span>
          </span>
          <span className="spec-pill">
            <span className="spec-pill__label">{t('spec.prescribedReps')}</span>
            <span className="spec-pill__val">{t('fmt.reps', { n: settings.targetReps })}</span>
          </span>
        </div>

        {/* Description & Framing Hint */}
        <div className="exercise-detail-section">
          <h3 className="exercise-detail-section__title">{t('detail.executeTitle')}</h3>
          <p className="exercise-detail-section__desc">{ex.description}</p>
          <div className="framing-hint-box">
            <span className="framing-hint-box__icon" aria-hidden="true">📷</span>
            <span>{t('detail.framing', { hint: ex.framingHint })}</span>
          </div>
        </div>

        {/* Tips & Safety */}
        <div className="routine-card__reminders">
          <h4 className="routine-card__reminders-title">{t('card.tipsSafetyTitle')}</h4>
          <ul className="routine-card__reminders-list">
            {ex.tips.map((tip, idx) => (
              <li key={idx} className="routine-card__reminders-item">
                <span className="routine-card__reminders-dot">•</span>
                <span>{tip}</span>
              </li>
            ))}
            <li className="routine-card__reminders-item">
              <span className="routine-card__reminders-dot">•</span>
              <span>{t('card.tempoReminder')}</span>
            </li>
            <li className="routine-card__reminders-item routine-card__reminders-item--warn">
              <span className="routine-card__reminders-dot">⚠️</span>
              <span>{t('card.safetyReminder')}</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="sheet__actions" style={{ marginTop: 'var(--s-4)' }}>
          <button className="btn btn--glass" onClick={onClose}>
            {t('detail.backLibrary')}
          </button>
          {isPrescribed ? (
            <button
              className="btn btn--primary btn--lg"
              style={{ flex: 1 }}
              onClick={() => {
                onClose()
                onStart(exercise.id)
              }}
            >
              {t('detail.start')}
            </button>
          ) : (
            <button className="btn btn--glass btn--lg" disabled style={{ flex: 1, opacity: 0.6 }}>
              {t('detail.upcomingDisabled')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
