import { useEffect, useRef, useState } from 'react'
import type { UserSettings } from '../domain/rehabTypes'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface SettingsModalProps {
  settings: UserSettings
  onSave: (newSettings: UserSettings) => void
  onClose: () => void
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [form, setForm] = useState<UserSettings>({ ...settings })
  const sheetRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock()

  // Never trap the user. Escape closes, and focus moves into the sheet on open
  // so a keyboard user is not left behind on the trigger.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    sheetRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave() {
    onSave(form)
    onClose()
  }

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head">
          <h2 className="sheet__title" id="settings-title">
            訓練參數
          </h2>
          <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label="關閉">
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

        <label className="setting-row">
          <span className="setting-row__header">
            <span>目標抬起角度</span>
            <span className="setting-row__value">{form.targetAngleDeg}°</span>
          </span>
          <input
            type="range"
            min="60"
            max="120"
            step="5"
            value={form.targetAngleDeg}
            /* This used to read `Number(e.target)/1 || Number(e.target.value)`.
               The first term is always NaN, so it worked only by falling
               through the || — a real bug that happened to be invisible. */
            onChange={(e) => setForm({ ...form, targetAngleDeg: Number(e.target.value) })}
          />
          <span className="setting-row__hint">標準肩關節平舉目標為 90°</span>
        </label>

        <label className="setting-row">
          <span className="setting-row__header">
            <span>頂點停頓時間</span>
            <span className="setting-row__value">{form.holdDurationS} 秒</span>
          </span>
          <input
            type="range"
            min="2"
            max="10"
            step="0.5"
            value={form.holdDurationS}
            onChange={(e) => setForm({ ...form, holdDurationS: Number(e.target.value) })}
          />
          <span className="setting-row__hint">處方一般為 3 至 5 秒穩定停頓</span>
        </label>

        <label className="setting-row">
          <span className="setting-row__header">
            <span>每組次數</span>
            <span className="setting-row__value">{form.targetReps} 次</span>
          </span>
          <input
            type="range"
            min="5"
            max="15"
            step="1"
            value={form.targetReps}
            onChange={(e) => setForm({ ...form, targetReps: Number(e.target.value) })}
          />
          <span className="setting-row__hint">依照醫師或治療師的處方設定</span>
        </label>

        <label className="setting-row setting-toggle">
          <span>
            <span className="setting-row__header">提示音</span>
            <span className="setting-row__hint">到位與完成時播放提示音</span>
          </span>
          <input
            type="checkbox"
            checked={form.soundEnabled}
            onChange={(e) => setForm({ ...form, soundEnabled: e.target.checked })}
          />
        </label>

        <div className="sheet__actions">
          <button className="btn btn--quiet" onClick={onClose}>
            取消
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            儲存
          </button>
        </div>
      </div>
    </div>
  )
}
