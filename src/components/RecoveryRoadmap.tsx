import { useState } from 'react'
import {
  RECOVERY_PHASES,
  calculateRecoveryProgress,
  type RecoveryPhase,
} from '../domain/recoveryMilestones'
import type { CompletedSession } from '../domain/rehabTypes'

interface RecoveryRoadmapProps {
  history: CompletedSession[]
}

export function RecoveryRoadmap({ history }: RecoveryRoadmapProps) {
  const progress = calculateRecoveryProgress(history)
  const [selectedPhase, setSelectedPhase] = useState<RecoveryPhase>(progress.currentPhase)

  return (
    <section className="recovery-roadmap" aria-label="肩關節復健進程地圖">
      {/* Top Header */}
      <div className="roadmap-header">
        <div>
          <div className="section-tag">
            <span className="section-tag__dot" aria-hidden="true" />
            <span>臨床復健進程地圖</span>
          </div>
          <h2 className="roadmap-header__title">四階段肩關節功能重塑</h2>
        </div>
        <div className="roadmap-summary-badge">
          <span className="roadmap-summary-badge__label">第 2 階段達成率</span>
          <span className="roadmap-summary-badge__val">{progress.progressPct}%</span>
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="roadmap-stepper" role="tablist" aria-label="復健階段導覽">
        {RECOVERY_PHASES.map((phase) => {
          const isCurrent = phase.id === progress.currentPhase.id
          const isCompleted = phase.phaseNumber < progress.currentPhase.phaseNumber
          const isSelected = phase.id === selectedPhase.id

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
                  <span className="roadmap-step__icon" aria-label="已完成">✓</span>
                ) : isCurrent ? (
                  <span className="roadmap-step__icon roadmap-step__icon--pulse" aria-label="進行中">2</span>
                ) : (
                  <span className="roadmap-step__icon">{phase.phaseNumber}</span>
                )}
              </div>
              <div className="roadmap-step__content">
                <div className="roadmap-step__header-row">
                  <span className="roadmap-step__rom">{phase.targetRomZh}</span>
                  {isCompleted && <span className="roadmap-step__status-tag roadmap-step__status-tag--done">已達成</span>}
                  {isCurrent && <span className="roadmap-step__status-tag roadmap-step__status-tag--active">目前</span>}
                </div>
                <span className="roadmap-step__name">{phase.nameZh}</span>
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
                ? '📍 目前訓練階段'
                : selectedPhase.phaseNumber < progress.currentPhase.phaseNumber
                ? '✓ 已達成階段'
                : '🔒 後續解鎖階段'}
            </span>
            <h3 className="roadmap-details__title">
              第 {selectedPhase.phaseNumber} 階段：{selectedPhase.nameZh}
            </h3>
          </div>
          <div className="roadmap-details__rom-pill">
            目標活動度：<strong>{selectedPhase.targetRomZh}</strong>
          </div>
        </div>

        <p className="roadmap-details__desc">{selectedPhase.descriptionZh}</p>

        {selectedPhase.id === progress.currentPhase.id && (
          <div className="roadmap-metrics-card">
            <div className="roadmap-metrics-card__row">
              <div className="roadmap-metric">
                <span className="roadmap-metric__label">本階段處方完成度</span>
                <span className="roadmap-metric__val">
                  {progress.completedSetsInPhase} <span className="roadmap-metric__target">/ {progress.targetSetsForPhase} 組</span>
                </span>
              </div>
              <div className="roadmap-metric">
                <span className="roadmap-metric__label">動作標準率 (無聳肩)</span>
                <span className="roadmap-metric__val roadmap-metric__val--green">
                  {progress.cleanMovementRatePct}%
                </span>
              </div>
              <div className="roadmap-metric">
                <span className="roadmap-metric__label">平均抬起高度</span>
                <span className="roadmap-metric__val roadmap-metric__val--blue">
                  {progress.avgElevationDeg}°
                </span>
              </div>
            </div>

            {/* Visual Progress Track */}
            <div className="roadmap-progress-wrap">
              <div className="roadmap-progress-wrap__labels">
                <span>第 2 階段處方目標 (20 組)</span>
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
            <strong>臨床評估準則：</strong>{selectedPhase.criteriaZh}
            <span className="roadmap-clinical-note__sub">{selectedPhase.clinicalNoteZh}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
