import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { EXERCISE_CATALOG, localizeExercise } from '../domain/exerciseCatalog'
import type { RehabRoutine, RoutineStation } from '../domain/routineCatalog'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { assetUrl } from '../domain/assets'
import { useT } from '../i18n/LocaleContext'
import type { StringKey } from '../i18n/uiStrings'

interface CustomRoutineBuilderModalProps {
  initialRoutine?: RehabRoutine | null
  onSave: (routine: RehabRoutine) => void
  onClose: () => void
}

const PRESET_THUMBNAILS: Array<{ id: string; labelKey: StringKey; url: string }> = [
  { id: 'scapular', labelKey: 'builder.presetScapular', url: 'images/thumb-routine-scapular.jpg' },
  { id: 'standing', labelKey: 'builder.presetStanding', url: 'images/thumb-standing-flexion.jpg' },
  { id: 'seated', labelKey: 'builder.presetSeated', url: 'images/thumb-seated-flexion.jpg' },
  { id: 'desk', labelKey: 'builder.presetDesk', url: 'images/thumb-routine-desk.jpg' },
  { id: 'abduction', labelKey: 'builder.presetAbduction', url: 'images/thumb-lateral-abduction.jpg' },
]

export function CustomRoutineBuilderModal({
  initialRoutine,
  onSave,
  onClose,
}: CustomRoutineBuilderModalProps) {
  const { t, locale } = useT()
  const modalRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useBodyScrollLock()

  const isEditMode = Boolean(initialRoutine)
  const liveExercises = EXERCISE_CATALOG.filter((ex) => ex.status === 'prescribed')

  // A custom routine is authored once, in one language, through these fields —
  // there is no separate English form. On save the typed text is written to
  // both the *Zh and *En slots so it shows in either display language.
  const [name, setName] = useState(initialRoutine?.nameZh ?? t('builder.defaultName'))
  const [subtitle, setSubtitle] = useState(
    initialRoutine?.subtitleZh ?? t('builder.defaultSubtitle')
  )
  const [description, setDescription] = useState(
    initialRoutine?.descriptionZh ?? t('builder.defaultDesc')
  )
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    initialRoutine?.thumbnailUrl ?? 'images/thumb-routine-scapular.jpg'
  )
  const [stations, setStations] = useState<RoutineStation[]>(
    initialRoutine?.stations && initialRoutine.stations.length > 0
      ? [...initialRoutine.stations]
      : [
          {
            exerciseId: liveExercises[0]?.id ?? 'right-arm-forward-flexion-standing',
            targetReps: 10,
            restAfterS: 60,
          },
          {
            exerciseId: liveExercises[1]?.id ?? 'right-arm-forward-flexion-seated',
            targetReps: 10,
            restAfterS: 0,
          },
        ]
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    modalRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setThumbnailUrl(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleAddStation() {
    const nextExercise = liveExercises[stations.length % liveExercises.length] ?? liveExercises[0]!
    setStations((prev) => [
      ...prev,
      {
        exerciseId: nextExercise.id,
        targetReps: 10,
        restAfterS: 60,
      },
    ])
  }

  function handleRemoveStation(index: number) {
    if (stations.length <= 1) return
    setStations((prev) => prev.filter((_, i) => i !== index))
  }

  function handleUpdateStation(index: number, patch: Partial<RoutineStation>) {
    setStations((prev) =>
      prev.map((st, i) => (i === index ? { ...st, ...patch } : st))
    )
  }

  // Calculate estimated duration
  const totalSeconds = stations.reduce((acc, st, i) => {
    const exerciseTime = st.targetReps * (5 + 5 + 5 + 3) // 18s per rep
    const restTime = i < stations.length - 1 ? st.restAfterS : 0
    return acc + exerciseTime + restTime
  }, 0)
  const estimatedDurationMin = Math.max(1, Math.round(totalSeconds / 60))

  function handleSave() {
    if (!name.trim() || stations.length === 0) return

    const trimmedName = name.trim()
    const trimmedSubtitle = subtitle.trim() || t('builder.defaultSubtitleFallback')
    const trimmedDesc = description.trim() || t('builder.defaultDescFallback')
    const focus = initialRoutine?.targetFocusZh ?? t('builder.defaultFocus')

    const routineToSave: RehabRoutine = {
      id: initialRoutine?.id ?? `custom-routine-${Date.now()}`,
      nameZh: trimmedName,
      nameEn: trimmedName,
      subtitleZh: trimmedSubtitle,
      subtitleEn: trimmedSubtitle,
      descriptionZh: trimmedDesc,
      descriptionEn: trimmedDesc,
      targetFocusZh: focus,
      targetFocusEn: initialRoutine?.targetFocusEn ?? focus,
      estimatedDurationMin,
      category: 'custom_doctor',
      stations,
      thumbnailUrl,
      status: 'prescribed',
      isCustom: true,
    }

    onSave(routineToSave)
    onClose()
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={modalRef}
        className="sheet sheet--wide custom-routine-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-routine-builder-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head */}
        <div className="sheet__head">
          <div>
            <div className="section-tag">
              <span className="section-tag__dot" style={{ background: 'var(--rehab-blue-deep)' }} aria-hidden="true" />
              <span style={{ color: 'var(--rehab-blue-deep)' }}>
                {isEditMode ? t('builder.editTag') : t('builder.createTag')}
              </span>
            </div>
            <h2 className="sheet__title" id="custom-routine-builder-title">
              {isEditMode ? t('builder.editTitle', { name }) : t('builder.createTitle')}
            </h2>
            <p className="sheet__sub" style={{ margin: '4px 0 0', color: 'var(--rehab-ink-secondary)', fontSize: 'var(--t-sm)' }}>
              {t('builder.sub')}
            </p>
          </div>
          <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label={t('builder.close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Thumbnail Selector & Upload */}
        <div className="thumbnail-upload-section">
          <div className="thumbnail-upload-preview-wrap">
            <img
              src={assetUrl(thumbnailUrl)}
              alt={t('builder.coverAlt')}
              className="thumbnail-upload-preview-img"
            />
            <span className="video-badge video-badge--duration" style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
              {t('builder.coverBadge')}
            </span>
          </div>

          <div className="thumbnail-upload-controls">
            <h4 className="thumbnail-upload-title">{t('builder.thumbTitle')}</h4>
            <p className="thumbnail-upload-desc">{t('builder.thumbDesc')}</p>

            <div className="thumbnail-preset-row">
              {PRESET_THUMBNAILS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`btn btn--sm ${thumbnailUrl === preset.url ? 'btn--primary' : 'btn--glass'}`}
                  onClick={() => setThumbnailUrl(preset.url)}
                >
                  {t(preset.labelKey)}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 'var(--s-3)' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="btn btn--glass btn--sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('builder.uploadCover')}
              </button>
            </div>
          </div>
        </div>

        {/* Basic Info Inputs */}
        <div className="routine-form-grid">
          <div className="form-field">
            <label className="form-field__label" htmlFor="routine-name-input">
              {t('builder.nameLabel')}
            </label>
            <input
              id="routine-name-input"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('builder.namePlaceholder')}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="routine-sub-input">
              {t('builder.subtitleLabel')}
            </label>
            <input
              id="routine-sub-input"
              type="text"
              className="form-input"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder={t('builder.subtitlePlaceholder')}
            />
          </div>

          <div className="form-field form-field--full">
            <label className="form-field__label" htmlFor="routine-desc-input">
              {t('builder.descLabel')}
            </label>
            <textarea
              id="routine-desc-input"
              className="form-textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('builder.descPlaceholder')}
            />
          </div>
        </div>

        {/* Stations Builder Section */}
        <div className="stations-builder-section">
          <div className="stations-builder-section__head">
            <div>
              <h3 className="stations-builder-section__title">
                {t('builder.stationsTitle', { count: stations.length, min: estimatedDurationMin })}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--t-xs)', color: 'var(--rehab-ink-tertiary)' }}>
                {t('builder.stationsSub')}
              </p>
            </div>
            <button
              type="button"
              className="btn btn--glass btn--sm"
              onClick={handleAddStation}
            >
              {t('builder.addStation')}
            </button>
          </div>

          <div className="stations-builder-list">
            {stations.map((st, idx) => (
              <div key={idx} className="station-builder-card">
                <div className="station-builder-card__head">
                  <span className="station-builder-card__badge">{t('builder.stationN', { n: idx + 1 })}</span>
                  {stations.length > 1 && (
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      style={{ color: 'var(--rehab-red-deep)', padding: '2px 8px', fontSize: '12px' }}
                      onClick={() => handleRemoveStation(idx)}
                    >
                      {t('builder.removeStation')}
                    </button>
                  )}
                </div>

                <div className="station-builder-card__fields">
                  {/* Select Exercise */}
                  <div className="form-field" style={{ flex: 2, minWidth: '180px' }}>
                    <label className="form-field__label">{t('builder.stationExercise')}</label>
                    <select
                      className="form-select"
                      value={st.exerciseId}
                      onChange={(e) =>
                        handleUpdateStation(idx, { exerciseId: e.target.value })
                      }
                    >
                      {liveExercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {t('builder.stationExerciseOpt', {
                            name: localizeExercise(ex, locale).name,
                            posture: ex.posture === 'standing' ? t('posture.standingShort') : t('posture.seatedShort'),
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Reps */}
                  <div className="form-field" style={{ flex: 1, minWidth: '110px' }}>
                    <label className="form-field__label">{t('builder.stationReps')}</label>
                    <select
                      className="form-select"
                      value={st.targetReps}
                      onChange={(e) =>
                        handleUpdateStation(idx, {
                          targetReps: Number(e.target.value),
                        })
                      }
                    >
                      {[5, 8, 10, 12, 15, 20].map((reps) => (
                        <option key={reps} value={reps}>
                          {t('builder.repsOpt', { n: reps })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rest after */}
                  <div className="form-field" style={{ flex: 1, minWidth: '130px' }}>
                    <label className="form-field__label">{t('builder.stationRest')}</label>
                    <select
                      className="form-select"
                      value={st.restAfterS}
                      onChange={(e) =>
                        handleUpdateStation(idx, {
                          restAfterS: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>{t('builder.restNone')}</option>
                      <option value={30}>{t('builder.rest30')}</option>
                      <option value={60}>{t('builder.rest60')}</option>
                      <option value={90}>{t('builder.rest90')}</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="sheet__actions" style={{ marginTop: 'var(--s-6)' }}>
          <button className="btn btn--glass" onClick={onClose}>
            {t('builder.cancel')}
          </button>
          <button
            className="btn btn--primary btn--lg"
            style={{ flex: 1 }}
            onClick={handleSave}
            disabled={!name.trim() || stations.length === 0}
          >
            {isEditMode ? t('builder.saveEdit') : t('builder.saveNew')}
          </button>
        </div>
      </div>
    </div>
  )
}
