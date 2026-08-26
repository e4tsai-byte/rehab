import { localizeRoutine, type RehabRoutine } from '../domain/routineCatalog'
import { assetUrl } from '../domain/assets'
import { useT } from '../i18n/LocaleContext'

interface RoutineVideoCardProps {
  routine: RehabRoutine
  onSelect: (routine: RehabRoutine) => void
}

export function RoutineVideoCard({ routine, onSelect }: RoutineVideoCardProps) {
  const { t, locale } = useT()
  const r = localizeRoutine(routine, locale)

  return (
    <div
      className="routine-card-video"
      onClick={() => onSelect(routine)}
      role="button"
      tabIndex={0}
      aria-label={t('rcard.aria', { name: r.name })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(routine)
        }
      }}
    >
      {/* 16:9 Thumbnail with Playlist Overlay Effect */}
      <div className="routine-card-video__thumb-wrap">
        <img
          src={assetUrl(routine.thumbnailUrl)}
          alt={r.name}
          className="routine-card-video__thumb"
          loading="lazy"
        />

        {/* Playlist Stack Overlay Banner */}
        <div className="routine-card-video__stack-overlay">
          <div className="routine-stack-badge">
            <span>{t('rcard.stations', { n: routine.stations.length })}</span>
          </div>
        </div>

        {/* Duration Badge */}
        <div className="routine-card-video__bottom-badge">
          <span className="video-badge video-badge--duration">
            {t('rcard.durationBadge', { n: routine.estimatedDurationMin })}
          </span>
          <span className={`video-badge ${routine.isCustom ? 'video-badge--status-active' : 'video-badge--routine-tag'}`}>
            {routine.isCustom ? t('rcard.customBadge') : t('rcard.presetBadge')}
          </span>
        </div>
      </div>

      {/* Routine Info */}
      <div className="routine-card-video__info">
        <div className="routine-card-video__tag-row">
          <span className="routine-card-video__tag" style={routine.isCustom ? { color: 'var(--rehab-blue-deep)' } : undefined}>
            {routine.isCustom ? t('rcard.customTag') : t('rcard.presetTag')}
          </span>
          <span className="routine-card-video__focus">{r.targetFocus}</span>
        </div>

        <h3 className="routine-card-video__title">{r.name}</h3>
        <p className="routine-card-video__subtitle">{r.subtitle}</p>
        <p className="routine-card-video__desc">{r.description}</p>

        <div className="routine-card-video__footer">
          <span className="routine-card-video__cta-hint">{t('rcard.viewFlow')}</span>
        </div>
      </div>
    </div>
  )
}
