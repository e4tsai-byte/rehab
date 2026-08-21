import type { ExerciseDefinition } from '../domain/exerciseCatalog'
import type { UserSettings } from '../domain/rehabTypes'

interface ExerciseCardProps {
  exercise: ExerciseDefinition
  settings: UserSettings
  onStart: () => void
}

export function ExerciseCard({ exercise, settings, onStart }: ExerciseCardProps) {
  return (
    <div className="routine-card">
      <div className="routine-card__left">
        <div className="routine-card__tag">今日處方訓練 • {exercise.targetLimb}</div>
        <h2 className="routine-card__name">{exercise.nameZh}</h2>
        <p className="routine-card__desc">{exercise.descriptionZh}</p>

        <div className="routine-card__specs">
          <div className="spec-pill">
            <span className="spec-pill__label">目標角度</span>
            <span className="spec-pill__val">{settings.targetAngleDeg}° (水平)</span>
          </div>
          <div className="spec-pill">
            <span className="spec-pill__label">頂點停頓</span>
            <span className="spec-pill__val">{settings.holdDurationS.toFixed(1)} 秒</span>
          </div>
          <div className="spec-pill">
            <span className="spec-pill__label">上升 / 下放節奏</span>
            <span className="spec-pill__val">{settings.concentricCadenceS}s / {settings.eccentricCadenceS}s</span>
          </div>
          <div className="spec-pill">
            <span className="spec-pill__label">處方組數</span>
            <span className="spec-pill__val">{settings.targetReps} 次 / 組</span>
          </div>
        </div>
      </div>

      <button className="routine-card__cta" onClick={onStart}>
        <span>開始訓練</span>
        <span>→</span>
      </button>
    </div>
  )
}
