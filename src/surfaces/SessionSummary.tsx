import type { CompletedSession } from '../domain/rehabTypes'
import { EXERCISE_CATALOG } from '../domain/exerciseCatalog'

interface SessionSummaryProps {
  session: CompletedSession
  onReturnHome: () => void
}

export function SessionSummary({ session, onReturnHome }: SessionSummaryProps) {
  const exercise = EXERCISE_CATALOG.find((e) => e.id === session.exerciseId) ?? EXERCISE_CATALOG[0]!

  return (
    <div className="summary-surface">
      {/* Scorecard Hero Card */}
      <div className="scorecard">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            訓練組完成 • {session.exerciseNameZh}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '8px 0 0 0' }}>
            動作品質評分
          </h1>
        </div>

        {/* Circular Form Quality Score Dial */}
        <div className="scorecard__circle">
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={session.formQualityScorePct >= 80 ? '#10b981' : '#f59e0b'}
              strokeWidth="8"
              strokeLinecap="round"
              style={{
                strokeDasharray: 264,
                strokeDashoffset: 264 * (1 - session.formQualityScorePct / 100),
                transition: 'stroke-dashoffset 1s ease',
              }}
            />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="scorecard__score-text">{session.formQualityScorePct}%</span>
            <span style={{ fontSize: '11px', color: 'var(--rehab-text-muted)', fontWeight: 600 }}>完美動作率</span>
          </div>
        </div>

        {/* Metric Pills */}
        <div className="scorecard__grid">
          <div className="summary-metric">
            <div style={{ fontSize: '12px', color: 'var(--rehab-text-dim)', textTransform: 'uppercase' }}>完成次數</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {session.completedReps} / {session.targetReps} 次
            </div>
          </div>

          <div className="summary-metric">
            <div style={{ fontSize: '12px', color: 'var(--rehab-text-dim)', textTransform: 'uppercase' }}>平均頂點停頓</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              {session.averageHoldDurationS.toFixed(1)} 秒
            </div>
          </div>

          <div className="summary-metric">
            <div style={{ fontSize: '12px', color: 'var(--rehab-text-dim)', textTransform: 'uppercase' }}>最高抬起角度</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {session.peakElevationDeg}°
            </div>
          </div>
        </div>
      </div>

      {/* Rep-by-Rep Inspection Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
          單次動作詳細分析
        </h3>

        <table className="rep-log-table">
          <thead>
            <tr>
              <th>次數</th>
              <th>上升 / 下放節奏</th>
              <th>頂點停頓時間</th>
              <th>最大角度</th>
              <th>動作評估</th>
            </tr>
          </thead>
          <tbody>
            {session.reps.map((rep) => (
              <tr key={rep.index}>
                <td style={{ fontWeight: 700, color: '#fff' }}>第 {rep.index} 次</td>
                <td style={{ color: 'var(--rehab-text-muted)' }}>
                  {rep.concentricDuration}s / {rep.eccentricDuration}s
                </td>
                <td style={{ color: '#38bdf8', fontWeight: 600 }}>
                  {rep.holdDuration.toFixed(1)} 秒
                </td>
                <td>{rep.peakElevation}°</td>
                <td>
                  {rep.isClean ? (
                    <span style={{ color: '#34d399', fontWeight: 600, fontSize: '13px' }}>
                      ✅ 完美動作
                    </span>
                  ) : (
                    <div>
                      {rep.flags.map((flag) => (
                        <span key={flag} className="flag-tag">
                          {exercise.commonErrorsZh[flag] ?? flag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Return Home CTA */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <button
          onClick={onReturnHome}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            border: 'none',
            padding: '16px 40px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px var(--rehab-cyan-glow)',
          }}
        >
          儲存紀錄並返回首頁
        </button>
      </div>
    </div>
  )
}
