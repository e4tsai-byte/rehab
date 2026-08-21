import { useEffect, useRef } from 'react'
import type { RehabRoutine } from '../domain/routineCatalog'
import { EXERCISE_CATALOG } from '../domain/exerciseCatalog'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface RoutineDetailModalProps {
  routine: RehabRoutine
  onStartRoutine: (routine: RehabRoutine) => void
  onEditRoutine?: (routine: RehabRoutine) => void
  onDeleteRoutine?: (routineId: string) => void
  onClose: () => void
}

export function RoutineDetailModal({
  routine,
  onStartRoutine,
  onEditRoutine,
  onDeleteRoutine,
  onClose,
}: RoutineDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    modalRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleDelete() {
    if (window.confirm(`確定要刪除「${routine.nameZh}」這組處方課表嗎？`)) {
      if (onDeleteRoutine) {
        onDeleteRoutine(routine.id)
      }
      onClose()
    }
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={modalRef}
        className="sheet sheet--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="routine-detail-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <div className="sheet__head">
          <div>
            <div className="section-tag">
              <span className="section-tag__dot" style={{ background: 'var(--rehab-green-deep)' }} aria-hidden="true" />
              <span style={{ color: 'var(--rehab-green-deep)' }}>
                {routine.isCustom ? '🩺 醫師客製處方課表' : '複合處方課表'} · {routine.estimatedDurationMin} 分鐘
              </span>
            </div>
            <h2 className="sheet__title" id="routine-detail-title">
              {routine.nameZh}
            </h2>
            <p className="sheet__sub" style={{ margin: '4px 0 0', color: 'var(--rehab-ink-secondary)', fontSize: 'var(--t-sm)' }}>
              {routine.subtitleZh}
            </p>
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

        {/* Thumbnail Preview Banner */}
        {routine.thumbnailUrl && (
          <div className="exercise-detail-diagram-wrap" style={{ maxHeight: '360px' }}>
            <img
              src={routine.thumbnailUrl}
              alt={routine.nameZh}
              className="exercise-detail-diagram-img"
              style={{ maxHeight: '340px' }}
            />
          </div>
        )}

        {/* Focus Highlight Box */}
        <div className="routine-focus-box">
          <span className="routine-focus-box__label">🎯 訓練焦點：</span>
          <span className="routine-focus-box__val">{routine.targetFocusZh}</span>
        </div>

        {/* Description */}
        <p className="exercise-detail-section__desc">{routine.descriptionZh}</p>

        {/* Stations Breakdown */}
        <div className="routine-stations-section">
          <h3 className="routine-stations-section__title">課表流程與動作站點</h3>
          <div className="routine-stations-list">
            {routine.stations.map((station, idx) => {
              const exercise = EXERCISE_CATALOG.find((e) => e.id === station.exerciseId)
              if (!exercise) return null

              return (
                <div key={idx} className="routine-station-item">
                  <div className="routine-station-item__main">
                    <span className="routine-station-item__num">{idx + 1}</span>
                    <div className="routine-station-item__info">
                      <div className="routine-station-item__name-row">
                        <h4 className="routine-station-item__name">{exercise.nameZh}</h4>
                        <span className="routine-station-item__reps-tag">{station.targetReps} 次處方</span>
                      </div>
                      <p className="routine-station-item__desc">{exercise.category}</p>
                    </div>
                  </div>

                  {station.restAfterS > 0 && (
                    <div className="routine-intermission-banner">
                      <span className="routine-intermission-banner__icon">☕</span>
                      <span>中場主動肌腱修復休息：{station.restAfterS} 秒（預防旋轉肌群疲勞）</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Clinical Note */}
        <div className="routine-card__reminders">
          <h4 className="routine-card__reminders-title">🩺 臨床處方建議</h4>
          <p style={{ margin: 0, fontSize: 'var(--t-xs)', color: 'var(--rehab-ink-secondary)', lineHeight: 1.5 }}>
            本課表依循先站姿整體動態穩定、後坐姿局部隔離之運動醫學原則。每站動作皆具備即時角度與代償監測。
          </p>
        </div>

        {/* Actions */}
        <div className="sheet__actions" style={{ marginTop: 'var(--s-4)', display: 'flex', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
          {onDeleteRoutine && (
            <button
              className="btn btn--quiet btn--sm"
              style={{ color: 'var(--rehab-red-deep)', padding: '0 var(--s-3)' }}
              onClick={handleDelete}
            >
              🗑️ 刪除課表
            </button>
          )}

          {onEditRoutine && (
            <button
              className="btn btn--glass"
              onClick={() => {
                onClose()
                onEditRoutine(routine)
              }}
            >
              ✏️ 編輯課表
            </button>
          )}

          <button
            className="btn btn--primary btn--lg"
            style={{ flex: 1, minWidth: '180px' }}
            onClick={() => {
              onClose()
              onStartRoutine(routine)
            }}
          >
            開始整組課表訓練
          </button>
        </div>
      </div>
    </div>
  )
}
