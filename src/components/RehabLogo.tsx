export interface RehabLogoProps {
  /**
   * - 'icon': Compact, high-contrast squircle mark for nav headers, tabs, small badges (24px–40px)
   * - 'full': Rich, detailed biomechanical emblem with concentric goniometric calibration rings (48px–96px)
   * - 'lockup': Horizontal lockup pairing the emblem with styled "Rehabibi" logotype and subtitle
   */
  variant?: 'icon' | 'full' | 'lockup'
  /** Size in pixels (applies to width/height for icon/full, or height for lockup) */
  size?: number
  className?: string
  /** Subtitle to show in lockup variant (defaults to empty) */
  subtitle?: string
}

/**
 * Rehabibi Official Vector Brand Logo
 *
 * Embodying clinical biomechanics, range of motion telemetry, and Apple HIG system materials:
 * - Vertical spinal axis (posture anchor)
 * - 90° Goniometer range arc with central joint pivot node
 * - Dynamic kinetic limb trajectory vector (concentric lift + eccentric control)
 */
export function RehabLogo({
  variant = 'icon',
  size = 34,
  className = '',
  subtitle,
}: RehabLogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`rehab-logo rehab-logo--icon ${className}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="rehab-logo-grad-icon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b79ed" />
            <stop offset="100%" stopColor="#0052b3" />
          </linearGradient>
          <linearGradient id="rehab-logo-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <filter id="rehab-icon-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#002d66" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Squircle Base */}
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="26"
          fill="url(#rehab-logo-grad-icon)"
          filter="url(#rehab-icon-shadow)"
        />

        {/* Subtle Top Inner Edge Highlight */}
        <rect
          x="3.5"
          y="3.5"
          width="93"
          height="93"
          rx="24.5"
          fill="none"
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth="1.5"
        />

        {/* Goniometer Range-of-Motion Arc (Upper Right) */}
        <path
          d="M 52 20 A 18 18 0 0 1 70 38"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="1.5 5"
        />

        {/* The Kinetic 'R' Letterform Geometry */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Vertical Postural Axis / Stem */}
          <line
            x1="30"
            y1="23"
            x2="30"
            y2="77"
            stroke="#ffffff"
            strokeWidth="9"
          />

          {/* Goniometer Loop / ROM Head */}
          <path
            d="M 30 25 H 52 C 64.5 25 72 32.5 72 43 C 72 53.5 64.5 60 52 60 H 30"
            stroke="#ffffff"
            strokeWidth="8.5"
          />

          {/* Dynamic Kinetic Trajectory Leg */}
          <path
            d="M 46 56 L 68 76"
            stroke="url(#rehab-logo-glow)"
            strokeWidth="8.5"
          />

          {/* Joint Pivot Calibration Node (Glowing Center) */}
          <circle cx="51" cy="42.5" r="4" fill="#38bdf8" />
          <circle cx="51" cy="42.5" r="2" fill="#ffffff" />
        </g>
      </svg>
    )
  }

  if (variant === 'full') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`rehab-logo rehab-logo--full ${className}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="rehab-full-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b79ed" />
            <stop offset="50%" stopColor="#0066d6" />
            <stop offset="100%" stopColor="#004da6" />
          </linearGradient>

          <linearGradient id="rehab-full-limb" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>

          <linearGradient id="rehab-full-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#299d50" stopOpacity="0.8" />
          </linearGradient>

          <filter id="rehab-full-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#00357a" floodOpacity="0.28" />
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#00224f" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Squircle Glass Canvas */}
        <rect
          x="6"
          y="6"
          width="188"
          height="188"
          rx="52"
          fill="url(#rehab-full-bg)"
          filter="url(#rehab-full-shadow)"
        />

        {/* Specular Inner Rim */}
        <rect
          x="8"
          y="8"
          width="184"
          height="184"
          rx="50"
          fill="none"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="2.5"
        />

        {/* ── Biomechanical Goniometer System ──────────────────────── */}
        {/* Outer Circular Degree Calibration Track */}
        <circle
          cx="100"
          cy="100"
          r="74"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="2"
          fill="none"
        />

        {/* 0° to 90° Range of Motion Highlight Arc */}
        <path
          d="M 174 100 A 74 74 0 0 0 100 26"
          stroke="url(#rehab-full-ring)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Goniometer Radial Calibration Tick Marks */}
        {/* 0° Tick (Right Horizontal) */}
        <line x1="168" y1="100" x2="178" y2="100" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        {/* 30° Tick */}
        <line x1="159" y1="67" x2="167" y2="63" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="2" strokeLinecap="round" />
        {/* 45° Tick */}
        <line x1="148" y1="48" x2="155" y2="41" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="2" strokeLinecap="round" />
        {/* 60° Tick */}
        <line x1="133" y1="37" x2="137" y2="29" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="2" strokeLinecap="round" />
        {/* 90° Target Lockout Tick (Top Vertical) */}
        <line x1="100" y1="22" x2="100" y2="32" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />

        {/* ── Kinetic 'R' Core Anatomy ──────────────────────────────── */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Postural Spine Vector (Primary Axis) */}
          <line
            x1="62"
            y1="48"
            x2="62"
            y2="152"
            stroke="#ffffff"
            strokeWidth="16"
          />

          {/* Goniometer Loop / Range of Motion Arc */}
          <path
            d="M 62 52 H 104 C 128 52 142 66 142 86 C 142 106 128 119 104 119 H 62"
            stroke="#ffffff"
            strokeWidth="15"
            fill="none"
          />

          {/* Kinetic Motion Vector / Trajectory Leg */}
          <path
            d="M 94 112 L 136 150"
            stroke="url(#rehab-full-limb)"
            strokeWidth="15"
          />

          {/* Joint Rotation Pivot Node */}
          <circle cx="102" cy="85.5" r="9" fill="#003e85" />
          <circle cx="102" cy="85.5" r="7" fill="#38bdf8" />
          <circle cx="102" cy="85.5" r="3.5" fill="#ffffff" />

          {/* Target 90° Elevation Indicator Pip */}
          <circle cx="100" cy="26" r="3.5" fill="#34d399" />
        </g>
      </svg>
    )
  }

  // variant === 'lockup'
  const emblemSize = size
  return (
    <div className={`rehab-logo-lockup ${className}`}>
      <RehabLogo variant="icon" size={emblemSize} />
      <div className="rehab-logo-lockup__text">
        <span className="rehab-logo-lockup__title">Rehabibi</span>
        {subtitle && <span className="rehab-logo-lockup__subtitle">{subtitle}</span>}
      </div>
    </div>
  )
}
