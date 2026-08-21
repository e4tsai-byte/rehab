import { EXERCISE_CATALOG, localizeExercise } from '../domain/exerciseCatalog'
import type { UserSettings } from '../domain/rehabTypes'
import { useT } from '../i18n/LocaleContext'

interface ExerciseLauncherCardProps {
  currentExerciseId: string
  settings: UserSettings
  onOpenPicker: () => void
  onQuickStart: () => void
}

export function ExerciseLauncherCard({
  currentExerciseId,
  settings,
  onOpenPicker,
  onQuickStart,
}: ExerciseLauncherCardProps) {
  const { t, locale } = useT()
  const currentExercise =
    EXERCISE_CATALOG.find((e) => e.id === currentExerciseId) ?? EXERCISE_CATALOG[0]!
  const current = localizeExercise(currentExercise, locale)

  return (
    <section className="exercise-launcher" aria-label={t('launcher.aria')}>
      <div className="exercise-launcher__main">
        <div className="exercise-launcher__badge-row">
          <span className="exercise-launcher__tag">
            <span className="exercise-launcher__tag-dot" aria-hidden="true" />
            <span>{t('launcher.tag')}</span>
          </span>
          <span className="exercise-launcher__current-pill">
            <span aria-hidden="true">{currentExercise.posture === 'standing' ? '🧍' : '🪑'}</span>
            <span>{current.name}</span>
          </span>
        </div>

        <h2 className="exercise-launcher__title">{t('launcher.title')}</h2>
        <p className="exercise-launcher__desc">{t('launcher.desc')}</p>

        {/* Specs Pills */}
        <div className="exercise-launcher__specs">
          <div className="launcher-spec">
            <span className="launcher-spec__label">{t('launcher.specTargetAngle')}</span>
            <span className="launcher-spec__val">{settings.targetAngleDeg}°</span>
          </div>
          <div className="launcher-spec">
            <span className="launcher-spec__label">{t('launcher.specTopHold')}</span>
            <span className="launcher-spec__val">{t('spec.secondsValue', { n: settings.holdDurationS.toFixed(1) })}</span>
          </div>
          <div className="launcher-spec">
            <span className="launcher-spec__label">{t('launcher.specTempo')}</span>
            <span className="launcher-spec__val">
              {settings.concentricCadenceS}s / {settings.eccentricCadenceS}s
            </span>
          </div>
          <div className="launcher-spec">
            <span className="launcher-spec__label">{t('launcher.specSets')}</span>
            <span className="launcher-spec__val">{t('fmt.reps', { n: settings.targetReps })}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="exercise-launcher__actions">
        <button
          className="btn btn--glass exercise-launcher__picker-btn"
          onClick={onOpenPicker}
          aria-label={t('launcher.pickerAria')}
        >
          <span>{t('launcher.pickerBtn')}</span>
        </button>
        <button
          className="btn btn--primary btn--lg exercise-launcher__start-btn"
          onClick={onQuickStart}
        >
          {t('card.start')}
        </button>
      </div>
    </section>
  )
}
