import { localizeExercise, type ExerciseDefinition } from '../domain/exerciseCatalog'
import type { UserSettings } from '../domain/rehabTypes'
import { assetUrl } from '../domain/assets'
import { useT } from '../i18n/LocaleContext'

interface ExerciseCardProps {
  exercise: ExerciseDefinition
  settings: UserSettings
  onStart: () => void
}

export function ExerciseCard({ exercise, settings, onStart }: ExerciseCardProps) {
  const { t, locale } = useT()
  const ex = localizeExercise(exercise, locale)

  return (
    <section className="routine-card">
      {/* Top Header Row */}
      <div className="routine-card__header">
        <div className="routine-card__info">
          <p className="routine-card__tag">{t('card.todayPrescription')} · {ex.targetLimb}</p>
          <h2 className="routine-card__name">{ex.name}</h2>
          <p className="routine-card__desc">{ex.description}</p>
        </div>

        <button className="btn btn--primary btn--lg routine-card__cta" onClick={onStart}>
          {t('card.start')}
        </button>
      </div>

      {/* Target Specs Row */}
      <div className="routine-card__specs">
        {exercise.trackingModel === 'isometricHold' ? (
          <>
            <span className="spec-pill">
              <span className="spec-pill__label">{t('spec.targetAngle')}</span>
              <span className="spec-pill__val">{t('spec.holdAngleRange')}</span>
            </span>
            <span className="spec-pill">
              <span className="spec-pill__label">{t('spec.holdDuration')}</span>
              <span className="spec-pill__val">
                {t('spec.secondsValue', { n: String(exercise.holdDurationS ?? 20) })}
              </span>
            </span>
            <span className="spec-pill">
              <span className="spec-pill__label">{t('spec.prescribedReps')}</span>
              <span className="spec-pill__val">{t('fmt.reps', { n: exercise.targetReps ?? 5 })}</span>
            </span>
            {exercise.dailySessionTarget ? (
              <span className="spec-pill">
                <span className="spec-pill__label">{t('spec.dailyTarget')}</span>
                <span className="spec-pill__val">
                  {t('spec.dailyTargetValue', { n: exercise.dailySessionTarget })}
                </span>
              </span>
            ) : (
              <span className="spec-pill">
                <span className="spec-pill__label">{t('spec.holdMode')}</span>
                <span className="spec-pill__val">{t('spec.holdModeValue')}</span>
              </span>
            )}
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Full-Width Visual Diagram */}
      {exercise.diagramUrl && (
        <div className="routine-card__diagram-wrapper">
          <img
            src={assetUrl(exercise.diagramUrl)}
            alt={t('card.diagramAlt', { name: ex.name })}
            className="routine-card__diagram-img"
          />
        </div>
      )}

      {/* Dedicated Training Reminders & Safety Box */}
      <div className="routine-card__reminders">
        <h3 className="routine-card__reminders-title">{t('card.remindersTitle')}</h3>
        <ul className="routine-card__reminders-list">
          {ex.tips.map((tip, idx) => (
            <li key={idx} className="routine-card__reminders-item">
              <span className="routine-card__reminders-dot">•</span>
              <span>{tip}</span>
            </li>
          ))}
          <li className="routine-card__reminders-item">
            <span className="routine-card__reminders-dot">•</span>
            <span>
              {exercise.trackingModel === 'isometricHold'
                ? t('card.holdTempoReminder')
                : t('card.tempoReminder')}
            </span>
          </li>
          <li className="routine-card__reminders-item routine-card__reminders-item--warn">
            <span className="routine-card__reminders-dot">!</span>
            <span>{t('card.safetyReminder')}</span>
          </li>
        </ul>
      </div>
    </section>
  )
}
