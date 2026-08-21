import { useEffect, useRef } from 'react'
import type { ExerciseDefinition } from '../domain/exerciseCatalog'
import type { UserSettings } from '../domain/rehabTypes'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface ExerciseDetailModalProps {
  exercise: ExerciseDefinition
  settings: UserSettings
  onStart: (exerciseId: string) => void
  onClose: () => void
}

export function ExerciseDetailModal({
  exercise,
  settings,
  onStart,
  onClose,
}: ExerciseDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const isPrescribed = exercise.status === 'prescribed'

  useBodyScrollLock()

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
        aria-labelledby="exercise-detail-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <div className="sheet__head">
          <div>
            <div className="section-tag">
              <span className="section-tag__dot" aria-hidden="true" />
              <span>{exercise.category} · {exercise.targetLimb}</span>
            </div>
            <h2 className="sheet__title" id="exercise-detail-title">
              {exercise.nameZh}
            </h2>
          </div>
          <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label="關閉詳情">
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

        {/* Diagram Banner */}
        {exercise.diagramUrl && (
          <div className="exercise-detail-diagram-wrap">
            <img
              src={exercise.diagramUrl}
              alt={`${exercise.nameZh} 動作分解圖示`}
              className="exercise-detail-diagram-img"
            />
          </div>
        )}

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

        {/* Description & Framing Hint */}
        <div className="exercise-detail-section">
          <h3 className="exercise-detail-section__title">動作執行說明</h3>
          <p className="exercise-detail-section__desc">{exercise.descriptionZh}</p>
          <div className="framing-hint-box">
            <span className="framing-hint-box__icon" aria-hidden="true">📷</span>
            <span>鏡頭取景提醒：{exercise.framingHintZh}</span>
          </div>
        </div>

        {/* Tips & Safety */}
        <div className="routine-card__reminders">
          <h4 className="routine-card__reminders-title">💡 動作要點與安全防護</h4>
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

        {/* Actions */}
        <div className="sheet__actions" style={{ marginTop: 'var(--s-4)' }}>
          <button className="btn btn--glass" onClick={onClose}>
            返回動作庫
          </button>
          {isPrescribed ? (
            <button
              className="btn btn--primary btn--lg"
              style={{ flex: 1 }}
              onClick={() => {
                onClose()
                onStart(exercise.id)
              }}
            >
              開始此動作訓練
            </button>
          ) : (
            <button className="btn btn--glass btn--lg" disabled style={{ flex: 1, opacity: 0.6 }}>
              臨床規範編制中（即將推出）
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
