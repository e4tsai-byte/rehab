import type { ExerciseDefinition } from '../domain/exerciseCatalog'
import type { UserSettings } from '../domain/rehabTypes'

interface ExerciseCardProps {
  exercise: ExerciseDefinition
  settings: UserSettings
  onStart: () => void
}

export function ExerciseCard({ exercise, settings, onStart }: ExerciseCardProps) {
  return (
    <section className="routine-card">
      <div>
        <p className="routine-card__tag">今日處方 · {exercise.targetLimb}</p>
        <h2 className="routine-card__name">{exercise.nameZh}</h2>
        <p className="routine-card__desc">{exercise.descriptionZh}</p>

        <div className="routine-card__specs">
          <span className="spec-pill">
            <span className="spec-pill__label">目標角度</span>
            <span className="spec-pill__val">{settings.targetAngleDeg}°</span>
          </span>
          <span className="spec-pill">
            <span className="spec-pill__label">頂點停頓</span>
            <span className="spec-pill__val">{settings.holdDurationS.toFixed(1)} 秒</span>
          </span>
          <span className="spec-pill">
            <span className="spec-pill__label">上升 / 下放</span>
            <span className="spec-pill__val">
              {settings.concentricCadenceS}s / {settings.eccentricCadenceS}s
            </span>
          </span>
          <span className="spec-pill">
            <span className="spec-pill__label">處方次數</span>
            <span className="spec-pill__val">{settings.targetReps} 次</span>
          </span>
        </div>
      </div>

      <button className="btn btn--primary btn--lg routine-card__cta" onClick={onStart}>
        開始訓練
      </button>
    </section>
  )
}
