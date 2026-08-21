import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { EXERCISE_CATALOG } from '../domain/exerciseCatalog'
import type { RehabRoutine, RoutineStation } from '../domain/routineCatalog'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface CustomRoutineBuilderModalProps {
  initialRoutine?: RehabRoutine | null
  onSave: (routine: RehabRoutine) => void
  onClose: () => void
}

const PRESET_THUMBNAILS = [
  { id: 'scapular', label: '肩胛複合', url: '/images/thumb-routine-scapular.jpg' },
  { id: 'standing', label: '站姿前舉', url: '/images/thumb-standing-flexion.jpg' },
  { id: 'seated', label: '坐姿桌前', url: '/images/thumb-seated-flexion.jpg' },
  { id: 'desk', label: '辦公舒緩', url: '/images/thumb-routine-desk.jpg' },
  { id: 'abduction', label: '側向外展', url: '/images/thumb-lateral-abduction.jpg' },
]

export function CustomRoutineBuilderModal({
  initialRoutine,
  onSave,
  onClose,
}: CustomRoutineBuilderModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useBodyScrollLock()

  const isEditMode = Boolean(initialRoutine)
  const liveExercises = EXERCISE_CATALOG.filter((ex) => ex.status === 'prescribed')

  const [nameZh, setNameZh] = useState(initialRoutine?.nameZh ?? '醫師處方客製復健課表')
  const [subtitleZh, setSubtitleZh] = useState(
    initialRoutine?.subtitleZh ?? '主治醫師指定個別化居家處方'
  )
  const [descriptionZh, setDescriptionZh] = useState(
    initialRoutine?.descriptionZh ??
      '依據臨床醫師指示配置之動作組合與處方次數，落實每日居家肩關節復健。'
  )
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    initialRoutine?.thumbnailUrl ?? '/images/thumb-routine-scapular.jpg'
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
    if (!nameZh.trim() || stations.length === 0) return

    const routineToSave: RehabRoutine = {
      id: initialRoutine?.id ?? `custom-routine-${Date.now()}`,
      nameZh: nameZh.trim(),
      nameEn: initialRoutine?.nameEn ?? 'Doctor Custom Prescription Routine',
      subtitleZh: subtitleZh.trim() || '主治醫師指定居家處方',
      descriptionZh: descriptionZh.trim() || '依據醫師指示配置之個別化復健課表。',
      targetFocusZh: initialRoutine?.targetFocusZh ?? '醫師個別化處方 · 肩關節活動度與穩定',
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
                {isEditMode ? '編輯處方課表' : '客製化處方建立器'}
              </span>
            </div>
            <h2 className="sheet__title" id="custom-routine-builder-title">
              {isEditMode ? `編輯「${nameZh}」` : '建立醫師自訂處方課表'}
            </h2>
            <p className="sheet__sub" style={{ margin: '4px 0 0', color: 'var(--rehab-ink-secondary)', fontSize: 'var(--t-sm)' }}>
              輸入主治醫師或物理治療師交代之動作組合、次數、休息間隔與專屬封面縮圖。
            </p>
          </div>
          <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label="關閉建立器">
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
              src={thumbnailUrl}
              alt="課表封面預覽"
              className="thumbnail-upload-preview-img"
            />
            <span className="video-badge video-badge--duration" style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
              16:9 封面預覽
            </span>
          </div>

          <div className="thumbnail-upload-controls">
            <h4 className="thumbnail-upload-title">🖼️ 課表縮圖封面</h4>
            <p className="thumbnail-upload-desc">
              可上傳門診醫囑照片、個人訓練照，或從下方預設縮圖快速選擇：
            </p>

            <div className="thumbnail-preset-row">
              {PRESET_THUMBNAILS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`btn btn--sm ${thumbnailUrl === preset.url ? 'btn--primary' : 'btn--glass'}`}
                  onClick={() => setThumbnailUrl(preset.url)}
                >
                  {preset.label}
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
                📁 上傳自訂封面照片
              </button>
            </div>
          </div>
        </div>

        {/* Basic Info Inputs */}
        <div className="routine-form-grid">
          <div className="form-field">
            <label className="form-field__label" htmlFor="routine-name-input">
              課表名稱
            </label>
            <input
              id="routine-name-input"
              type="text"
              className="form-input"
              value={nameZh}
              onChange={(e) => setNameZh(e.target.value)}
              placeholder="例如：陳醫師指定每日肩胛強化課表"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="routine-sub-input">
              副標題 / 訓練焦點
            </label>
            <input
              id="routine-sub-input"
              type="text"
              className="form-input"
              value={subtitleZh}
              onChange={(e) => setSubtitleZh(e.target.value)}
              placeholder="例如：早晚各一組 · 強化前三角肌"
            />
          </div>

          <div className="form-field form-field--full">
            <label className="form-field__label" htmlFor="routine-desc-input">
              醫師叮嚀與備註說明
            </label>
            <textarea
              id="routine-desc-input"
              className="form-textarea"
              rows={2}
              value={descriptionZh}
              onChange={(e) => setDescriptionZh(e.target.value)}
              placeholder="例如：動作過程專注沉肩，若有劇烈刺痛即刻停止..."
            />
          </div>
        </div>

        {/* Stations Builder Section */}
        <div className="stations-builder-section">
          <div className="stations-builder-section__head">
            <div>
              <h3 className="stations-builder-section__title">
                動作站點清單（共 {stations.length} 項 · 預估約 {estimatedDurationMin} 分鐘）
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--t-xs)', color: 'var(--rehab-ink-tertiary)' }}>
                系統將在訓練中自動依序引導，並於站點之間啟動中場休息計時。
              </p>
            </div>
            <button
              type="button"
              className="btn btn--glass btn--sm"
              onClick={handleAddStation}
            >
              ＋ 新增動作站點
            </button>
          </div>

          <div className="stations-builder-list">
            {stations.map((st, idx) => (
              <div key={idx} className="station-builder-card">
                <div className="station-builder-card__head">
                  <span className="station-builder-card__badge">第 {idx + 1} 站</span>
                  {stations.length > 1 && (
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      style={{ color: 'var(--rehab-red-deep)', padding: '2px 8px', fontSize: '12px' }}
                      onClick={() => handleRemoveStation(idx)}
                    >
                      移除站點
                    </button>
                  )}
                </div>

                <div className="station-builder-card__fields">
                  {/* Select Exercise */}
                  <div className="form-field" style={{ flex: 2, minWidth: '180px' }}>
                    <label className="form-field__label">執行動作</label>
                    <select
                      className="form-select"
                      value={st.exerciseId}
                      onChange={(e) =>
                        handleUpdateStation(idx, { exerciseId: e.target.value })
                      }
                    >
                      {liveExercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.nameZh} ({ex.posture === 'standing' ? '站姿' : '坐姿桌前'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Reps */}
                  <div className="form-field" style={{ flex: 1, minWidth: '110px' }}>
                    <label className="form-field__label">處方次數</label>
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
                          {reps} 次
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rest after */}
                  <div className="form-field" style={{ flex: 1, minWidth: '130px' }}>
                    <label className="form-field__label">完畢後中場休息</label>
                    <select
                      className="form-select"
                      value={st.restAfterS}
                      onChange={(e) =>
                        handleUpdateStation(idx, {
                          restAfterS: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0}>無休息（直接進入）</option>
                      <option value={30}>30 秒肌腱修復</option>
                      <option value={60}>60 秒標準休息</option>
                      <option value={90}>90 秒充分緩和</option>
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
            取消
          </button>
          <button
            className="btn btn--primary btn--lg"
            style={{ flex: 1 }}
            onClick={handleSave}
            disabled={!nameZh.trim() || stations.length === 0}
          >
            {isEditMode ? '儲存修改' : '儲存自訂處方課表'}
          </button>
        </div>
      </div>
    </div>
  )
}
