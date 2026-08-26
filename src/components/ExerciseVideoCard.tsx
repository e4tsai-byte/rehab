import { localizeExercise, type ExerciseDefinition } from '../domain/exerciseCatalog'
import { assetUrl } from '../domain/assets'
import { useT } from '../i18n/LocaleContext'

interface ExerciseVideoCardProps {
  exercise: ExerciseDefinition
  onSelect: (exercise: ExerciseDefinition) => void
  isInPlan?: boolean
}

export function ExerciseVideoCard({ exercise, onSelect, isInPlan }: ExerciseVideoCardProps) {
  const { t, locale } = useT()
  const ex = localizeExercise(exercise, locale)
  const isAvailable = exercise.status === 'available'

  return (
    <div
      className={`video-card ${!isAvailable ? 'video-card--upcoming' : ''}`}
      onClick={() => onSelect(exercise)}
      role="button"
      tabIndex={0}
      aria-label={t('vcard.aria', { name: ex.name })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(exercise)
        }
      }}
    >
      {/* 16:9 Thumbnail Image with Overlays */}
      <div className="video-card__thumb-wrap">
        {exercise.thumbnailUrl || exercise.diagramUrl ? (
          <img
            src={assetUrl(exercise.thumbnailUrl || exercise.diagramUrl)}
            alt={t('card.diagramAlt', { name: ex.name })}
            className="video-card__thumb"
            loading="lazy"
          />
        ) : (
          <div className="video-card__thumb-placeholder">
            <span className="section-tag__dot" aria-hidden="true" />
          </div>
        )}

        {/* Top Badges */}
        <div className="video-card__badges-top">
          <span className="video-badge video-badge--posture">
            <span>
              {exercise.posture === 'standing'
                ? t('posture.standingShort')
                : exercise.posture === 'seated'
                  ? t('posture.seatedShort')
                  : t('posture.sideLyingShort')}
            </span>
          </span>

          {isInPlan && (
            <span className="video-badge video-badge--in-plan">
              {t('rx.inPlanBadge')}
            </span>
          )}

          <span className="video-badge video-badge--angle">
            {exercise.trackingModel === 'isometricHold' ? '10°–15°' : `${exercise.targetAngleDeg}°`}
          </span>
        </div>

        {/* Bottom Cadence Badge */}
        <div className="video-card__badges-bottom">
          <span className="video-badge video-badge--cadence">
            {exercise.trackingModel === 'isometricHold'
              ? `${t('vcard.holdBadge', { n: String(exercise.holdDurationS ?? 20) })}`
              : `${exercise.concentricCadenceS}s-${exercise.holdDurationS}s-${exercise.eccentricCadenceS}s`}
          </span>
          {isAvailable ? (
            <span className="video-badge video-badge--status-active">{t('vcard.availableBadge')}</span>
          ) : (
            <span className="video-badge video-badge--status-upcoming">{t('vcard.upcomingBadge')}</span>
          )}
        </div>
      </div>

      {/* Card Info Body */}
      <div className="video-card__info">
        <div className="video-card__meta-top">
          <span className="video-card__category">{ex.category}</span>
          <span className="video-card__limb">{ex.targetLimb}</span>
        </div>

        <h3 className="video-card__title">{ex.name}</h3>
        <p className="video-card__desc">{ex.description}</p>

        <div className="video-card__action-row">
          <span className="video-card__cue">
            {isAvailable ? t('vcard.viewStart') : t('vcard.upcomingCue')}
          </span>
        </div>
      </div>
    </div>
  )
}
