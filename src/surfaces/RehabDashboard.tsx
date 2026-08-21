import { EXERCISE_CATALOG } from '../domain/exerciseCatalog'
import type { CompletedSession, UserSettings } from '../domain/rehabTypes'
import { ExerciseCard } from '../components/ExerciseCard'

interface RehabDashboardProps {
  settings: UserSettings
  history: CompletedSession[]
  onStartExercise: (exerciseId: string) => void
  onOpenSettings: () => void
}

export function RehabDashboard({
  settings,
  history,
  onStartExercise,
}: RehabDashboardProps) {
  const primaryExercise = EXERCISE_CATALOG[0]!

  // Aggregate stats
  const totalSets = history.length
  const totalReps = history.reduce((acc, s) => acc + s.completedReps, 0)
  const avgQuality =
    history.length > 0
      ? Math.round(history.reduce((acc, s) => acc + s.formQualityScorePct, 0) / history.length)
      : 100

  return (
    <div className="rehab-dashboard">
      {/* Hero Welcome */}
      <div className="rehab-hero">
        <h1 className="rehab-hero__title">肩關節復健首頁</h1>
        <p className="rehab-hero__sub">
          配合即時電腦視覺追蹤與動作節奏引導，在家精準落實術後復健。
        </p>
      </div>

      {/* Routine Hero Card */}
      <ExerciseCard
        exercise={primaryExercise}
        settings={settings}
        onStart={() => onStartExercise(primaryExercise.id)}
      />

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--cyan">🎯</div>
          <div>
            <div className="stat-card__val">{totalSets}</div>
            <div className="stat-card__label">累計完成組數</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--emerald">✨</div>
          <div>
            <div className="stat-card__val">{avgQuality}%</div>
            <div className="stat-card__label">平均動作精準度</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--amber">💪</div>
          <div>
            <div className="stat-card__val">{totalReps}</div>
            <div className="stat-card__label">累計訓練次數</div>
          </div>
        </div>
      </div>

      {/* Workout History Log */}
      <div className="history-section">
        <div className="section-header">
          <h3 className="section-header__title">近期訓練紀錄</h3>
        </div>

        {history.length === 0 ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              background: 'var(--rehab-surface)',
              borderRadius: 'var(--rehab-radius-md)',
              color: 'var(--rehab-text-muted)',
              border: '1px solid var(--rehab-border)',
            }}
          >
            尚無訓練紀錄。點擊上方「開始訓練」完成您的第一組復健！
          </div>
        ) : (
          <div className="history-table">
            <div className="history-row history-row--header">
              <span>訓練時間</span>
              <span>動作名稱</span>
              <span>完成次數</span>
              <span>平均停頓</span>
              <span>動作精準度</span>
            </div>
            {history.slice(0, 5).map((session) => {
              const d = new Date(session.timestamp)
              const timeStr = `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              const isHigh = session.formQualityScorePct >= 80

              return (
                <div key={session.id} className="history-row">
                  <span style={{ color: '#fff' }}>{timeStr}</span>
                  <span style={{ color: 'var(--rehab-text-muted)' }}>{session.exerciseNameZh}</span>
                  <span style={{ fontWeight: 600 }}>{session.completedReps} / {session.targetReps} 次</span>
                  <span>{session.averageHoldDurationS.toFixed(1)} 秒</span>
                  <div>
                    <span className={`score-badge ${isHigh ? 'score-badge--high' : 'score-badge--mid'}`}>
                      {session.formQualityScorePct}% 完美動作
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
