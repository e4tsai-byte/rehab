import { Digits } from './Digits'
import type { PaceStatus, RehabPhase } from '../domain/rehabTypes'

interface CadencePacerProps {
  phase: RehabPhase
  holdRemaining: number
  restRemaining?: number
  concentricElapsed: number
  eccentricElapsed: number
  paceStatus?: PaceStatus
  targetDuration?: number
  restTotal?: number
}

const RING_R = 74
const RING_C = 2 * Math.PI * RING_R

/**
 * The telemetry panel's single numeral.
 *
 * THE ONE-NUMBER RULE: exactly one value is at hero scale here at any moment,
 * chosen by phase — cadence seconds while moving, hold countdown while holding,
 * rest countdown while resting. The angle is the camera region's number and is
 * never duplicated here.
 *
 * The pace verdict is four characters at most. It replaced strings like
 * 「⚠️ 速度過快（請放慢）」 — nine characters, unreadable mid-rep by someone
 * holding their arm up two metres from the screen. Each state also carries its
 * own glyph, because colour must never be the only thing distinguishing them.
 */
export function CadencePacer({
  phase,
  holdRemaining,
  restRemaining = 0,
  concentricElapsed,
  eccentricElapsed,
  paceStatus = 'IDLE',
  targetDuration = 5.0,
  restTotal = 3.0,
}: CadencePacerProps) {
  // Rest between reps.
  if (phase === 'RESTING' && restRemaining > 0) {
    const progress = Math.max(0, Math.min(1, (restTotal - restRemaining) / restTotal))
    return (
      <div className="pacer pacer--rest">
        <div className="pacer__ring">
          <svg viewBox="0 0 168 168" className="pacer__ring-svg" aria-hidden="true">
            <circle cx="84" cy="84" r={RING_R} className="pacer__ring-bg" />
            <circle
              cx="84"
              cy="84"
              r={RING_R}
              className="pacer__ring-fill"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
            />
          </svg>
          <div className="pacer__ring-center">
            <span className="pacer__hero">
              <Digits value={restRemaining.toFixed(1)} />
              <span className="pacer__hero-unit">秒</span>
            </span>
          </div>
        </div>
        <p className="pacer__caption">次間休息</p>
      </div>
    )
  }

  // Idle, before the first rep of a set.
  if (phase === 'RESTING') {
    return (
      <div className="pacer">
        <p className="pacer__idle">
          準備完成後，將右手臂以 5 秒平緩向前平舉
        </p>
      </div>
    )
  }

  // Isometric hold.
  if (phase === 'HOLDING') {
    const progress = Math.max(0, Math.min(1, (targetDuration - holdRemaining) / targetDuration))
    return (
      <div className="pacer pacer--hold">
        <div className="pacer__ring">
          <svg viewBox="0 0 168 168" className="pacer__ring-svg" aria-hidden="true">
            <circle cx="84" cy="84" r={RING_R} className="pacer__ring-bg" />
            <circle
              cx="84"
              cy="84"
              r={RING_R}
              className="pacer__ring-fill"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
            />
          </svg>
          <div className="pacer__ring-center">
            <span className="pacer__hero">
              <Digits value={holdRemaining.toFixed(1)} />
              <span className="pacer__hero-unit">秒</span>
            </span>
          </div>
        </div>
        <p className="pacer__caption">維持水平停頓</p>
      </div>
    )
  }

  // Moving: concentric or eccentric.
  const isAscent = phase === 'ASCENDING'
  const elapsed = isAscent ? concentricElapsed : eccentricElapsed
  const progressPct = Math.min(100, (elapsed / targetDuration) * 100)

  const verdict =
    paceStatus === 'TOO_FAST'
      ? { cls: 'fast', glyph: '↓', text: '慢一點' }
      : paceStatus === 'TOO_SLOW'
        ? { cls: 'slow', glyph: '↑', text: '快一點' }
        : paceStatus === 'ON_TRACK'
          ? { cls: 'ontrack', glyph: '✓', text: '很好' }
          : null

  return (
    <div className="pacer">
      <span className="pacer__hero">
        <Digits value={elapsed.toFixed(1)} />
        <span className="pacer__hero-unit">秒</span>
      </span>

      <p className="pacer__caption">
        {isAscent ? '向上平舉' : '控制下放'} · 目標 {targetDuration.toFixed(1)} 秒
      </p>

      {verdict ? (
        <span className={`pacer__verdict pacer__verdict--${verdict.cls}`} aria-live="polite">
          <span aria-hidden="true">{verdict.glyph}</span>
          {verdict.text}
        </span>
      ) : null}

      <div className="pacer__bar">
        <div
          className={`pacer__bar-fill ${
            paceStatus === 'TOO_FAST'
              ? 'pacer__bar-fill--fast'
              : paceStatus === 'TOO_SLOW'
                ? 'pacer__bar-fill--slow'
                : ''
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
