import { useState } from 'react'
import {
  BODY_REGIONS,
  EXERCISE_CATALOG,
  type BodyRegionInfo,
} from '../domain/exerciseCatalog'
import type { BodyRegion } from '../domain/rehabTypes'
import { useT } from '../i18n/LocaleContext'

interface BodyAnatomyDiagramProps {
  onSelectRegion: (region: BodyRegion) => void
}

type ViewMode = 'posterior' | 'anterior'

export function BodyAnatomyDiagram({ onSelectRegion }: BodyAnatomyDiagramProps) {
  const { t, locale } = useT()
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('posterior')
  const isEn = locale === 'en'

  // Count exercises by region
  function getCounts(regionId: BodyRegion) {
    const all = EXERCISE_CATALOG.filter((e) => e.bodyRegion === regionId)
    const prescribed = all.filter((e) => e.status === 'available').length
    const upcoming = all.filter((e) => e.status === 'upcoming').length
    return { prescribed, upcoming, total: all.length }
  }

  const isShoulderActive = hoveredRegion === 'shoulder'
  const isSpineActive = hoveredRegion === 'spine'
  const isElbowActive = hoveredRegion === 'elbow'
  const isHipActive = hoveredRegion === 'hip'
  const isKneeActive = hoveredRegion === 'knee'
  const isAnkleActive = hoveredRegion === 'ankle'

  return (
    <section className="anatomy-section" aria-label={t('anatomy.aria')}>
      {/* Section Header */}
      <div className="section-header" style={{ marginBottom: 'var(--s-4)' }}>
        <div className="section-tag">
          <span className="section-tag__dot" aria-hidden="true" />
          <span>{t('anatomy.tag')}</span>
        </div>
        <h2 className="section-header__title">{t('anatomy.title')}</h2>
        <p className="anatomy-section__sub">{t('anatomy.sub')}</p>
      </div>

      <div className="anatomy-container">
        {/* Left / Top: Interactive Musculoskeletal Anatomy Visualizer */}
        <div className="anatomy-visual-card">
          <div className="anatomy-visual-card__header">
            <div className="anatomy-view-toggles" role="tablist" aria-label="Anatomy view options">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'posterior'}
                className={`anatomy-view-tab ${viewMode === 'posterior' ? 'anatomy-view-tab--active' : ''}`}
                onClick={() => setViewMode('posterior')}
              >
                {isEn ? 'Posterior Musculature' : '背面肌群分佈'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'anterior'}
                className={`anatomy-view-tab ${viewMode === 'anterior' ? 'anatomy-view-tab--active' : ''}`}
                onClick={() => setViewMode('anterior')}
              >
                {isEn ? 'Anterior Musculature' : '正面肌群分佈'}
              </button>
            </div>

            <span className="anatomy-hint-badge">
              <span className="anatomy-hint-badge__pulse" aria-hidden="true" />
              <span>{t('anatomy.interactiveHint')}</span>
            </span>
          </div>

          <div className="anatomy-svg-wrapper">
            <svg
              viewBox="0 0 340 560"
              className="anatomy-svg"
              role="img"
              aria-label={t('anatomy.aria')}
            >
              <defs>
                {/* Glow Filter for Active/Hovered Joint Targets */}
                <filter id="jointGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Dark Slate Body Gradients */}
                <linearGradient id="bodyGroundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#090d14" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>

                {/* Active Cyan Gradient for Highlights */}
                <linearGradient id="activeCyanGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                <linearGradient id="spineSpurGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>

                {/* Subtle Grid Pattern */}
                <pattern id="anatomyGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="340" height="560" fill="url(#anatomyGrid)" />

              {/* ── Base Athletic Body Silhouette & Muscle Ground Plates ── */}
              <g className="anatomy-base-body" stroke="rgba(255, 255, 255, 0.09)" strokeWidth="1.2">
                {/* Silhouette Outer Contour */}
                <path
                  d="M 170 30 C 158 30, 150 42, 150 56 C 150 68, 156 76, 160 82 L 152 90 C 132 94, 102 108, 92 126 C 82 144, 76 175, 68 215 C 60 255, 52 290, 46 315 C 44 324, 48 330, 56 328 C 64 326, 72 308, 78 288 C 84 265, 88 235, 94 200 L 102 200 C 104 225, 110 260, 116 295 C 114 330, 110 375, 112 415 C 114 455, 110 495, 108 522 C 107 532, 116 536, 126 534 C 134 532, 138 520, 140 500 C 146 450, 150 405, 148 370 C 146 335, 152 305, 160 292 L 180 292 C 188 305, 194 335, 192 370 C 190 405, 194 450, 200 500 C 202 520, 206 532, 214 534 C 224 536, 233 532, 232 522 C 230 495, 226 455, 228 415 C 230 375, 226 330, 224 295 C 230 260, 236 225, 238 200 L 246 200 C 252 235, 256 265, 262 288 C 268 308, 276 326, 284 328 C 292 330, 296 324, 294 315 C 288 290, 280 255, 272 215 C 264 175, 258 144, 248 126 C 238 108, 208 94, 188 90 L 180 82 C 184 76, 190 68, 190 56 C 190 42, 182 30, 170 30 Z"
                  fill="url(#bodyGroundGrad)"
                />

                {/* Head / Neck Base */}
                <ellipse cx="170" cy="56" rx="18" ry="24" fill="#131b26" />

                {/* Anatomical Muscle Plate Contours (Resting Slate) */}
                {viewMode === 'posterior' ? (
                  <g className="resting-muscle-plates" fill="#182333" stroke="#2a384c" strokeWidth="1">
                    {/* Trapezius */}
                    <path d="M 160 82 L 180 82 L 198 100 L 170 120 L 142 100 Z" />
                    {/* Deltoids */}
                    <path d="M 142 100 L 115 106 C 102 114, 94 126, 92 142 C 90 156, 96 170, 102 176 L 118 140 L 136 122 Z" />
                    <path d="M 198 100 L 225 106 C 238 114, 246 126, 248 142 C 250 156, 244 170, 238 176 L 222 140 L 204 122 Z" />
                    {/* Infraspinatus & Latissimus */}
                    <path d="M 170 120 L 194 160 L 170 190 L 146 160 Z" />
                    <path d="M 146 160 L 126 168 C 122 195, 126 220, 134 246 L 164 240 L 170 190 Z" />
                    <path d="M 194 160 L 214 168 C 218 195, 214 220, 206 246 L 176 240 L 170 190 Z" />
                    {/* Triceps & Forearms */}
                    <path d="M 102 176 L 118 140 L 110 195 L 94 200 Z" />
                    <path d="M 238 176 L 222 140 L 230 195 L 246 200 Z" />
                    <path d="M 94 200 L 110 195 C 104 230, 92 265, 82 288 L 74 282 C 82 255, 88 225, 94 200 Z" />
                    <path d="M 246 200 L 230 195 C 236 230, 248 265, 258 288 L 266 282 C 258 255, 252 225, 246 200 Z" />
                    {/* Gluteals */}
                    <path d="M 168 250 L 134 246 C 122 258, 116 278, 118 300 C 120 322, 136 338, 158 335 L 168 290 Z" />
                    <path d="M 172 250 L 206 246 C 218 258, 224 278, 222 300 C 220 322, 204 338, 182 335 L 172 290 Z" />
                    {/* Hamstrings */}
                    <path d="M 124 336 C 120 365, 118 395, 122 418 L 144 414 C 146 390, 150 362, 154 336 Z" />
                    <path d="M 216 336 C 220 365, 222 395, 218 418 L 196 414 C 194 390, 190 362, 186 336 Z" />
                    {/* Calves */}
                    <path d="M 122 422 C 114 445, 114 470, 120 495 L 138 495 C 144 470, 144 445, 142 422 Z" />
                    <path d="M 218 422 C 226 445, 226 470, 220 495 L 202 495 C 196 470, 196 445, 198 422 Z" />
                  </g>
                ) : (
                  <g className="resting-muscle-plates-anterior" fill="#182333" stroke="#2a384c" strokeWidth="1">
                    {/* Pectorals */}
                    <path d="M 140 120 L 170 125 L 168 165 L 126 155 Z" />
                    <path d="M 200 120 L 170 125 L 172 165 L 214 155 Z" />
                    {/* Anterior Deltoids */}
                    <path d="M 142 100 L 115 106 C 102 114, 94 126, 92 142 C 90 156, 96 170, 102 176 L 118 140 L 140 120 Z" />
                    <path d="M 198 100 L 225 106 C 238 114, 246 126, 248 142 C 250 156, 244 170, 238 176 L 222 140 L 200 120 Z" />
                    {/* Abdominals */}
                    <rect x="145" y="170" width="50" height="75" rx="4" />
                    {/* Biceps */}
                    <path d="M 102 176 L 118 140 L 110 195 L 94 200 Z" />
                    <path d="M 238 176 L 222 140 L 230 195 L 246 200 Z" />
                    {/* Quads */}
                    <path d="M 124 295 C 118 335, 116 375, 122 410 L 144 410 C 150 375, 154 335, 156 295 Z" />
                    <path d="M 216 295 C 222 335, 224 375, 218 410 L 196 410 C 190 375, 186 335, 184 295 Z" />
                    {/* Shins / Tibialis */}
                    <path d="M 122 422 L 126 495 L 138 495 L 142 422 Z" />
                    <path d="M 218 422 L 214 495 L 202 495 L 198 422 Z" />
                  </g>
                )}
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  INTERACTIVE JOINT & ARTICULATION TARGETS
                  (Precisely targets the joint itself: Shoulder, Elbow, Knee,
                   Ankle, Hip, Spine — with static, non-jumping leader tags)
                 ───────────────────────────────────────────────────────────── */}

              {/* 1. SHOULDER JOINT & ROTATOR CUFF */}
              <g
                id="target-shoulder"
                className={`anatomy-target-group ${isShoulderActive ? 'anatomy-target-group--active' : ''}`}
                onClick={() => onSelectRegion('shoulder')}
                onMouseEnter={() => setHoveredRegion('shoulder')}
                onMouseLeave={() => setHoveredRegion(null)}
                role="button"
                tabIndex={0}
                aria-label={t('region.shoulder')}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectRegion('shoulder')
                }}
              >
                {/* Left Shoulder Joint Pivot */}
                <circle
                  cx="114"
                  cy="126"
                  r={isShoulderActive ? 14 : 11}
                  fill={isShoulderActive ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.8)'}
                  stroke={isShoulderActive ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  filter={isShoulderActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="114" cy="126" r="4" fill={isShoulderActive ? '#ffffff' : '#94a3b8'} />

                {/* Right Shoulder Joint Pivot (Target Arm) */}
                <circle
                  cx="226"
                  cy="126"
                  r={isShoulderActive ? 18 : 13}
                  fill={isShoulderActive ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.3)'}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  filter={isShoulderActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="226" cy="126" r="5" fill="#ffffff" />

                {/* Rotator Cuff Acromial Arc */}
                <path
                  d="M 212 114 Q 226 108 240 114"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />

                {/* Leader Line to Badge */}
                <path d="M 240 126 L 252 126" stroke={isShoulderActive ? '#38bdf8' : 'rgba(56, 189, 248, 0.5)'} strokeWidth="1.5" />

                {/* Fixed Non-Jumping Tag Badge */}
                <g transform="translate(252, 114)" className="anatomy-tag-badge">
                  <rect
                    rx="4"
                    width="76"
                    height="24"
                    fill={isShoulderActive ? '#0c2238' : '#0f172a'}
                    stroke={isShoulderActive ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'}
                    strokeWidth="1.2"
                  />
                  <text x="38" y="16" textAnchor="middle" fill={isShoulderActive ? '#38bdf8' : '#e0f2fe'} fontSize="11" fontWeight="700" fontFamily="system-ui">
                    [SH] {isEn ? 'Shoulder' : '肩關節'}
                  </text>
                </g>

                {/* Wide Hit Area */}
                <rect x="94" y="100" width="160" height="56" fill="transparent" pointerEvents="all" />
              </g>

              {/* 2. SPINE & POSTURAL AXIS */}
              <g
                id="target-spine"
                className={`anatomy-target-group ${isSpineActive ? 'anatomy-target-group--active' : ''}`}
                onClick={() => onSelectRegion('spine')}
                onMouseEnter={() => setHoveredRegion('spine')}
                onMouseLeave={() => setHoveredRegion(null)}
                role="button"
                tabIndex={0}
                aria-label={t('region.spine')}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectRegion('spine')
                }}
              >
                {/* Central Vertebral Alignment Axis */}
                <line
                  x1="170"
                  y1="82"
                  x2="170"
                  y2="245"
                  stroke={isSpineActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)'}
                  strokeWidth={isSpineActive ? 3.5 : 2.5}
                  strokeDasharray="4 3"
                  filter={isSpineActive ? 'url(#jointGlow)' : undefined}
                />

                {/* Vertebral Nodes */}
                <circle cx="170" cy="95" r={isSpineActive ? 5 : 3.5} fill={isSpineActive ? '#ffffff' : '#64748b'} />
                <circle cx="170" cy="135" r={isSpineActive ? 6 : 4} fill={isSpineActive ? '#ffffff' : '#64748b'} />
                <circle cx="170" cy="175" r={isSpineActive ? 7 : 4.5} fill={isSpineActive ? '#38bdf8' : '#94a3b8'} />
                <circle cx="170" cy="215" r={isSpineActive ? 6 : 4} fill={isSpineActive ? '#ffffff' : '#64748b'} />

                {/* Leader Line to Badge */}
                <path d="M 170 175 L 86 175" stroke={isSpineActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'} strokeWidth="1.5" />

                {/* Fixed Tag Badge */}
                <g transform="translate(18, 163)" className="anatomy-tag-badge">
                  <rect
                    rx="4"
                    width="68"
                    height="24"
                    fill={isSpineActive ? '#0c2238' : '#0f172a'}
                    stroke={isSpineActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)'}
                    strokeWidth="1.2"
                  />
                  <text x="34" y="16" textAnchor="middle" fill={isSpineActive ? '#38bdf8' : '#cbd5e1'} fontSize="11" fontWeight="600" fontFamily="system-ui">
                    [SP] {isEn ? 'Spine' : '脊椎'}
                  </text>
                </g>

                {/* Wide Hit Area */}
                <rect x="145" y="80" width="50" height="170" fill="transparent" pointerEvents="all" />
              </g>

              {/* 3. ELBOW JOINT & CUBITAL / OLECRANON PIVOT */}
              <g
                id="target-elbow"
                className={`anatomy-target-group ${isElbowActive ? 'anatomy-target-group--active' : ''}`}
                onClick={() => onSelectRegion('elbow')}
                onMouseEnter={() => setHoveredRegion('elbow')}
                onMouseLeave={() => setHoveredRegion(null)}
                role="button"
                tabIndex={0}
                aria-label={t('region.elbow')}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectRegion('elbow')
                }}
              >
                {/* Left Elbow Joint Capsule */}
                <circle
                  cx="82"
                  cy="215"
                  r={isElbowActive ? 14 : 10}
                  fill={isElbowActive ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.8)'}
                  stroke={isElbowActive ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  filter={isElbowActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="82" cy="215" r="4" fill={isElbowActive ? '#ffffff' : '#94a3b8'} />

                {/* Right Elbow Joint Capsule */}
                <circle
                  cx="258"
                  cy="215"
                  r={isElbowActive ? 15 : 11}
                  fill={isElbowActive ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.8)'}
                  stroke={isElbowActive ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  filter={isElbowActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="258" cy="215" r="4" fill={isElbowActive ? '#ffffff' : '#94a3b8'} />

                {/* Elbow Articulation Brackets */}
                <path
                  d="M 252 205 Q 266 215 252 225"
                  fill="none"
                  stroke={isElbowActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)'}
                  strokeWidth="2"
                />

                {/* Leader Line to Badge */}
                <path d="M 258 215 L 244 215" stroke={isElbowActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'} strokeWidth="1.5" />

                {/* Fixed Tag Badge */}
                <g transform="translate(254, 230)" className="anatomy-tag-badge">
                  <rect
                    rx="4"
                    width="68"
                    height="24"
                    fill={isElbowActive ? '#0c2238' : '#0f172a'}
                    stroke={isElbowActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)'}
                    strokeWidth="1.2"
                  />
                  <text x="34" y="16" textAnchor="middle" fill={isElbowActive ? '#38bdf8' : '#cbd5e1'} fontSize="11" fontWeight="600" fontFamily="system-ui">
                    [EL] {isEn ? 'Elbow' : '手肘'}
                  </text>
                </g>

                {/* Wide Hit Areas */}
                <circle cx="82" cy="215" r="28" fill="transparent" pointerEvents="all" />
                <circle cx="258" cy="215" r="28" fill="transparent" pointerEvents="all" />
              </g>

              {/* 4. HIP JOINT & ACETABULUM / GREATER TROCHANTER */}
              <g
                id="target-hip"
                className={`anatomy-target-group ${isHipActive ? 'anatomy-target-group--active' : ''}`}
                onClick={() => onSelectRegion('hip')}
                onMouseEnter={() => setHoveredRegion('hip')}
                onMouseLeave={() => setHoveredRegion(null)}
                role="button"
                tabIndex={0}
                aria-label={t('region.hip')}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectRegion('hip')
                }}
              >
                {/* Left Hip Socket Pivot */}
                <circle
                  cx="134"
                  cy="275"
                  r={isHipActive ? 15 : 11}
                  fill={isHipActive ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.8)'}
                  stroke={isHipActive ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  filter={isHipActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="134" cy="275" r="4" fill={isHipActive ? '#ffffff' : '#94a3b8'} />

                {/* Right Hip Socket Pivot */}
                <circle
                  cx="206"
                  cy="275"
                  r={isHipActive ? 15 : 11}
                  fill={isHipActive ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.8)'}
                  stroke={isHipActive ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  filter={isHipActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="206" cy="275" r="4" fill={isHipActive ? '#ffffff' : '#94a3b8'} />

                {/* Pelvic Stability Connecting Bridge */}
                <path
                  d="M 134 275 Q 170 290 206 275"
                  fill="none"
                  stroke={isHipActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />

                {/* Leader Line to Badge */}
                <path d="M 134 275 L 86 275" stroke={isHipActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'} strokeWidth="1.5" />

                {/* Fixed Tag Badge */}
                <g transform="translate(18, 263)" className="anatomy-tag-badge">
                  <rect
                    rx="4"
                    width="68"
                    height="24"
                    fill={isHipActive ? '#0c2238' : '#0f172a'}
                    stroke={isHipActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)'}
                    strokeWidth="1.2"
                  />
                  <text x="34" y="16" textAnchor="middle" fill={isHipActive ? '#38bdf8' : '#cbd5e1'} fontSize="11" fontWeight="600" fontFamily="system-ui">
                    [HP] {isEn ? 'Hip' : '髖關節'}
                  </text>
                </g>

                {/* Wide Hit Area */}
                <rect x="114" y="255" width="112" height="45" fill="transparent" pointerEvents="all" />
              </g>

              {/* 5. KNEE JOINT & PATELLA / CONDYLES */}
              <g
                id="target-knee"
                className={`anatomy-target-group ${isKneeActive ? 'anatomy-target-group--active' : ''}`}
                onClick={() => onSelectRegion('knee')}
                onMouseEnter={() => setHoveredRegion('knee')}
                onMouseLeave={() => setHoveredRegion(null)}
                role="button"
                tabIndex={0}
                aria-label={t('region.knee')}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectRegion('knee')
                }}
              >
                {/* Left Knee Joint / Patella Ring */}
                <circle
                  cx="134"
                  cy="395"
                  r={isKneeActive ? 16 : 12}
                  fill={isKneeActive ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.8)'}
                  stroke={isKneeActive ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  filter={isKneeActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="134" cy="395" r="4.5" fill={isKneeActive ? '#ffffff' : '#94a3b8'} />

                {/* Right Knee Joint / Patella Ring */}
                <circle
                  cx="206"
                  cy="395"
                  r={isKneeActive ? 16 : 12}
                  fill={isKneeActive ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.8)'}
                  stroke={isKneeActive ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  filter={isKneeActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="206" cy="395" r="4.5" fill={isKneeActive ? '#ffffff' : '#94a3b8'} />

                {/* Joint Line Articulation Arcs */}
                <path
                  d="M 124 395 L 144 395 M 196 395 L 216 395"
                  stroke={isKneeActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)'}
                  strokeWidth="2"
                />

                {/* Leader Line to Badge */}
                <path d="M 206 395 L 254 395" stroke={isKneeActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'} strokeWidth="1.5" />

                {/* Fixed Tag Badge */}
                <g transform="translate(254, 383)" className="anatomy-tag-badge">
                  <rect
                    rx="4"
                    width="68"
                    height="24"
                    fill={isKneeActive ? '#0c2238' : '#0f172a'}
                    stroke={isKneeActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)'}
                    strokeWidth="1.2"
                  />
                  <text x="34" y="16" textAnchor="middle" fill={isKneeActive ? '#38bdf8' : '#cbd5e1'} fontSize="11" fontWeight="600" fontFamily="system-ui">
                    [KN] {isEn ? 'Knee' : '膝關節'}
                  </text>
                </g>

                {/* Wide Hit Area */}
                <rect x="114" y="375" width="112" height="45" fill="transparent" pointerEvents="all" />
              </g>

              {/* 6. ANKLE JOINT & TALOCRURAL MORTISE */}
              <g
                id="target-ankle"
                className={`anatomy-target-group ${isAnkleActive ? 'anatomy-target-group--active' : ''}`}
                onClick={() => onSelectRegion('ankle')}
                onMouseEnter={() => setHoveredRegion('ankle')}
                onMouseLeave={() => setHoveredRegion(null)}
                role="button"
                tabIndex={0}
                aria-label={t('region.ankle')}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectRegion('ankle')
                }}
              >
                {/* Left Ankle Mortise Joint Pivot */}
                <circle
                  cx="128"
                  cy="505"
                  r={isAnkleActive ? 14 : 10}
                  fill={isAnkleActive ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.8)'}
                  stroke={isAnkleActive ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  filter={isAnkleActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="128" cy="505" r="4" fill={isAnkleActive ? '#ffffff' : '#94a3b8'} />

                {/* Right Ankle Mortise Joint Pivot */}
                <circle
                  cx="212"
                  cy="505"
                  r={isAnkleActive ? 14 : 10}
                  fill={isAnkleActive ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.8)'}
                  stroke={isAnkleActive ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  filter={isAnkleActive ? 'url(#jointGlow)' : undefined}
                />
                <circle cx="212" cy="505" r="4" fill={isAnkleActive ? '#ffffff' : '#94a3b8'} />

                {/* Malleoli / Mortise Brackets */}
                <path
                  d="M 120 500 L 128 508 L 136 500 M 204 500 L 212 508 L 220 500"
                  fill="none"
                  stroke={isAnkleActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)'}
                  strokeWidth="2"
                />

                {/* Leader Line to Badge */}
                <path d="M 128 505 L 86 505" stroke={isAnkleActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'} strokeWidth="1.5" />

                {/* Fixed Tag Badge */}
                <g transform="translate(18, 493)" className="anatomy-tag-badge">
                  <rect
                    rx="4"
                    width="68"
                    height="24"
                    fill={isAnkleActive ? '#0c2238' : '#0f172a'}
                    stroke={isAnkleActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)'}
                    strokeWidth="1.2"
                  />
                  <text x="34" y="16" textAnchor="middle" fill={isAnkleActive ? '#38bdf8' : '#cbd5e1'} fontSize="11" fontWeight="600" fontFamily="system-ui">
                    [AK] {isEn ? 'Ankle' : '腳踝'}
                  </text>
                </g>

                {/* Wide Hit Area */}
                <rect x="110" y="485" width="120" height="45" fill="transparent" pointerEvents="all" />
              </g>
            </svg>
          </div>
        </div>

        {/* Right: Companion Region Cards Grid */}
        <div className="anatomy-regions-grid">
          {BODY_REGIONS.map((region: BodyRegionInfo) => {
            const counts = getCounts(region.id)
            const isActive = region.status === 'active'
            const isHovered = hoveredRegion === region.id

            return (
              <button
                key={region.id}
                type="button"
                className={`region-card ${isActive ? 'region-card--active' : 'region-card--upcoming'} ${
                  isHovered ? 'region-card--hovered' : ''
                }`}
                onClick={() => onSelectRegion(region.id)}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <div className="region-card__top">
                  <div className="region-card__icon-box">
                    <span className="region-card__code-badge" aria-hidden="true">
                      {region.code}
                    </span>
                    <div>
                      <h3 className="region-card__name">
                        {isEn ? region.nameEn : region.nameZh}
                      </h3>
                      <span className="region-card__tag">
                        {isEn ? region.tagEn : region.tagZh}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`region-status-pill ${
                      isActive ? 'region-status-pill--active' : 'region-status-pill--upcoming'
                    }`}
                  >
                    {isActive ? t('anatomy.activeBadge') : t('anatomy.upcomingBadge')}
                  </span>
                </div>

                <p className="region-card__desc">
                  {isEn ? region.descriptionEn : region.descriptionZh}
                </p>

                {/* Target Musculature Chips */}
                <div className="region-card__muscles">
                  <span className="region-card__muscles-label">
                    {t('anatomy.targetMuscles')}
                  </span>
                  {(isEn ? region.primaryMusclesEn : region.primaryMusclesZh).map((muscle) => (
                    <span key={muscle} className="muscle-chip">
                      {muscle}
                    </span>
                  ))}
                </div>

                {/* Footer Count & CTA */}
                <div className="region-card__footer">
                  <span className="region-card__count">
                    {isActive
                      ? `${t('anatomy.prescribedCount', { n: counts.prescribed })} · ${t(
                          'anatomy.upcomingCount',
                          { n: counts.upcoming }
                        )}`
                      : t('anatomy.totalExercises', { n: counts.total })}
                  </span>
                  <span className="region-card__cta">
                    {t('anatomy.viewRegion')} →
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
