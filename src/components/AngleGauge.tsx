import { CONFIG } from '../pose/shoulderKinematics'

interface AngleGaugeProps {
  currentAngle: number
  isTargetZone?: boolean
  phaseLabel: string
  hint?: string | undefined
  maxAngle?: number
}

const R = 52
const C = 2 * Math.PI * R

/** Point on the dial for a 0..1 fraction, in the SVG's pre-rotation space. */
function pointAt(fraction: number, radius: number) {
  const theta = fraction * 2 * Math.PI
  return { x: 50 + radius * Math.cos(theta), y: 50 + radius * Math.sin(theta) }
}

/**
 * The joint-angle readout. Lives ON the camera feed rather than beside it: a
 * user watching their own arm should not have to shift gaze to a side panel to
 * learn what that arm is doing.
 *
 * The lit band is the range the engine ACTUALLY accepts — CONFIG.TARGET_HOLD_ENTER
 * to CONFIG.TARGET_HOLD_MAX, currently 80°-110° — read from CONFIG rather than
 * hardcoded. The previous version drew a fixed 85°-95° band, which was wrong in
 * both directions: a rep peaking at 84° was being credited as clean while the
 * gauge showed the user outside the zone. An overlay that misreports system
 * state during the one moment feedback has to be trustworthy is worse than no
 * overlay.
 */
export function AngleGauge({
  currentAngle,
  isTargetZone = false,
  phaseLabel,
  hint,
  maxAngle = 120,
}: AngleGaugeProps) {
  const clamped = Math.max(0, Math.min(maxAngle, currentAngle))
  const valueFraction = clamped / maxAngle

  const bandStart = CONFIG.TARGET_HOLD_ENTER / maxAngle
  const bandEnd = Math.min(1, CONFIG.TARGET_HOLD_MAX / maxAngle)
  const bandLength = Math.max(0, bandEnd - bandStart)
  const nominal = pointAt(CONFIG.TARGET_ANGLE_NOMINAL / maxAngle, R)
  const nominalInner = pointAt(CONFIG.TARGET_ANGLE_NOMINAL / maxAngle, R - 8)

  return (
    <div className={`hud ${isTargetZone ? 'hud--target' : ''}`}>
      <div className="hud__dial">
        <svg viewBox="0 0 100 100" className="hud__svg" aria-hidden="true">
          <circle cx="50" cy="50" r={R} className="hud__track" />

          {/* The accepted hold band, drawn as a lit segment of the track. */}
          <circle
            cx="50"
            cy="50"
            r={R}
            className="hud__band"
            strokeDasharray={`${bandLength * C} ${C}`}
            strokeDashoffset={-bandStart * C}
          />

          <circle
            cx="50"
            cy="50"
            r={R}
            className="hud__value"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - valueFraction)}
          />

          {/* The nominal target. Without it a 30°-wide band implies 81° and
              109° are equally good, which the exercise does not prescribe. */}
          <line
            x1={nominalInner.x}
            y1={nominalInner.y}
            x2={nominal.x}
            y2={nominal.y}
            className="hud__nominal"
          />
        </svg>

        <div className="hud__readout">
          <span className="hud__num">
            {Math.round(currentAngle)}
            <span className="hud__unit">°</span>
          </span>
        </div>
      </div>

      <div className="hud__meta">
        <span className="hud__phase">{phaseLabel}</span>
        {hint ? <span className="hud__hint">{hint}</span> : null}
      </div>

      <span className="sr-only" aria-live="polite">
        目前抬起角度 {Math.round(currentAngle)} 度，{phaseLabel}
      </span>
    </div>
  )
}
