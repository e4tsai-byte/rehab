import { Digits } from './Digits'
import type { RehabPhase } from '../domain/rehabTypes'

interface CadencePacerProps {
  phase: RehabPhase
  holdRemaining: number
  concentricElapsed: number
  eccentricElapsed: number
  targetDuration?: number
}

export function CadencePacer({
  phase,
  holdRemaining,
  concentricElapsed,
  eccentricElapsed,
  targetDuration = 5.0,
}: CadencePacerProps) {
  if (phase === 'RESTING') {
    return (
      <div className="pacer pacer--idle">
        <p className="pacer__hint">準備完成後，將右手臂緩慢向前平舉</p>
      </div>
    )
  }

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

  const isAscent = phase === 'ASCENDING'
  const elapsed = isAscent ? concentricElapsed : eccentricElapsed
  const progressPct = Math.min(100, (elapsed / targetDuration) * 100)

  return (
    <div className="pacer pacer--active">
      <div className="pacer__header">
        <span className="pacer__phase-name">
          {isAscent ? '向上抬起 (目標 5 秒)' : '緩慢放下 (目標 5 秒)'}
        </span>
        <span className="pacer__elapsed">
          <Digits value={elapsed.toFixed(1)} /> / {targetDuration.toFixed(1)} 秒
        </span>
      </div>
      <div className="pacer__bar">
        <div
          className={`pacer__bar-fill ${isAscent ? 'pacer__bar-fill--up' : 'pacer__bar-fill--down'}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
