import { useState } from 'react'
import { EXERCISE_CATALOG, resolveExerciseName, localizeExercise } from '../domain/exerciseCatalog'
import type { CompletedSession, BodyRegion } from '../domain/rehabTypes'
import type { RehabRoutine } from '../domain/routineCatalog'
import { BodyAnatomyDiagram } from '../components/BodyAnatomyDiagram'
import { RegionDetailModal } from '../components/RegionDetailModal'
import { ActivityCalendar } from '../components/ActivityCalendar'
import { RecentStatsGrid } from '../components/RecentStatsGrid'
import { RehabLogo } from '../components/RehabLogo'
import { useT } from '../i18n/LocaleContext'
import { formatSessionTime } from '../i18n/datetime'

interface RehabDashboardProps {
  history: CompletedSession[]
  prescriptions?: import('../domain/rehabTypes').UserPrescription[] | undefined
  onStartExercise: (exerciseId: string) => void
  onStartRoutine?: ((routine: RehabRoutine) => void) | undefined
  onNavigateToExercises: () => void
  onNavigateToPrescriptions?: (() => void) | undefined
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
  prescriptions = [],
  onStartExercise,
  onStartRoutine,
  onNavigateToExercises,
  onNavigateToPrescriptions,
  onSelectSession,
}: RehabDashboardProps) {
  const { t, locale } = useT()
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null)

  const activePrescriptions = prescriptions.filter((p) => p.status === 'active')
  const primaryRx = activePrescriptions[0]
  const primaryExercise = primaryRx
    ? EXERCISE_CATALOG.find((e) => e.id === primaryRx.exerciseId) || EXERCISE_CATALOG[0]!
    : EXERCISE_CATALOG[0]!
  const localizedPrimary = localizeExercise(primaryExercise, locale)

  const filteredHistory = selectedDateStr
    ? history.filter((s) => toLocalDateKey(s.timestamp) === selectedDateStr)
    : history

  return (
    <div className="rehab-dashboard">
      {/* 1. Hero Header with Full Logo Emblem */}
      <div className="rehab-hero">
        <div className="rehab-hero__brand-header">
          <RehabLogo variant="full" size={68} className="rehab-hero__logo" />
          <div className="rehab-hero__content">
            <h1 className="rehab-hero__title">{t('dash.heroTitle')}</h1>
            <p className="rehab-hero__sub">{t('dash.heroSub')}</p>
          </div>
        </div>
      </div>

      {/* 2. Prescription / Today's Action Banner */}
      <div className="dashboard-action-banner">
        <div className="dashboard-action-banner__info">
          <div className="section-tag" style={{ marginBottom: '2px' }}>
            <span className="section-tag__dot" aria-hidden="true" />
            <span>
              {activePrescriptions.length > 0
                ? t('rx.dashTodayRx')
                : t('dash.todayRecommend')}
            </span>
          </div>
          <h2 className="dashboard-action-banner__title">
            {primaryRx?.customTitle
              ? primaryRx.customTitle
              : activePrescriptions.length > 0
                ? localizedPrimary.name
                : t('dash.comboTitle')}
          </h2>
          <p className="dashboard-action-banner__desc">
            {activePrescriptions.length > 0
              ? `${localizedPrimary.description} (${t('rx.setsPerDay', { n: String(primaryRx?.dailySetsTarget ?? 2) })} · ${t('rx.durationWeeks', { n: String(primaryRx?.durationWeeks ?? 3) })})`
              : t('dash.comboDesc')}
          </p>
        </div>

        <div className="dashboard-action-banner__actions">
          {onNavigateToPrescriptions ? (
            <button
              className="btn btn--glass"
              onClick={onNavigateToPrescriptions}
              aria-label={t('nav.prescriptions')}
            >
              {activePrescriptions.length > 0 ? t('nav.prescriptions') : t('rx.dashGoToPlan')}
            </button>
          ) : (
            <button
              className="btn btn--glass"
              onClick={onNavigateToExercises}
              aria-label={t('dash.exploreLibraryAria')}
            >
              {t('dash.exploreLibrary')}
            </button>
          )}

          <button
            className="btn btn--primary btn--lg"
            onClick={() => onStartExercise(primaryExercise.id)}
          >
            {t('dash.quickStart')}
          </button>
        </div>
      </div>

      {/* 3. Interactive Body Anatomy Region Explorer */}
      <BodyAnatomyDiagram onSelectRegion={(region) => setSelectedRegion(region)} />

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

      {/* Region Detail Modal */}
      {selectedRegion && (
        <RegionDetailModal
          regionId={selectedRegion}
          onClose={() => setSelectedRegion(null)}
          onStartExercise={onStartExercise}
          onStartRoutine={onStartRoutine}
          onNavigateToLibrary={() => {
            setSelectedRegion(null)
            onNavigateToExercises()
          }}
        />
      )}
    </div>
  )
}

