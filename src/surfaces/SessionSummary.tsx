import type { CompletedSession } from '../domain/rehabTypes'
import { EXERCISE_CATALOG } from '../domain/exerciseCatalog'

interface SessionSummaryProps {
  session: CompletedSession
  onReturnHome: () => void
}

function formatWhen(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

export function SessionSummary({ session, onReturnHome }: SessionSummaryProps) {
  const exercise =
    EXERCISE_CATALOG.find((e) => e.id === session.exerciseId) ?? EXERCISE_CATALOG[0]!

  const didAny = session.completedReps > 0

  return (
    <div className="summary-surface">
      <section className="scorecard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className="scorecard__eyebrow" style={{ margin: 0 }}>{session.exerciseNameZh}</p>
          <span style={{ fontSize: '13px', color: 'var(--rehab-ink-tertiary)' }}>
            {formatWhen(session.timestamp)}
          </span>
        </div>

        {didAny && (
          <p className="scorecard__count">
            <span>{session.cleanRepsCount}</span>
            <span className="scorecard__count-of">/ {session.completedReps}</span>
          </p>
        )}

        <p className="scorecard__caption">
          {didAny
            ? `完成 ${session.completedReps} 次，其中 ${session.cleanRepsCount} 次抬到目標區間（90°）並維持 5 秒節奏。`
            : '這一組沒有記錄到完整動作。休息一下，等準備好再開始。'}
        </p>

        {didAny && (
          <div className="scorecard__grid">
            <div className="summary-metric">
              <span className="summary-metric__label">完成次數</span>
              <span className="summary-metric__val">
                {session.completedReps} / {session.targetReps}
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric__label">平均頂點停頓</span>
              <span className="summary-metric__val">
                {session.averageHoldDurationS.toFixed(1)} 秒
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric__label">最高抬起角度</span>
              <span className="summary-metric__val">{session.peakElevationDeg}°</span>
            </div>
          </div>
        )}
      </section>

      {didAny && (
        <section className="history-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-header__title">單次動作細節（供臨床醫師評估）</h2>
            <button
              className="btn btn--quiet btn--sm"
              onClick={() => window.print()}
              title="列印或另存為 PDF"
              style={{ fontSize: '13px' }}
            >
              🖨️ 列印報告
            </button>
          </div>

          <div className="rep-log">
            <div className="rep-row rep-row--header" aria-hidden="true">
              <span>次數</span>
              <span>上升 / 下放</span>
              <span>頂點停頓</span>
              <span>最大角度</span>
              <span>動作紀錄</span>
            </div>

            {session.reps.map((rep) => (
              <div className="rep-row" key={rep.index}>
                <span className="rep-row__n">
                  <span className="rep-row__label">次數</span>
                  <span>第 {rep.index} 次</span>
                </span>
                <span className="rep-row__muted">
                  <span className="rep-row__label">上升 / 下放</span>
                  <span>
                    {rep.concentricDuration}s / {rep.eccentricDuration}s
                  </span>
                </span>
                <span className="rep-row__muted">
                  <span className="rep-row__label">頂點停頓</span>
                  <span style={{ color: rep.holdDuration >= 4.5 ? 'var(--rehab-emerald)' : 'inherit' }}>
                    {rep.holdDuration.toFixed(1)} 秒
                  </span>
                </span>
                <span className="rep-row__muted">
                  <span className="rep-row__label">最大角度</span>
                  <span>{rep.peakElevation}°</span>
                </span>
                <span>
                  <span className="rep-row__label">動作紀錄</span>
                  <span>
                    {rep.isClean ? (
                      <span className="clean-tag">
                        <span aria-hidden="true">✓</span> 達標
                      </span>
                    ) : (
                      rep.flags.map((flag) => (
                        <span key={flag} className="flag-tag">
                          {exercise.commonErrorsZh[flag] ?? flag}
                        </span>
                      ))
                    )}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="summary-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn--primary btn--lg" onClick={onReturnHome}>
          返回首頁
        </button>
      </div>
    </div>
  )
}
