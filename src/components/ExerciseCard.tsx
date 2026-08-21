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
      {/* Top Header Row */}
      <div className="routine-card__header">
        <div className="routine-card__info">
          <p className="routine-card__tag">今日處方 · {exercise.targetLimb}</p>
          <h2 className="routine-card__name">{exercise.nameZh}</h2>
          <p className="routine-card__desc">{exercise.descriptionZh}</p>
        </div>

        <button className="btn btn--primary btn--lg routine-card__cta" onClick={onStart}>
          開始訓練
        </button>
      </div>

      {/* Target Specs Row */}
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

      {/* Full-Width Visual Diagram */}
      {exercise.diagramUrl && (
        <div className="routine-card__diagram-wrapper">
          <img
            src={exercise.diagramUrl}
            alt={`${exercise.nameZh} 復健動作分解圖`}
            className="routine-card__diagram-img"
          />
        </div>
      )}

      {/* Dedicated Training Reminders & Safety Box */}
      <div className="routine-card__reminders">
        <h3 className="routine-card__reminders-title">💡 訓練提醒與動作要點</h3>
        <ul className="routine-card__reminders-list">
          {exercise.tipsZh.map((tip, idx) => (
            <li key={idx} className="routine-card__reminders-item">
              <span className="routine-card__reminders-dot">•</span>
              <span>{tip}</span>
            </li>
          ))}
          <li className="routine-card__reminders-item">
            <span className="routine-card__reminders-dot">•</span>
            <span>節奏控制：嚴格維持 5 秒平穩舉起、5 秒頂點穩定停頓、5 秒緩慢下放，每完成 1 次自動休息 3 秒。</span>
          </li>
          <li className="routine-card__reminders-item routine-card__reminders-item--warn">
            <span className="routine-card__reminders-dot">⚠️</span>
            <span>安全防護：若在抬起過程感到肩膀關節劇痛或明顯不適，請立即停止下放，切勿勉強。</span>
          </li>
        </ul>
      </div>
    </section>
  )
}
