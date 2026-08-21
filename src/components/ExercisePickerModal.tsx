import { useEffect, useRef, useState } from 'react'
import { EXERCISE_CATALOG, type ExerciseDefinition } from '../domain/exerciseCatalog'
import type { UserSettings } from '../domain/rehabTypes'

interface ExercisePickerModalProps {
  currentExerciseId: string
  settings: UserSettings
  onSelectAndStart: (exerciseId: string) => void
  onClose: () => void
}

export function ExercisePickerModal({
  currentExerciseId,
  settings,
  onSelectAndStart,
  onClose,
}: ExercisePickerModalProps) {
  const [selectedId, setSelectedId] = useState<string>(currentExerciseId)
  const modalRef = useRef<HTMLDivElement>(null)

  const selectedExercise: ExerciseDefinition =
    EXERCISE_CATALOG.find((e) => e.id === selectedId) ?? EXERCISE_CATALOG[0]!

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    modalRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={modalRef}
        className="sheet sheet--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-picker-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <div className="sheet__head">
          <div>
            <span className="section-tag" style={{ marginBottom: '2px' }}>
              <span className="section-tag__dot" aria-hidden="true" />
              <span>處方動作庫</span>
            </span>
            <h2 className="sheet__title" id="exercise-picker-title">
              選擇復健訓練動作
            </h2>
          </div>
          <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label="關閉選單">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Posture Selection Tabs */}
        <div className="segmented" role="tablist" aria-label="選擇姿勢模式" style={{ width: '100%' }}>
          {EXERCISE_CATALOG.map((ex) => (
            <button
              key={ex.id}
              role="tab"
              aria-selected={ex.id === selectedId}
              className="segmented__item"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setSelectedId(ex.id)}
            >
              <span aria-hidden="true">{ex.posture === 'standing' ? '🧍' : '🪑'}</span>
              <span>{ex.nameZh}</span>
            </button>
          ))}
        </div>

        {/* Exercise Details Card */}
        <div className="exercise-picker-details">
          <div className="exercise-picker-details__header">
            <div>
              <p className="routine-card__tag">今日處方 · {selectedExercise.targetLimb}</p>
              <h3 className="exercise-picker-details__title">{selectedExercise.nameZh}</h3>
              <p className="exercise-picker-details__desc">{selectedExercise.descriptionZh}</p>
            </div>
          </div>

          {/* Specs Grid */}
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
          {selectedExercise.diagramUrl && (
            <div className="routine-card__diagram-wrapper">
              <img
                src={selectedExercise.diagramUrl}
                alt={`${selectedExercise.nameZh} 復健動作分解圖`}
                className="routine-card__diagram-img"
              />
            </div>
          )}

          {/* Reminders & Safety */}
          <div className="routine-card__reminders">
            <h4 className="routine-card__reminders-title">💡 動作要點與安全防護</h4>
            <ul className="routine-card__reminders-list">
              {selectedExercise.tipsZh.map((tip, idx) => (
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
        </div>

        {/* Modal Action CTA */}
        <div className="sheet__actions" style={{ marginTop: 'var(--s-4)' }}>
          <button className="btn btn--glass" onClick={onClose}>
            返回首頁
          </button>
          <button
            className="btn btn--primary btn--lg"
            style={{ flex: 1 }}
            onClick={() => onSelectAndStart(selectedExercise.id)}
          >
            開始 {selectedExercise.nameZh}
          </button>
        </div>
      </div>
    </div>
  )
}
