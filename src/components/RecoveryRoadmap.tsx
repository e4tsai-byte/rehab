import { useState } from 'react'
import {
  RECOVERY_PHASES,
  calculateRecoveryProgress,
  localizePhase,
  type RecoveryPhase,
} from '../domain/recoveryMilestones'
import type { CompletedSession } from '../domain/rehabTypes'
import { useT } from '../i18n/LocaleContext'

interface RecoveryRoadmapProps {
  history: CompletedSession[]
}

export function RecoveryRoadmap({ history }: RecoveryRoadmapProps) {
  const { t, locale } = useT()
  const progress = calculateRecoveryProgress(history)
  const [selectedPhase, setSelectedPhase] = useState<RecoveryPhase>(progress.currentPhase)
  const selected = localizePhase(selectedPhase, locale)

  return (
    <section className="recovery-roadmap" aria-label={t('road.aria')}>
      {/* Top Header */}
      <div className="roadmap-header">
        <div>
          <div className="section-tag">
            <span className="section-tag__dot" aria-hidden="true" />
            <span>{t('road.tag')}</span>
          </div>
          <h2 className="roadmap-header__title">{t('road.title')}</h2>
        </div>
        <div className="roadmap-summary-badge">
          <span className="roadmap-summary-badge__label">{t('road.phase2Rate')}</span>
          <span className="roadmap-summary-badge__val">{progress.progressPct}%</span>
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="roadmap-stepper" role="tablist" aria-label={t('road.stepperAria')}>
        {RECOVERY_PHASES.map((phase) => {
          const isCurrent = phase.id === progress.currentPhase.id
          const isCompleted = phase.phaseNumber < progress.currentPhase.phaseNumber
          const isSelected = phase.id === selectedPhase.id
          const p = localizePhase(phase, locale)

          return (
            <button
              key={phase.id}
              role="tab"
              aria-selected={isSelected}
              className={`roadmap-step ${isCurrent ? 'roadmap-step--current' : ''} ${
                isCompleted ? 'roadmap-step--completed' : ''
              } ${isSelected ? 'roadmap-step--selected' : ''}`}
              onClick={() => setSelectedPhase(phase)}
            >
              <div className="roadmap-step__indicator">
                {isCompleted ? (
                  <span className="roadmap-step__icon" aria-label={t('road.stepDone')}>✓</span>
                ) : isCurrent ? (
                  <span className="roadmap-step__icon roadmap-step__icon--pulse" aria-label={t('road.stepCurrent')}>{phase.phaseNumber}</span>
                ) : (
                  <span className="roadmap-step__icon">{phase.phaseNumber}</span>
                )}
              </div>
              <div className="roadmap-step__content">
                <div className="roadmap-step__header-row">
                  <span className="roadmap-step__rom">{p.targetRom}</span>
                  {isCompleted && <span className="roadmap-step__status-tag roadmap-step__status-tag--done">{t('road.statusDone')}</span>}
                  {isCurrent && <span className="roadmap-step__status-tag roadmap-step__status-tag--active">{t('road.statusCurrent')}</span>}
                </div>
                <span className="roadmap-step__name">{p.name}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Active / Selected Phase Details Card */}
      <div className="roadmap-details">
        <div className="roadmap-details__header">
          <div>
            <span className="roadmap-details__phase-tag">
              {selectedPhase.id === progress.currentPhase.id
                ? t('road.detailCurrent')
                : selectedPhase.phaseNumber < progress.currentPhase.phaseNumber
                ? t('road.detailDone')
                : t('road.detailLocked')}
            </span>
            <h3 className="roadmap-details__title">
              {t('road.detailTitle', { n: selectedPhase.phaseNumber, name: selected.name })}
            </h3>
          </div>
          <div className="roadmap-details__rom-pill">
            {t('road.targetRom')}<strong>{selected.targetRom}</strong>
          </div>
        </div>

        <p className="roadmap-details__desc">{selected.description}</p>

        {selectedPhase.id === progress.currentPhase.id && (
          <div className="roadmap-metrics-card">
            <div className="roadmap-metrics-card__row">
              <div className="roadmap-metric">
                <span className="roadmap-metric__label">{t('road.metricSets')}</span>
                <span className="roadmap-metric__val">
                  {progress.completedSetsInPhase} <span className="roadmap-metric__target">{t('road.metricSetsVal', { total: progress.targetSetsForPhase })}</span>
                </span>
              </div>
              <div className="roadmap-metric">
                <span className="roadmap-metric__label">{t('road.metricClean')}</span>
                <span className="roadmap-metric__val roadmap-metric__val--green">
                  {progress.cleanMovementRatePct}%
                </span>
              </div>
              <div className="roadmap-metric">
                <span className="roadmap-metric__label">{t('road.metricAngle')}</span>
                <span className="roadmap-metric__val roadmap-metric__val--blue">
                  {progress.avgElevationDeg}°
                </span>
              </div>
            </div>

            {/* Visual Progress Track */}
            <div className="roadmap-progress-wrap">
              <div className="roadmap-progress-wrap__labels">
                <span>{t('road.progressLabel')}</span>
                <span>{progress.progressPct}%</span>
              </div>
              <div className="roadmap-progress-bar">
                <div
                  className="roadmap-progress-bar__fill"
                  style={{ width: `${progress.progressPct}%` }}
                  role="progressbar"
                  aria-valuenow={progress.progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          </div>
        )}

        {/* Clinical Note Box */}
        <div className="roadmap-clinical-note">
          <span className="roadmap-clinical-note__icon" aria-hidden="true">🩺</span>
          <div className="roadmap-clinical-note__text">
            <strong>{t('road.clinicalLabel')}</strong>{selected.criteria}
            <span className="roadmap-clinical-note__sub">{selected.clinicalNote}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
