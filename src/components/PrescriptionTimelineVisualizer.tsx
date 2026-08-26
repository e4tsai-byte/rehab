import {
  EXERCISE_CATALOG,
  localizeExercise,
} from '../domain/exerciseCatalog'
import type { UserPrescription } from '../domain/rehabTypes'
import { useT } from '../i18n/LocaleContext'

interface PrescriptionTimelineVisualizerProps {
  prescriptions: UserPrescription[]
  onSelectPrescription?: (prescription: UserPrescription) => void
}

interface TimelineItem {
  rx: UserPrescription
  exerciseName: string
  regionCode: string
  startWeek: number // 1-indexed
  endWeek: number // inclusive
  durationWeeks: number
  status: 'active' | 'queued' | 'completed'
  progressPercent: number
  currentWeek: number
}

const REGION_SHORT_CODES: Record<string, string> = {
  shoulder: 'SH',
  knee: 'KN',
  hip: 'HP',
  elbow: 'EL',
  spine: 'SP',
  ankle: 'AK',
}

export function PrescriptionTimelineVisualizer({
  prescriptions,
  onSelectPrescription,
}: PrescriptionTimelineVisualizerProps) {
  const { t, locale } = useT()

  if (prescriptions.length === 0) {
    return (
      <div className="rx-timeline-card rx-timeline-card--empty">
        <div className="rx-timeline-card__head">
          <div className="section-tag" style={{ marginBottom: '4px' }}>
            <span className="section-tag__dot" aria-hidden="true" />
            <span>{t('rx.tag')}</span>
          </div>
          <h2 className="rx-timeline-card__title">{t('timeline.title')}</h2>
          <p className="rx-timeline-card__sub">{t('timeline.emptyTimeline')}</p>
        </div>
      </div>
    )
  }

  const activeRxs = prescriptions.filter((p) => p.status === 'active')
  const queuedRxs = prescriptions.filter((p) => p.status === 'queued')
  const completedRxs = prescriptions.filter((p) => p.status === 'completed')

  // Calculate active phase duration (longest active duration)
  const activeDuration = activeRxs.reduce(
    (max, p) => Math.max(max, p.durationWeeks),
    activeRxs.length > 0 ? 3 : 0
  )

  // Build items with timeline positioning
  const timelineItems: TimelineItem[] = []

  // 1. Completed Items
  completedRxs.forEach((rx) => {
    const ex = EXERCISE_CATALOG.find((e) => e.id === rx.exerciseId)
    const loc = ex ? localizeExercise(ex, locale) : null
    const regionCode = REGION_SHORT_CODES[ex?.bodyRegion ?? ''] || 'RX'
    timelineItems.push({
      rx,
      exerciseName: rx.customTitle || loc?.name || rx.exerciseId,
      regionCode,
      startWeek: 1,
      endWeek: rx.durationWeeks,
      durationWeeks: rx.durationWeeks,
      status: 'completed',
      progressPercent: 100,
      currentWeek: rx.durationWeeks,
    })
  })

  // 2. Active Items (all parallel starting at Week 1)
  activeRxs.forEach((rx) => {
    const ex = EXERCISE_CATALOG.find((e) => e.id === rx.exerciseId)
    const loc = ex ? localizeExercise(ex, locale) : null
    const regionCode = REGION_SHORT_CODES[ex?.bodyRegion ?? ''] || 'RX'
    const now = Date.now()
    const diffMs = Math.max(0, now - rx.startedAt)
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const currentWeek = Math.min(rx.durationWeeks, Math.floor(diffDays / 7) + 1)
    const progressPercent = Math.min(100, Math.round((currentWeek / rx.durationWeeks) * 100))

    timelineItems.push({
      rx,
      exerciseName: rx.customTitle || loc?.name || rx.exerciseId,
      regionCode,
      startWeek: 1,
      endWeek: rx.durationWeeks,
      durationWeeks: rx.durationWeeks,
      status: 'active',
      progressPercent,
      currentWeek,
    })
  })

  // 3. Queued Items (start after active phase)
  const queuedStartWeek = Math.max(1, activeDuration + 1)
  queuedRxs.forEach((rx) => {
    const ex = EXERCISE_CATALOG.find((e) => e.id === rx.exerciseId)
    const loc = ex ? localizeExercise(ex, locale) : null
    const regionCode = REGION_SHORT_CODES[ex?.bodyRegion ?? ''] || 'RX'
    timelineItems.push({
      rx,
      exerciseName: rx.customTitle || loc?.name || rx.exerciseId,
      regionCode,
      startWeek: queuedStartWeek,
      endWeek: queuedStartWeek + rx.durationWeeks - 1,
      durationWeeks: rx.durationWeeks,
      status: 'queued',
      progressPercent: 0,
      currentWeek: 0,
    })
  })

  // Calculate total timeline width in weeks (minimum 8 weeks)
  const maxEndWeek = timelineItems.reduce((max, item) => Math.max(max, item.endWeek), 8)
  const totalWeeks = Math.max(8, maxEndWeek)
  const weekNumbers = Array.from({ length: totalWeeks }, (_, i) => i + 1)

  return (
    <div className="rx-timeline-card" aria-label={t('timeline.title')}>
      {/* Header with Title & Subtitle */}
      <div className="rx-timeline-card__head">
        <div className="rx-timeline-card__title-row">
          <div>
            <div className="section-tag" style={{ marginBottom: '4px' }}>
              <span className="section-tag__dot" aria-hidden="true" />
              <span>{t('rx.tag')}</span>
            </div>
            <h2 className="rx-timeline-card__title">{t('timeline.title')}</h2>
            <p className="rx-timeline-card__sub">{t('timeline.sub')}</p>
          </div>

          {/* Visual Legend */}
          <div className="rx-timeline-legend" aria-hidden="true">
            <div className="rx-legend-item">
              <span className="rx-legend-dot rx-legend-dot--active" />
              <span>{t('timeline.legendCurrent')}</span>
            </div>
            <div className="rx-legend-item">
              <span className="rx-legend-dot rx-legend-dot--queued" />
              <span>{t('timeline.legendQueued')}</span>
            </div>
            {completedRxs.length > 0 && (
              <div className="rx-legend-item">
                <span className="rx-legend-dot rx-legend-dot--completed" />
                <span>{t('timeline.legendCompleted')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Visual Chart Container */}
      <div className="rx-timeline-grid-wrapper">
        <div className="rx-timeline-chart">
          {/* Top Week Axis Bar */}
          <div className="rx-timeline-axis">
            <div className="rx-timeline-axis__label-col">
              <span className="rx-timeline-axis__heading">MOVEMENT / PHASE</span>
            </div>
            <div className="rx-timeline-axis__weeks-col">
              {weekNumbers.map((w) => {
                const isCurrentActive = w <= activeDuration && activeRxs.length > 0
                return (
                  <div
                    key={w}
                    className={`rx-timeline-week-cell ${isCurrentActive ? 'rx-timeline-week-cell--active' : ''
                      }`}
                  >
                    <span>W{w}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Swimlanes / Movement Rows */}
          <div className="rx-timeline-swimlanes">
            {/* Active Current Week Indicator Line */}
            {activeRxs.length > 0 && (
              <div
                className="rx-timeline-current-indicator"
                style={{
                  left: `calc(var(--rx-label-width, 240px) + (100% - var(--rx-label-width, 240px)) * (0.5 / ${totalWeeks}))`,
                }}
                title={t('timeline.currentWeekMarker')}
              >
                <div className="rx-timeline-current-indicator__pill">
                  {t('timeline.currentWeekMarker')}
                </div>
              </div>
            )}

            {timelineItems.map((item, idx) => {
              const leftPercent = ((item.startWeek - 1) / totalWeeks) * 100
              const widthPercent = (item.durationWeeks / totalWeeks) * 100

              return (
                <div
                  key={`${item.rx.id}-${idx}`}
                  className={`rx-timeline-row rx-timeline-row--${item.status}`}
                  onClick={() => onSelectPrescription && onSelectPrescription(item.rx)}
                  role={onSelectPrescription ? 'button' : undefined}
                  tabIndex={onSelectPrescription ? 0 : undefined}
                  aria-label={`${item.exerciseName} - ${item.durationWeeks} weeks`}
                >
                  {/* Left Label Column */}
                  <div className="rx-timeline-row__label">
                    <span className="rx-timeline-code" aria-hidden="true">
                      {item.regionCode}
                    </span>
                    <div className="rx-timeline-row__text">
                      <span className="rx-timeline-row__name" title={item.exerciseName}>
                        {item.exerciseName}
                      </span>
                      <span className="rx-timeline-row__specs">
                        {t('rx.durationWeeks', { n: String(item.durationWeeks) })} ·{' '}
                        {t('rx.setsPerDay', { n: String(item.rx.dailySetsTarget) })}
                      </span>
                    </div>
                  </div>

                  {/* Right Timeline Bar Track */}
                  <div className="rx-timeline-row__track">
                    {/* Background Grid Lines */}
                    <div className="rx-timeline-bg-grid" aria-hidden="true">
                      {weekNumbers.map((w) => (
                        <div key={w} className="rx-timeline-bg-cell" />
                      ))}
                    </div>

                    {/* Colored Duration Pill Bar */}
                    <div
                      className={`rx-timeline-bar rx-timeline-bar--${item.status}`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      {/* Active Progress Gradient Fill */}
                      {item.status === 'active' && item.progressPercent > 0 && (
                        <div
                          className="rx-timeline-bar__active-fill"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      )}

                      {/* Clean Non-Overlapping Label */}
                      <div className="rx-timeline-bar__inner">
                        <span className="rx-timeline-bar__badge">
                          {item.status === 'active'
                            ? `W1–W${item.durationWeeks} · Active`
                            : item.status === 'queued'
                              ? `W${item.startWeek}–W${item.endWeek} · Queued`
                              : `Completed`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
