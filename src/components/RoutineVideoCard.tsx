import type { RehabRoutine } from '../domain/routineCatalog'

interface RoutineVideoCardProps {
  routine: RehabRoutine
  onSelect: (routine: RehabRoutine) => void
}

export function RoutineVideoCard({ routine, onSelect }: RoutineVideoCardProps) {
  return (
    <div
      className="routine-card-video"
      onClick={() => onSelect(routine)}
      role="button"
      tabIndex={0}
      aria-label={`查看 ${routine.nameZh} 課表詳情`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(routine)
        }
      }}
    >
      {/* 16:9 Thumbnail with Playlist Overlay Effect */}
      <div className="routine-card-video__thumb-wrap">
        <img
          src={routine.thumbnailUrl}
          alt={routine.nameZh}
          className="routine-card-video__thumb"
          loading="lazy"
        />

        {/* Playlist Stack Overlay Banner */}
        <div className="routine-card-video__stack-overlay">
          <div className="routine-stack-badge">
            <span aria-hidden="true">📑</span>
            <span>{routine.stations.length} 項連續動作</span>
          </div>
        </div>

        {/* Duration Badge */}
        <div className="routine-card-video__bottom-badge">
          <span className="video-badge video-badge--duration">
            ⏳ 約 {routine.estimatedDurationMin} 分鐘
          </span>
          <span className={`video-badge ${routine.isCustom ? 'video-badge--status-active' : 'video-badge--routine-tag'}`}>
            {routine.isCustom ? '醫師自訂處方' : '處方菜單'}
          </span>
        </div>
      </div>

      {/* Routine Info */}
      <div className="routine-card-video__info">
        <div className="routine-card-video__tag-row">
          <span className="routine-card-video__tag" style={routine.isCustom ? { color: 'var(--rehab-blue-deep)' } : undefined}>
            {routine.isCustom ? '🩺 醫師客製課表' : '複合式處方課表'}
          </span>
          <span className="routine-card-video__focus">{routine.targetFocusZh}</span>
        </div>

        <h3 className="routine-card-video__title">{routine.nameZh}</h3>
        <p className="routine-card-video__subtitle">{routine.subtitleZh}</p>
        <p className="routine-card-video__desc">{routine.descriptionZh}</p>

        <div className="routine-card-video__footer">
          <span className="routine-card-video__cta-hint">
            點擊查看課表流程與開始訓練 ›
          </span>
        </div>
      </div>
    </div>
  )
}
