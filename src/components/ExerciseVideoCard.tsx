import type { ExerciseDefinition } from '../domain/exerciseCatalog'

interface ExerciseVideoCardProps {
  exercise: ExerciseDefinition
  onSelect: (exercise: ExerciseDefinition) => void
}

export function ExerciseVideoCard({ exercise, onSelect }: ExerciseVideoCardProps) {
  const isPrescribed = exercise.status === 'prescribed'

  return (
    <div
      className={`video-card ${!isPrescribed ? 'video-card--upcoming' : ''}`}
      onClick={() => onSelect(exercise)}
      role="button"
      tabIndex={0}
      aria-label={`查看 ${exercise.nameZh} 動作詳情`}
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
            src={exercise.thumbnailUrl || exercise.diagramUrl}
            alt={`${exercise.nameZh} 訓練預覽`}
            className="video-card__thumb"
            loading="lazy"
          />
        ) : (
          <div className="video-card__thumb-placeholder">
            <span aria-hidden="true">{exercise.posture === 'standing' ? '🧍' : '🪑'}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="video-card__badges-top">
          <span className="video-badge video-badge--posture">
            <span aria-hidden="true">{exercise.posture === 'standing' ? '🧍' : '🪑'}</span>
            <span>{exercise.posture === 'standing' ? '站姿' : '坐姿桌前'}</span>
          </span>

          <span className="video-badge video-badge--angle">
            {exercise.targetAngleDeg}°
          </span>
        </div>

        {/* Bottom Cadence Badge */}
        <div className="video-card__badges-bottom">
          <span className="video-badge video-badge--cadence">
            ⏱️ {exercise.concentricCadenceS}s-{exercise.holdDurationS}s-{exercise.eccentricCadenceS}s
          </span>
          {isPrescribed ? (
            <span className="video-badge video-badge--status-active">今日處方</span>
          ) : (
            <span className="video-badge video-badge--status-upcoming">規劃中</span>
          )}
        </div>
      </div>

      {/* Card Info Body */}
      <div className="video-card__info">
        <div className="video-card__meta-top">
          <span className="video-card__category">{exercise.category}</span>
          <span className="video-card__limb">{exercise.targetLimb}</span>
        </div>

        <h3 className="video-card__title">{exercise.nameZh}</h3>
        <p className="video-card__desc">{exercise.descriptionZh}</p>

        <div className="video-card__action-row">
          <span className="video-card__cue">
            {isPrescribed ? '點擊查看動作分解與開始訓練 ›' : '臨床動作規範編制中 ›'}
          </span>
        </div>
      </div>
    </div>
  )
}
