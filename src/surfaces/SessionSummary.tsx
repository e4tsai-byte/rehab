import type { CompletedSession } from '../domain/rehabTypes'
import { EXERCISE_CATALOG, localizeExercise, resolveExerciseName } from '../domain/exerciseCatalog'
import { useT } from '../i18n/LocaleContext'
import { formatSessionTimeLong } from '../i18n/datetime'

interface SessionSummaryProps {
  session: CompletedSession
  onReturnHome: () => void
}

export function SessionSummary({ session, onReturnHome }: SessionSummaryProps) {
  const { t, locale } = useT()
  const exercise =
    EXERCISE_CATALOG.find((e) => e.id === session.exerciseId) ?? EXERCISE_CATALOG[0]!
  const ex = localizeExercise(exercise, locale)
  const displayName = resolveExerciseName(session.exerciseId, session.exerciseNameZh, locale)

  const didAny = session.completedReps > 0

  return (
    <div className="summary-surface">
      <section className="scorecard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className="scorecard__eyebrow" style={{ margin: 0 }}>{displayName}</p>
          <span style={{ fontSize: '13px', color: 'var(--rehab-ink-tertiary)' }}>
            {formatSessionTimeLong(session.timestamp, locale)}
          </span>
        </div>

        {didAny && (
          <p className="scorecard__count">
            <span>{session.cleanRepsCount}</span>
            <span className="scorecard__count-of">/ {session.completedReps}</span>
          </p>
        )}

        <p className="scorecard__caption">
          {didAny
            ? t('summary.captionDidAny', { done: session.completedReps, clean: session.cleanRepsCount })
            : t('summary.captionNone')}
        </p>

        {didAny && (
          <div className="scorecard__grid">
            <div className="summary-metric">
              <span className="summary-metric__label">{t('summary.completedReps')}</span>
              <span className="summary-metric__val">
                {session.completedReps} / {session.targetReps}
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric__label">{t('summary.avgTopHold')}</span>
              <span className="summary-metric__val">
                {t('spec.secondsValue', { n: session.averageHoldDurationS.toFixed(1) })}
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric__label">{t('summary.peakAngle')}</span>
              <span className="summary-metric__val">{session.peakElevationDeg}°</span>
            </div>
          </div>
        )}
      </section>

      {didAny && (
        <section className="history-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-header__title">{t('summary.detailTitle')}</h2>
            <button
              className="btn btn--quiet btn--sm"
              onClick={() => window.print()}
              title={t('summary.printTitle')}
              style={{ fontSize: '13px' }}
            >
              {t('summary.print')}
            </button>
          </div>

          <div className="rep-log">
            <div className="rep-row rep-row--header" aria-hidden="true">
              <span>{t('rep.colN')}</span>
              <span>{t('rep.colRiseFall')}</span>
              <span>{t('rep.colTopHold')}</span>
              <span>{t('rep.colMaxAngle')}</span>
              <span>{t('rep.colRecord')}</span>
            </div>

            {session.reps.map((rep) => (
              <div className="rep-row" key={rep.index}>
                <span className="rep-row__n">
                  <span className="rep-row__label">{t('rep.colN')}</span>
                  <span>{t('rep.nth', { n: rep.index })}</span>
                </span>
                <span className="rep-row__muted">
                  <span className="rep-row__label">{t('rep.colRiseFall')}</span>
                  <span>
                    {rep.concentricDuration}s / {rep.eccentricDuration}s
                  </span>
                </span>
                <span className="rep-row__muted">
                  <span className="rep-row__label">{t('rep.colTopHold')}</span>
                  <span style={{ color: rep.holdDuration >= 4.5 ? 'var(--rehab-emerald)' : 'inherit' }}>
                    {t('spec.secondsValue', { n: rep.holdDuration.toFixed(1) })}
                  </span>
                </span>
                <span className="rep-row__muted">
                  <span className="rep-row__label">{t('rep.colMaxAngle')}</span>
                  <span>{rep.peakElevation}°</span>
                </span>
                <span>
                  <span className="rep-row__label">{t('rep.colRecord')}</span>
                  <span>
                    {rep.isClean ? (
                      <span className="clean-tag">
                        <span aria-hidden="true">✓</span> {t('rep.onTarget')}
                      </span>
                    ) : (
                      rep.flags.map((flag) => (
                        <span key={flag} className="flag-tag">
                          {ex.commonErrors[flag] ?? flag}
                        </span>
                      ))
                    )}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="summary-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn--primary btn--lg" onClick={onReturnHome}>
          {t('summary.returnHome')}
        </button>
      </div>
    </div>
  )
}
