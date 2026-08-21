import { useEffect, useRef, useState } from 'react'
import { EXERCISE_CATALOG, localizeExercise, type ExerciseDefinition } from '../domain/exerciseCatalog'
import type { UserSettings } from '../domain/rehabTypes'
import { assetUrl } from '../domain/assets'
import { useT } from '../i18n/LocaleContext'

interface ExercisePickerModalProps {
  currentExerciseId: string
  settings: UserSettings
  onSelectAndStart: (exerciseId: string) => void
  onClose: () => void
}

export function ExercisePickerModal({
  currentExerciseId,
  settings,
  onSelectAndStart,
  onClose,
}: ExercisePickerModalProps) {
  const { t, locale } = useT()
  const [selectedId, setSelectedId] = useState<string>(currentExerciseId)
  const modalRef = useRef<HTMLDivElement>(null)

  const selectedExercise: ExerciseDefinition =
    EXERCISE_CATALOG.find((e) => e.id === selectedId) ?? EXERCISE_CATALOG[0]!
  const selected = localizeExercise(selectedExercise, locale)

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
        aria-labelledby="exercise-picker-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <div className="sheet__head">
          <div>
            <span className="section-tag" style={{ marginBottom: '2px' }}>
              <span className="section-tag__dot" aria-hidden="true" />
              <span>{t('picker.tag')}</span>
            </span>
            <h2 className="sheet__title" id="exercise-picker-title">
              {t('picker.title')}
            </h2>
          </div>
          <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label={t('picker.close')}>
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

        {/* Posture Selection Tabs */}
        <div className="segmented" role="tablist" aria-label={t('picker.postureAria')} style={{ width: '100%' }}>
          {EXERCISE_CATALOG.map((ex) => (
            <button
              key={ex.id}
              role="tab"
              aria-selected={ex.id === selectedId}
              className="segmented__item"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setSelectedId(ex.id)}
            >
              <span aria-hidden="true">{ex.posture === 'standing' ? '🧍' : '🪑'}</span>
              <span>{localizeExercise(ex, locale).name}</span>
            </button>
          ))}
        </div>

        {/* Exercise Details Card */}
        <div className="exercise-picker-details">
          <div className="exercise-picker-details__header">
            <div>
              <p className="routine-card__tag">{t('card.todayPrescription')} · {selected.targetLimb}</p>
              <h3 className="exercise-picker-details__title">{selected.name}</h3>
              <p className="exercise-picker-details__desc">{selected.description}</p>
            </div>
          </div>

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

          {/* Full-Width Visual Diagram */}
          {selectedExercise.diagramUrl && (
            <div className="routine-card__diagram-wrapper">
              <img
                src={assetUrl(selectedExercise.diagramUrl)}
                alt={t('card.diagramAlt', { name: selected.name })}
                className="routine-card__diagram-img"
              />
            </div>
          )}

          {/* Reminders & Safety */}
          <div className="routine-card__reminders">
            <h4 className="routine-card__reminders-title">{t('card.tipsSafetyTitle')}</h4>
            <ul className="routine-card__reminders-list">
              {selected.tips.map((tip, idx) => (
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
        </div>

        {/* Modal Action CTA */}
        <div className="sheet__actions" style={{ marginTop: 'var(--s-4)' }}>
          <button className="btn btn--glass" onClick={onClose}>
            {t('picker.back')}
          </button>
          <button
            className="btn btn--primary btn--lg"
            style={{ flex: 1 }}
            onClick={() => onSelectAndStart(selectedExercise.id)}
          >
            {t('picker.startNamed', { name: selected.name })}
          </button>
        </div>
      </div>
    </div>
  )
}
