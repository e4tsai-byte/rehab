import { useState } from 'react'
import { EXERCISE_CATALOG } from '../domain/exerciseCatalog'
import type { CompletedSession, UserSettings } from '../domain/rehabTypes'
import { ExerciseCard } from '../components/ExerciseCard'

interface RehabDashboardProps {
  settings: UserSettings
  history: CompletedSession[]
  onStartExercise: (exerciseId: string) => void
  onSelectSession: (session: CompletedSession) => void
  onOpenSettings: () => void
}

function formatWhen(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

export function RehabDashboard({
  settings,
  history,
  onStartExercise,
  onSelectSession,
}: RehabDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<string>(EXERCISE_CATALOG[0]!.id)
  const currentExercise =
    EXERCISE_CATALOG.find((e) => e.id === selectedTab) ?? EXERCISE_CATALOG[0]!

  const totalSets = history.length
  const totalReps = history.reduce((acc, s) => acc + s.completedReps, 0)
  const totalOnTarget = history.reduce((acc, s) => acc + s.cleanRepsCount, 0)

  return (
    <div className="rehab-dashboard">
      <div className="rehab-hero">
        <h1 className="rehab-hero__title">肩關節復健</h1>
        <p className="rehab-hero__sub">
          即時追蹤抬起角度與動作節奏，在家或辦公桌前完成處方復健。影像全程留在這台裝置上。
        </p>
      </div>

      <div className="segmented" role="tablist" aria-label="選擇訓練動作">
        {EXERCISE_CATALOG.map((ex) => (
          <button
            key={ex.id}
            role="tab"
            aria-selected={ex.id === selectedTab}
            className="segmented__item"
            onClick={() => setSelectedTab(ex.id)}
          >
            <span aria-hidden="true">{ex.posture === 'standing' ? '🧍' : '🪑'}</span>
            <span>{ex.nameZh}</span>
          </button>
        ))}
      </div>

      <ExerciseCard
        exercise={currentExercise}
        settings={settings}
        onStart={() => onStartExercise(currentExercise.id)}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card__val">{totalSets}</span>
          <span className="stat-card__label">累計完成組數</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__val stat-card__val--blue">{totalReps}</span>
          <span className="stat-card__label">累計訓練次數</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__val stat-card__val--green">{totalOnTarget}</span>
          <span className="stat-card__label">達標次數</span>
          <span className="stat-card__sub">抬到目標區間且節奏穩定</span>
        </div>
      </div>

      <div className="history-section">
        <div className="section-header">
          <div>
            <h2 className="section-header__title">近期訓練紀錄</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--rehab-ink-tertiary)' }}>
              點擊任一紀錄可查看各次動作細節與角度分析（可供主治醫師評估參考）
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">還沒有紀錄</p>
            <p className="empty-state__body">
              完成第一組之後，每次的達標次數、停頓時間與動作細節都會列在這裡。
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

            {history.map((session) => (
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
                <span style={{ textAlign: 'right', color: 'var(--rehab-cyan)', fontWeight: 600 }}>
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
