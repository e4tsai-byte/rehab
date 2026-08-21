import { useState } from 'react'
import { EXERCISE_CATALOG, resolveExerciseName } from '../domain/exerciseCatalog'
import type { CompletedSession } from '../domain/rehabTypes'
import { RecoveryRoadmap } from '../components/RecoveryRoadmap'
import { ActivityCalendar } from '../components/ActivityCalendar'
import { RecentStatsGrid } from '../components/RecentStatsGrid'
import { useT } from '../i18n/LocaleContext'
import { formatSessionTime } from '../i18n/datetime'

interface RehabDashboardProps {
  history: CompletedSession[]
  onStartExercise: (exerciseId: string) => void
  onNavigateToExercises: () => void
  onSelectSession: (session: CompletedSession) => void
}

function toLocalDateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

export function RehabDashboard({
  history,
  onStartExercise,
  onNavigateToExercises,
  onSelectSession,
}: RehabDashboardProps) {
  const { t, locale } = useT()
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)

  const defaultExercise = EXERCISE_CATALOG[0]!

  const filteredHistory = selectedDateStr
    ? history.filter((s) => toLocalDateKey(s.timestamp) === selectedDateStr)
    : history

  return (
    <div className="rehab-dashboard">
      {/* 1. Hero Header */}
      <div className="rehab-hero">
        <h1 className="rehab-hero__title">{t('dash.heroTitle')}</h1>
        <p className="rehab-hero__sub">{t('dash.heroSub')}</p>
      </div>

      {/* 2. Recommended Prescription Today (Top Priority) */}
      <div className="dashboard-action-banner">
        <div className="dashboard-action-banner__info">
          <div className="section-tag" style={{ marginBottom: '2px' }}>
            <span className="section-tag__dot" aria-hidden="true" />
            <span>{t('dash.todayRecommend')}</span>
          </div>
          <h2 className="dashboard-action-banner__title">{t('dash.comboTitle')}</h2>
          <p className="dashboard-action-banner__desc">{t('dash.comboDesc')}</p>
        </div>

        <div className="dashboard-action-banner__actions">
          <button
            className="btn btn--glass"
            onClick={onNavigateToExercises}
            aria-label={t('dash.exploreLibraryAria')}
          >
            {t('dash.exploreLibrary')}
          </button>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => onStartExercise(defaultExercise.id)}
          >
            {t('dash.quickStart')}
          </button>
        </div>
      </div>

      {/* 3. Recovery Progression Roadmap */}
      <RecoveryRoadmap history={history} />

      {/* 4. Recent Biomechanical Stats */}
      <RecentStatsGrid history={history} />

      {/* 5. Activity & Rest-Day Calendar (Directly above History View) */}
      <ActivityCalendar
        history={history}
        selectedDateStr={selectedDateStr}
        onSelectDate={setSelectedDateStr}
      />

      {/* 6. Detailed Session History Drilldown */}
      <div className="history-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--s-3)' }}>
          <div>
            <div className="section-tag">
              <span className="section-tag__dot" aria-hidden="true" />
              <span>{t('dash.recordsTag')}</span>
            </div>
            <h2 className="section-header__title">
              {selectedDateStr
                ? t('dash.recordsTitleFiltered', { date: selectedDateStr })
                : t('dash.recordsTitle')}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--rehab-ink-tertiary)' }}>
              {t('dash.recordsHint')}
            </p>
          </div>
          {selectedDateStr && (
            <button
              className="btn btn--quiet btn--sm"
              onClick={() => setSelectedDateStr(null)}
              style={{ fontSize: '13px' }}
            >
              {t('dash.showAll')}
            </button>
          )}
        </div>

        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">
              {selectedDateStr
                ? t('dash.emptyFilteredTitle', { date: selectedDateStr })
                : t('dash.emptyTitle')}
            </p>
            <p className="empty-state__body">
              {selectedDateStr ? t('dash.emptyFilteredBody') : t('dash.emptyBody')}
            </p>
          </div>
        ) : (
          <div className="history-table">
            <div className="history-row history-row--header" aria-hidden="true">
              <span>{t('col.time')}</span>
              <span>{t('col.movement')}</span>
              <span>{t('col.completedReps')}</span>
              <span>{t('col.avgHold')}</span>
              <span>{t('col.onTarget')}</span>
              <span style={{ textAlign: 'right' }}>{t('col.report')}</span>
            </div>

            {filteredHistory.map((session) => (
              <div
                key={session.id}
                className="history-row history-row--clickable"
                onClick={() => onSelectSession(session)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectSession(session)
                  }
                }}
              >
                <span className="history-row__primary">
                  <span className="history-row__label">{t('col.time')}</span>
                  <span>{formatSessionTime(session.timestamp, locale)}</span>
                </span>
                <span className="history-row__muted">
                  <span className="history-row__label">{t('col.movement')}</span>
                  <span>{resolveExerciseName(session.exerciseId, session.exerciseNameZh, locale)}</span>
                </span>
                <span>
                  <span className="history-row__label">{t('col.completedReps')}</span>
                  <span>{t('dash.repsUnit', { done: session.completedReps, total: session.targetReps })}</span>
                </span>
                <span className="history-row__muted">
                  <span className="history-row__label">{t('col.avgHold')}</span>
                  <span>{t('spec.secondsValue', { n: session.averageHoldDurationS.toFixed(1) })}</span>
                </span>
                <span>
                  <span className="history-row__label">{t('col.onTarget')}</span>
                  <span
                    className={`count-badge ${
                      session.cleanRepsCount === session.completedReps ? 'count-badge--full' : ''
                    }`}
                  >
                    {session.cleanRepsCount} / {session.completedReps}
                  </span>
                </span>
                <span style={{ textAlign: 'right', color: 'var(--rehab-blue-deep)', fontWeight: 600 }}>
                  {t('dash.viewDetail')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
