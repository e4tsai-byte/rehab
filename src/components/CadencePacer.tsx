import { Digits } from './Digits'
import type { PaceStatus, RehabPhase } from '../domain/rehabTypes'

interface CadencePacerProps {
  phase: RehabPhase
  holdRemaining: number
  restRemaining?: number
  concentricElapsed: number
  eccentricElapsed: number
  paceStatus?: PaceStatus
  currentAngle?: number
  expectedAngle?: number
  targetDuration?: number
}

export function CadencePacer({
  phase,
  holdRemaining,
  restRemaining = 0,
  concentricElapsed,
  eccentricElapsed,
  paceStatus = 'IDLE',
  targetDuration = 5.0,
}: CadencePacerProps) {
  // 1. Post-Rep 3-Second Rest Countdown
  if (phase === 'RESTING' && restRemaining > 0) {
    const restTotal = 3.0
    const progress = Math.max(0, Math.min(1, (restTotal - restRemaining) / restTotal))
    return (
      <div className="pacer pacer--rest" style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <div className="pacer__hold-ring">
          <svg viewBox="0 0 100 100" className="pacer__svg">
            <circle cx="50" cy="50" r="42" className="pacer__ring-bg" />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="pacer__ring-fill"
              style={{
                stroke: '#f59e0b',
                strokeDasharray: 264,
                strokeDashoffset: 264 * (1 - progress),
              }}
            />
          </svg>
          <div className="pacer__hold-text">
            <span className="pacer__hold-num" style={{ color: '#fbbf24' }}>
              <Digits value={restRemaining.toFixed(1)} />
            </span>
            <span className="pacer__hold-unit">秒</span>
          </div>
        </div>
        <p className="pacer__label" style={{ color: '#fbbf24' }}>☕ 次間休息放鬆</p>
      </div>
    )
  }

  // 2. Idle Ready
  if (phase === 'RESTING') {
    return (
      <div className="pacer pacer--idle">
        <p className="pacer__hint">準備完成後，將右手臂以 5 秒平緩向前平舉</p>
      </div>
    )
  }

  // 3. 5-Second Isometric Hold Ring
  if (phase === 'HOLDING') {
    const progress = Math.max(0, Math.min(1, (targetDuration - holdRemaining) / targetDuration))
    return (
      <div className="pacer pacer--hold">
        <div className="pacer__hold-ring">
          <svg viewBox="0 0 100 100" className="pacer__svg">
            <circle cx="50" cy="50" r="42" className="pacer__ring-bg" />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="pacer__ring-fill"
              style={{
                strokeDasharray: 264,
                strokeDashoffset: 264 * (1 - progress),
              }}
            />
          </svg>
          <div className="pacer__hold-text">
            <span className="pacer__hold-num">
              <Digits value={holdRemaining.toFixed(1)} />
            </span>
            <span className="pacer__hold-unit">秒</span>
          </div>
        </div>
        <p className="pacer__label">維持水平 90° 停頓</p>
      </div>
    )
  }

  // 4. Moving Ascent / Descent with Real-Time Pacing Guidance
  const isAscent = phase === 'ASCENDING'
  const elapsed = isAscent ? concentricElapsed : eccentricElapsed
  const progressPct = Math.min(100, (elapsed / targetDuration) * 100)

  return (
    <div className="pacer pacer--active">
      <div className="pacer__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pacer__phase-name">
            {isAscent ? '向上平舉 (5 秒節奏)' : '控制下放 (5 秒節奏)'}
          </span>
          
          {/* Live Pace Feedback Badge */}
          {paceStatus === 'TOO_FAST' && (
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444' }}>
              ⚠️ 速度過快（請放慢）
            </span>
          )}
          {paceStatus === 'TOO_SLOW' && (
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b' }}>
              ⚠️ 速度過慢（稍微加快）
            </span>
          )}
          {paceStatus === 'ON_TRACK' && (
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' }}>
              ✨ 節奏完美
            </span>
          )}
        </div>

        <span className="pacer__elapsed">
          <Digits value={elapsed.toFixed(1)} /> / {targetDuration.toFixed(1)} 秒
        </span>
      </div>

      <div className="pacer__bar">
        <div
          className={`pacer__bar-fill ${
            paceStatus === 'TOO_FAST'
              ? 'pacer__bar-fill--fast'
              : isAscent
              ? 'pacer__bar-fill--up'
              : 'pacer__bar-fill--down'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
