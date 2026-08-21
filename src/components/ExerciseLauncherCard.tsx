import { EXERCISE_CATALOG } from '../domain/exerciseCatalog'
import type { UserSettings } from '../domain/rehabTypes'

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
  const currentExercise =
    EXERCISE_CATALOG.find((e) => e.id === currentExerciseId) ?? EXERCISE_CATALOG[0]!

  return (
    <section className="exercise-launcher" aria-label="今日復健處方訓練">
      <div className="exercise-launcher__main">
        <div className="exercise-launcher__badge-row">
          <span className="exercise-launcher__tag">
            <span className="exercise-launcher__tag-dot" aria-hidden="true" />
            <span>今日處方訓練</span>
          </span>
          <span className="exercise-launcher__current-pill">
            <span aria-hidden="true">{currentExercise.posture === 'standing' ? '🧍' : '🪑'}</span>
            <span>{currentExercise.nameZh}</span>
          </span>
        </div>

        <h2 className="exercise-launcher__title">肩關節角度與節奏自主訓練</h2>
        <p className="exercise-launcher__desc">
          嚴格維持 5 秒平穩抬升、5 秒頂點等長停頓、5 秒控制下放。即時偵測角度與防範聳肩代償。
        </p>

        {/* Specs Pills */}
        <div className="exercise-launcher__specs">
          <div className="launcher-spec">
            <span className="launcher-spec__label">目標角度</span>
            <span className="launcher-spec__val">{settings.targetAngleDeg}°</span>
          </div>
          <div className="launcher-spec">
            <span className="launcher-spec__label">頂點停頓</span>
            <span className="launcher-spec__val">{settings.holdDurationS.toFixed(1)} 秒</span>
          </div>
          <div className="launcher-spec">
            <span className="launcher-spec__label">升降節奏</span>
            <span className="launcher-spec__val">
              {settings.concentricCadenceS}s / {settings.eccentricCadenceS}s
            </span>
          </div>
          <div className="launcher-spec">
            <span className="launcher-spec__label">處方組次</span>
            <span className="launcher-spec__val">{settings.targetReps} 次</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="exercise-launcher__actions">
        <button
          className="btn btn--glass exercise-launcher__picker-btn"
          onClick={onOpenPicker}
          aria-label="更換訓練動作與查看分解圖"
        >
          <span>更換動作 / 查看要點 ▾</span>
        </button>
        <button
          className="btn btn--primary btn--lg exercise-launcher__start-btn"
          onClick={onQuickStart}
        >
          開始訓練
        </button>
      </div>
    </section>
  )
}
