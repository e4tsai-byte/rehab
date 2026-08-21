import { Digits } from './Digits'
import type { PaceStatus, RehabPhase } from '../domain/rehabTypes'
import { useT } from '../i18n/LocaleContext'

interface CadencePacerProps {
  phase: RehabPhase
  holdRemaining: number
  restRemaining?: number
  concentricElapsed: number
  eccentricElapsed: number
  paceStatus?: PaceStatus
  targetDuration?: number
  restTotal?: number
  /* The isometric-hold model (side-lying supraspinatus hold) holds at a low
     10–15° band, not at horizontal, and is not entered via a paced forward
     raise — so its idle and hold captions differ from the paced machine's.
     Paced exercises pass nothing and read as before. */
  isometricHold?: boolean
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
  isometricHold = false,
}: CadencePacerProps) {
  const { t } = useT()

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
              <span className="pacer__hero-unit">{t('pacer.secUnit')}</span>
            </span>
          </div>
        </div>
        <p className="pacer__caption">{t('pacer.restCaption')}</p>
      </div>
    )
  }

  // Idle, before the first rep of a set.
  if (phase === 'RESTING') {
    return (
      <div className="pacer">
        <p className="pacer__idle">{t(isometricHold ? 'pacer.idleLow' : 'pacer.idle')}</p>
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
              <span className="pacer__hero-unit">{t('pacer.secUnit')}</span>
            </span>
          </div>
        </div>
        <p className="pacer__caption">{t(isometricHold ? 'pacer.holdCaptionLow' : 'pacer.holdCaption')}</p>
      </div>
    )
  }

  // Moving: concentric or eccentric.
  const isAscent = phase === 'ASCENDING'
  const elapsed = isAscent ? concentricElapsed : eccentricElapsed
  const progressPct = Math.min(100, (elapsed / targetDuration) * 100)

  const verdict =
    paceStatus === 'TOO_FAST'
      ? { cls: 'fast', glyph: '↓', text: t('pacer.verdictSlower') }
      : paceStatus === 'TOO_SLOW'
        ? { cls: 'slow', glyph: '↑', text: t('pacer.verdictFaster') }
        : paceStatus === 'ON_TRACK'
          ? { cls: 'ontrack', glyph: '✓', text: t('pacer.verdictGood') }
          : null

  return (
    <div className="pacer">
      <span className="pacer__hero">
        <Digits value={elapsed.toFixed(1)} />
        <span className="pacer__hero-unit">{t('pacer.secUnit')}</span>
      </span>

      <p className="pacer__caption">
        {t('pacer.moveCaption', {
          dir: isAscent ? t('phase.ascending') : t('phase.descending'),
          t: targetDuration.toFixed(1),
        })}
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
