import { useState } from 'react'
import { calculateRecentStats } from '../domain/recoveryMilestones'
import type { CompletedSession } from '../domain/rehabTypes'
import { useT } from '../i18n/LocaleContext'

interface RecentStatsGridProps {
  history: CompletedSession[]
}

export function RecentStatsGrid({ history }: RecentStatsGridProps) {
  const { t } = useT()
  const [periodDays, setPeriodDays] = useState<number>(7)
  const stats = calculateRecentStats(history, periodDays)

  return (
    <section className="recent-stats-section" aria-label={t('stats.aria')}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--s-3)' }}>
        <div>
          <div className="section-tag">
            <span className="section-tag__dot" aria-hidden="true" />
            <span>{t('stats.tag')}</span>
          </div>
          <h2 className="section-header__title">{t('stats.title')}</h2>
        </div>

        {/* 7d vs 30d toggle */}
        <div className="segmented segmented--sm" role="group" aria-label={t('stats.rangeAria')}>
          <button
            type="button"
            className="segmented__item"
            aria-selected={periodDays === 7}
            onClick={() => setPeriodDays(7)}
          >
            {t('stats.last7')}
          </button>
          <button
            type="button"
            className="segmented__item"
            aria-selected={periodDays === 30}
            onClick={() => setPeriodDays(30)}
          >
            {t('stats.last30')}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {/* Card 1: Volume */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="section-tag__dot" aria-hidden="true" />
            <span className="stat-card__period">{t('stats.volumePeriod', { n: periodDays })}</span>
          </div>
          <span className="stat-card__val stat-card__val--blue">
            {stats.totalReps} <span className="stat-card__unit">{t('stats.volumeUnit')}</span>
          </span>
          <span className="stat-card__label">{t('stats.volumeLabel')}</span>

          <div className="stat-card__mini-bar">
            <div
              className="stat-card__mini-bar-fill"
              style={{ width: `${Math.min(100, (stats.totalReps / (periodDays * 10)) * 100)}%`, background: 'var(--rehab-blue-deep)' }}
            />
          </div>

          <div className="stat-card__sub-row">
            <span>{t('stats.setsSub', { n: stats.totalSets })}</span>
            <span>·</span>
            <span>{t('stats.activeDays', { n: stats.daysActiveInPeriod })}</span>
          </div>
        </div>

        {/* Card 2: Peak Angle */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="section-tag__dot" aria-hidden="true" />
            <span className="stat-card__period">{t('stats.angleTarget')}</span>
          </div>
          <span className="stat-card__val stat-card__val--green">
            {stats.avgPeakElevationDeg > 0 ? stats.avgPeakElevationDeg : '--'}
            {stats.avgPeakElevationDeg > 0 && <span className="stat-card__unit">°</span>}
          </span>
          <span className="stat-card__label">{t('stats.angleLabel')}</span>

          <div className="stat-card__mini-bar">
            <div
              className="stat-card__mini-bar-fill"
              style={{ width: `${Math.min(100, (stats.avgPeakElevationDeg / 90) * 100)}%`, background: 'var(--rehab-green-deep)' }}
            />
          </div>

          <div className="stat-card__sub-row">
            <span>
              {stats.avgPeakElevationDeg >= 85 && stats.avgPeakElevationDeg <= 95
                ? t('stats.angleInTarget')
                : stats.avgPeakElevationDeg > 0
                ? t('stats.angleStable')
                : t('stats.noRecent')}
            </span>
          </div>
        </div>

        {/* Card 3: Hold Stability */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="section-tag__dot" aria-hidden="true" />
            <span className="stat-card__period">{t('stats.holdTarget')}</span>
          </div>
          <span className="stat-card__val stat-card__val--orange">
            {stats.avgHoldDurationS > 0 ? stats.avgHoldDurationS.toFixed(1) : '--'}
            {stats.avgHoldDurationS > 0 && <span className="stat-card__unit">{t('stats.holdUnit')}</span>}
          </span>
          <span className="stat-card__label">{t('stats.holdLabel')}</span>

          <div className="stat-card__mini-bar">
            <div
              className="stat-card__mini-bar-fill"
              style={{ width: `${Math.min(100, (stats.avgHoldDurationS / 5.0) * 100)}%`, background: 'var(--rehab-orange-deep)' }}
            />
          </div>

          <div className="stat-card__sub-row">
            <span>
              {stats.avgHoldDurationS >= 4.5
                ? t('stats.holdGood')
                : stats.avgHoldDurationS > 0
                ? t('stats.holdMaintain')
                : t('stats.noRecent')}
            </span>
          </div>
        </div>

        {/* Card 4: Form Clean Rate */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="section-tag__dot" aria-hidden="true" />
            <span className="stat-card__period">{t('stats.formTarget')}</span>
          </div>
          <span className="stat-card__val">
            {stats.totalReps > 0 ? `${stats.cleanMovementRatePct}%` : '--'}
          </span>
          <span className="stat-card__label">{t('stats.formLabel')}</span>

          <div className="stat-card__mini-bar">
            <div
              className="stat-card__mini-bar-fill"
              style={{ width: `${stats.cleanMovementRatePct}%`, background: 'linear-gradient(90deg, var(--rehab-blue-deep), var(--rehab-green-deep))' }}
            />
          </div>

          <div className="stat-card__sub-row">
            <span>{t('stats.formSub', { clean: stats.cleanReps, total: stats.totalReps })}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
