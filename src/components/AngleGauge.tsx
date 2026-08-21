import { Digits } from './Digits'

interface AngleGaugeProps {
  currentAngle: number
  targetAngle?: number
  isTargetZone?: boolean
  minAngle?: number
  maxAngle?: number
}

export function AngleGauge({
  currentAngle,
  isTargetZone = false,
  minAngle = 0,
  maxAngle = 120,
}: AngleGaugeProps) {
  const clampedAngle = Math.max(minAngle, Math.min(maxAngle, currentAngle))
  const angleRatio = clampedAngle / maxAngle

  return (
    <div className={`gauge ${isTargetZone ? 'gauge--target' : ''}`}>
      <div className="gauge__readout">
        <span className="gauge__num">
          <Digits value={Math.round(currentAngle)} />
        </span>
        <span className="gauge__unit">°</span>
      </div>

      {/* Progress Bar with Target Zone Marker */}
      <div className="gauge__track-wrap">
        <div className="gauge__track">
          <div
            className="gauge__fill"
            style={{ width: `${Math.min(100, Math.max(0, angleRatio * 100))}%` }}
          />
          {/* 85° - 95° Target Zone Marker */}
          <div
            className="gauge__zone"
            style={{
              left: `${(85 / maxAngle) * 100}%`,
              width: `${((95 - 85) / maxAngle) * 100}%`,
            }}
          >
            <span className="gauge__zone-label">90° 目標</span>
          </div>
        </div>
      </div>

      <div className="gauge__bounds">
        <span>0° (放鬆)</span>
        <span className="gauge__mid">90° (水平)</span>
        <span>120°</span>
      </div>
    </div>
  )
}
