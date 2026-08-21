import { useState } from 'react'
import { EXERCISE_CATALOG } from '../domain/exerciseCatalog'
import type { CompletedSession } from '../domain/rehabTypes'
import { RecoveryRoadmap } from '../components/RecoveryRoadmap'
import { ActivityCalendar } from '../components/ActivityCalendar'
import { RecentStatsGrid } from '../components/RecentStatsGrid'

interface RehabDashboardProps {
  history: CompletedSession[]
  onStartExercise: (exerciseId: string) => void
  onNavigateToExercises: () => void
  onSelectSession: (session: CompletedSession) => void
}

function formatWhen(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`
}

function toLocalDateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

export function RehabDashboard({
  history,
  onStartExercise,
  onNavigateToExercises,
  onSelectSession,
}: RehabDashboardProps) {
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)

  const defaultExercise = EXERCISE_CATALOG[0]!

  const filteredHistory = selectedDateStr
    ? history.filter((s) => toLocalDateKey(s.timestamp) === selectedDateStr)
    : history

  return (
    <div className="rehab-dashboard">
      {/* 1. Hero Header */}
      <div className="rehab-hero">
        <h1 className="rehab-hero__title">肩關節復健總覽</h1>
        <p className="rehab-hero__sub">
          即時追蹤抬起角度與動作節奏，在家或辦公桌前完成處方復健。影像全程留在這台裝置上。
        </p>
      </div>

      {/* 2. Recommended Prescription Today (Top Priority) */}
      <div className="dashboard-action-banner">
        <div className="dashboard-action-banner__info">
          <div className="section-tag" style={{ marginBottom: '2px' }}>
            <span className="section-tag__dot" aria-hidden="true" />
            <span>今日處方推薦</span>
          </div>
          <h2 className="dashboard-action-banner__title">
            肩胛綜合穩定強化課表（站姿 ＋ 坐姿）
          </h2>
          <p className="dashboard-action-banner__desc">
            標準 90° 平舉 · 5s-5s-5s 節奏 · 2 站連續訓練 · 預估約 8 分鐘
          </p>
        </div>

        <div className="dashboard-action-banner__actions">
          <button
            className="btn btn--glass"
            onClick={onNavigateToExercises}
            aria-label="查看動作庫與課表"
          >
            探索動作庫 ▾
          </button>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => onStartExercise(defaultExercise.id)}
          >
            快速開始訓練
          </button>
        </div>
      </div>

      {/* 3. Recovery Progression Roadmap */}
      <RecoveryRoadmap history={history} />

      {/* 4. Recent Biomechanical Stats */}
      <RecentStatsGrid history={history} />

      {/* 5. Activity & Rest-Day Calendar (Directly above History View) */}
      <ActivityCalendar
        history={history}
        selectedDateStr={selectedDateStr}
        onSelectDate={setSelectedDateStr}
      />

      {/* 6. Detailed Session History Drilldown */}
      <div className="history-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--s-3)' }}>
          <div>
            <div className="section-tag">
              <span className="section-tag__dot" aria-hidden="true" />
              <span>病歷與復健歷程</span>
            </div>
            <h2 className="section-header__title">
              {selectedDateStr ? `${selectedDateStr} 訓練紀錄` : '近期訓練紀錄'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--rehab-ink-tertiary)' }}>
              點擊任一紀錄可查看各次動作細節與角度分析（可供主治醫師評估參考）
            </p>
          </div>
          {selectedDateStr && (
            <button
              className="btn btn--quiet btn--sm"
              onClick={() => setSelectedDateStr(null)}
              style={{ fontSize: '13px' }}
            >
              顯示全部紀錄
            </button>
          )}
        </div>

        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">
              {selectedDateStr ? `${selectedDateStr} 沒有訓練紀錄` : '還沒有紀錄'}
            </p>
            <p className="empty-state__body">
              {selectedDateStr
                ? '當日為肌腱修復休息日，或尚未進行訓練。'
                : '完成第一組之後，每次的達標次數、停頓時間與動作細節都會列在這裡。'}
            </p>
          </div>
        ) : (
          <div className="history-table">
            <div className="history-row history-row--header" aria-hidden="true">
              <span>訓練時間</span>
              <span>動作</span>
              <span>完成次數</span>
              <span>平均停頓</span>
              <span>達標次數</span>
              <span style={{ textAlign: 'right' }}>詳細報告</span>
            </div>

            {filteredHistory.map((session) => (
              <div
                key={session.id}
                className="history-row history-row--clickable"
                onClick={() => onSelectSession(session)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectSession(session)
                  }
                }}
              >
                <span className="history-row__primary">
                  <span className="history-row__label">訓練時間</span>
                  <span>{formatWhen(session.timestamp)}</span>
                </span>
                <span className="history-row__muted">
                  <span className="history-row__label">動作</span>
                  <span>{session.exerciseNameZh}</span>
                </span>
                <span>
                  <span className="history-row__label">完成次數</span>
                  <span>
                    {session.completedReps} / {session.targetReps} 次
                  </span>
                </span>
                <span className="history-row__muted">
                  <span className="history-row__label">平均停頓</span>
                  <span>{session.averageHoldDurationS.toFixed(1)} 秒</span>
                </span>
                <span>
                  <span className="history-row__label">達標次數</span>
                  <span
                    className={`count-badge ${
                      session.cleanRepsCount === session.completedReps ? 'count-badge--full' : ''
                    }`}
                  >
                    {session.cleanRepsCount} / {session.completedReps}
                  </span>
                </span>
                <span style={{ textAlign: 'right', color: 'var(--rehab-blue-deep)', fontWeight: 600 }}>
                  查看細節 ›
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
