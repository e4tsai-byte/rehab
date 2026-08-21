import { useState } from 'react'
import { calculateRecentStats } from '../domain/recoveryMilestones'
import type { CompletedSession } from '../domain/rehabTypes'

interface RecentStatsGridProps {
  history: CompletedSession[]
}

export function RecentStatsGrid({ history }: RecentStatsGridProps) {
  const [periodDays, setPeriodDays] = useState<number>(7)
  const stats = calculateRecentStats(history, periodDays)

  return (
    <section className="recent-stats-section" aria-label="近期復健成效數據">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--s-3)' }}>
        <div>
          <div className="section-tag">
            <span className="section-tag__dot" aria-hidden="true" />
            <span>臨床生物力學指標</span>
          </div>
          <h2 className="section-header__title">近期訓練品質與活動度分析</h2>
        </div>

        {/* 7d vs 30d toggle */}
        <div className="segmented segmented--sm" role="group" aria-label="分析時間範圍">
          <button
            type="button"
            className="segmented__item"
            aria-selected={periodDays === 7}
            onClick={() => setPeriodDays(7)}
          >
            近 7 天
          </button>
          <button
            type="button"
            className="segmented__item"
            aria-selected={periodDays === 30}
            onClick={() => setPeriodDays(30)}
          >
            近 30 天
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {/* Card 1: Volume */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon-badge" aria-hidden="true">📊</span>
            <span className="stat-card__period">近 {periodDays} 天累計</span>
          </div>
          <span className="stat-card__val stat-card__val--blue">
            {stats.totalReps} <span className="stat-card__unit">次</span>
          </span>
          <span className="stat-card__label">累計訓練動作次數</span>
          
          <div className="stat-card__mini-bar">
            <div
              className="stat-card__mini-bar-fill"
              style={{ width: `${Math.min(100, (stats.totalReps / (periodDays * 10)) * 100)}%`, background: 'var(--rehab-blue-deep)' }}
            />
          </div>

          <div className="stat-card__sub-row">
            <span>{stats.totalSets} 組處方</span>
            <span>·</span>
            <span>活躍 {stats.daysActiveInPeriod} 天</span>
          </div>
        </div>

        {/* Card 2: Peak Angle */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon-badge" aria-hidden="true">📐</span>
            <span className="stat-card__period">目標 90° 水平</span>
          </div>
          <span className="stat-card__val stat-card__val--green">
            {stats.avgPeakElevationDeg > 0 ? stats.avgPeakElevationDeg : '--'}
            {stats.avgPeakElevationDeg > 0 && <span className="stat-card__unit">°</span>}
          </span>
          <span className="stat-card__label">平均最高抬起角度</span>

          <div className="stat-card__mini-bar">
            <div
              className="stat-card__mini-bar-fill"
              style={{ width: `${Math.min(100, (stats.avgPeakElevationDeg / 90) * 100)}%`, background: 'var(--rehab-green-deep)' }}
            />
          </div>

          <div className="stat-card__sub-row">
            <span>
              {stats.avgPeakElevationDeg >= 85 && stats.avgPeakElevationDeg <= 95
                ? '🎯 落在處方目標區間'
                : stats.avgPeakElevationDeg > 0
                ? '動作控制穩定'
                : '尚無近期紀錄'}
            </span>
          </div>
        </div>

        {/* Card 3: Hold Stability */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon-badge" aria-hidden="true">⏱️</span>
            <span className="stat-card__period">處方 5.0 秒</span>
          </div>
          <span className="stat-card__val stat-card__val--orange">
            {stats.avgHoldDurationS > 0 ? stats.avgHoldDurationS.toFixed(1) : '--'}
            {stats.avgHoldDurationS > 0 && <span className="stat-card__unit">秒</span>}
          </span>
          <span className="stat-card__label">平均頂點等長停頓</span>

          <div className="stat-card__mini-bar">
            <div
              className="stat-card__mini-bar-fill"
              style={{ width: `${Math.min(100, (stats.avgHoldDurationS / 5.0) * 100)}%`, background: 'var(--rehab-orange-deep)' }}
            />
          </div>

          <div className="stat-card__sub-row">
            <span>
              {stats.avgHoldDurationS >= 4.5
                ? '等長肌耐力良好'
                : stats.avgHoldDurationS > 0
                ? '維持滿 5 秒穩定'
                : '尚無近期紀錄'}
            </span>
          </div>
        </div>

        {/* Card 4: Form Clean Rate */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon-badge" aria-hidden="true">🛡️</span>
            <span className="stat-card__period">無代償動作</span>
          </div>
          <span className="stat-card__val">
            {stats.totalReps > 0 ? `${stats.cleanMovementRatePct}%` : '--'}
          </span>
          <span className="stat-card__label">動作標準率</span>

          <div className="stat-card__mini-bar">
            <div
              className="stat-card__mini-bar-fill"
              style={{ width: `${stats.cleanMovementRatePct}%`, background: 'linear-gradient(90deg, var(--rehab-blue-deep), var(--rehab-green-deep))' }}
            />
          </div>

          <div className="stat-card__sub-row">
            <span>
              {stats.cleanReps} / {stats.totalReps} 次達標無代償
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
