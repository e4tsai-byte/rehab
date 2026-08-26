import { useState, useEffect } from 'react'
import { EXERCISE_CATALOG, localizeExercise } from '../domain/exerciseCatalog'
import type { UserPrescription, PrescriptionStatus } from '../domain/rehabTypes'
import { useT } from '../i18n/LocaleContext'

interface PrescriptionEditorModalProps {
  initialPrescription?: UserPrescription | null
  initialExerciseId?: string | null
  onSave: (prescription: UserPrescription) => void
  onClose: () => void
}

export function PrescriptionEditorModal({
  initialPrescription,
  initialExerciseId,
  onSave,
  onClose,
}: PrescriptionEditorModalProps) {
  const { t, locale } = useT()

  // Available exercises only
  const availableExercises = EXERCISE_CATALOG.filter((ex) => ex.status === 'available')

  const defaultExId =
    initialPrescription?.exerciseId ||
    initialExerciseId ||
    availableExercises[0]?.id ||
    'right-arm-forward-flexion-standing'

  const [exerciseId, setExerciseId] = useState<string>(defaultExId)
  const [customTitle, setCustomTitle] = useState<string>(initialPrescription?.customTitle || '')
  const [durationWeeks, setDurationWeeks] = useState<number>(
    initialPrescription?.durationWeeks ?? 3
  )
  const [dailySetsTarget, setDailySetsTarget] = useState<number>(
    initialPrescription?.dailySetsTarget ?? 2
  )
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState<number>(
    initialPrescription?.targetDaysPerWeek ?? 5
  )
  const [status, setStatus] = useState<PrescriptionStatus>(
    initialPrescription?.status ?? 'active'
  )
  const [notes, setNotes] = useState<string>(initialPrescription?.notes || '')

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const prescription: UserPrescription = {
      id: initialPrescription?.id || `rx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      exerciseId,
      customTitle: customTitle.trim() || undefined,
      durationWeeks: Math.max(1, Math.min(12, durationWeeks)),
      dailySetsTarget: Math.max(1, Math.min(6, dailySetsTarget)),
      targetDaysPerWeek: Math.max(1, Math.min(7, targetDaysPerWeek)),
      status,
      order: initialPrescription?.order ?? 0,
      startedAt: initialPrescription?.startedAt ?? Date.now(),
      notes: notes.trim() || undefined,
    }
    onSave(prescription)
  }

  const selectedExercise = availableExercises.find((e) => e.id === exerciseId)
  const localizedEx = selectedExercise ? localizeExercise(selectedExercise, locale) : null

  return (
    <div
      className="sheet-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="sheet sheet--wide rx-editor-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rx-editor-title"
      >
        {/* Header */}
        <div className="sheet__header">
          <div>
            <span className="section-tag" style={{ marginBottom: '4px' }}>
              <span className="section-tag__dot" aria-hidden="true" />
              <span>{t('rx.tag')}</span>
            </span>
            <h2 id="rx-editor-title" className="sheet__title">
              {initialPrescription ? t('rxModal.editTitle') : t('rxModal.addTitle')}
            </h2>
          </div>
          <button
            type="button"
            className="sheet__close"
            onClick={onClose}
            aria-label={t('settings.close')}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="rx-editor-form">
          {/* Exercise Selector */}
          <div className="form-group">
            <label htmlFor="rx-exercise-select" className="form-label">
              {t('rxModal.selectExercise')}
            </label>
            <select
              id="rx-exercise-select"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="form-select"
              required
            >
              {availableExercises.map((ex) => {
                const loc = localizeExercise(ex, locale)
                return (
                  <option key={ex.id} value={ex.id}>
                    [{ex.bodyRegion.toUpperCase()}] {loc.name} ({loc.category})
                  </option>
                )
              })}
            </select>
            {localizedEx && (
              <p className="form-hint" style={{ marginTop: '6px' }}>
                {localizedEx.description}
              </p>
            )}
          </div>

          {/* Custom Label / Stage Title */}
          <div className="form-group">
            <label htmlFor="rx-custom-title" className="form-label">
              {t('rxModal.customTitle')}
            </label>
            <input
              id="rx-custom-title"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={t('rxModal.customTitlePlaceholder')}
              className="form-input"
            />
          </div>

          {/* Schedule Mode Selection */}
          <div className="form-group">
            <label className="form-label">{t('rxModal.scheduleMode')}</label>
            <div className="rx-mode-toggle-group">
              <button
                type="button"
                className={`rx-mode-btn ${status === 'active' ? 'rx-mode-btn--active' : ''}`}
                onClick={() => setStatus('active')}
              >
                <span className="rx-mode-btn__title">{t('rxModal.modeActive')}</span>
              </button>
              <button
                type="button"
                className={`rx-mode-btn ${status === 'queued' ? 'rx-mode-btn--active' : ''}`}
                onClick={() => setStatus('queued')}
              >
                <span className="rx-mode-btn__title">{t('rxModal.modeQueued')}</span>
              </button>
            </div>
          </div>

          {/* Grid Parameters: Duration, Sets, Days */}
          <div className="rx-params-grid">
            {/* Duration in Weeks */}
            <div className="form-group">
              <label htmlFor="rx-duration-input" className="form-label">
                {t('rxModal.duration')}
              </label>
              <div className="rx-num-picker">
                {[1, 2, 3, 4, 6, 8, 12].map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`rx-chip-btn ${durationWeeks === w ? 'rx-chip-btn--active' : ''}`}
                    onClick={() => setDurationWeeks(w)}
                  >
                    {w}w
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Sets Target */}
            <div className="form-group">
              <label htmlFor="rx-sets-input" className="form-label">
                {t('rxModal.dailySets')}
              </label>
              <div className="rx-num-picker">
                {[1, 2, 3, 4].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`rx-chip-btn ${dailySetsTarget === s ? 'rx-chip-btn--active' : ''}`}
                    onClick={() => setDailySetsTarget(s)}
                  >
                    {s} {t('fmt.sets', { n: '' }).trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Days Target */}
            <div className="form-group">
              <label htmlFor="rx-days-input" className="form-label">
                {t('rxModal.weeklyDays')}
              </label>
              <div className="rx-num-picker">
                {[3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`rx-chip-btn ${targetDaysPerWeek === d ? 'rx-chip-btn--active' : ''}`}
                    onClick={() => setTargetDaysPerWeek(d)}
                  >
                    {d} {t('fmt.days', { n: '' }).trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clinician / PT Notes */}
          <div className="form-group">
            <label htmlFor="rx-notes-input" className="form-label">
              {t('rxModal.notes')}
            </label>
            <textarea
              id="rx-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('rxModal.notesPlaceholder')}
              rows={3}
              className="form-textarea"
            />
          </div>

          {/* Action Buttons */}
          <div className="sheet__actions" style={{ marginTop: 'var(--s-6)' }}>
            <button type="button" className="btn btn--quiet" onClick={onClose}>
              {t('rxModal.cancel')}
            </button>
            <button type="submit" className="btn btn--primary">
              {t('rxModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
