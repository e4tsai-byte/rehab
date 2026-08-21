import { useEffect, useRef, useState } from 'react'
import type { UserSettings } from '../domain/rehabTypes'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useT } from '../i18n/LocaleContext'
import type { Locale } from '../i18n/locale'

interface SettingsModalProps {
  settings: UserSettings
  onSave: (newSettings: UserSettings) => void
  onClose: () => void
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const { t, locale, setLocale } = useT()
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
            {t('settings.title')}
          </h2>
          <button className="btn btn--quiet btn--icon" onClick={onClose} aria-label={t('settings.close')}>
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

        {/* Display language. Applies immediately — the rest of the sheet
            re-renders in the chosen language as the user picks. */}
        <div className="setting-row">
          <span className="setting-row__header">
            <span>{t('settings.language')}</span>
          </span>
          <div className="segmented segmented--sm" role="group" aria-label={t('settings.language')}>
            {(['zh', 'en'] as const).map((code: Locale) => (
              <button
                key={code}
                type="button"
                className="segmented__item"
                aria-selected={locale === code}
                onClick={() => setLocale(code)}
              >
                {code === 'zh' ? t('lang.zh') : t('lang.en')}
              </button>
            ))}
          </div>
          <span className="setting-row__hint">{t('settings.languageHint')}</span>
        </div>

        <label className="setting-row">
          <span className="setting-row__header">
            <span>{t('settings.targetAngle')}</span>
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
          <span className="setting-row__hint">{t('settings.targetAngleHint')}</span>
        </label>

        <label className="setting-row">
          <span className="setting-row__header">
            <span>{t('settings.holdDuration')}</span>
            <span className="setting-row__value">{t('settings.holdValue', { n: form.holdDurationS })}</span>
          </span>
          <input
            type="range"
            min="2"
            max="10"
            step="0.5"
            value={form.holdDurationS}
            onChange={(e) => setForm({ ...form, holdDurationS: Number(e.target.value) })}
          />
          <span className="setting-row__hint">{t('settings.holdHint')}</span>
        </label>

        <label className="setting-row">
          <span className="setting-row__header">
            <span>{t('settings.reps')}</span>
            <span className="setting-row__value">{t('settings.repsValue', { n: form.targetReps })}</span>
          </span>
          <input
            type="range"
            min="5"
            max="15"
            step="1"
            value={form.targetReps}
            onChange={(e) => setForm({ ...form, targetReps: Number(e.target.value) })}
          />
          <span className="setting-row__hint">{t('settings.repsHint')}</span>
        </label>

        <label className="setting-row setting-toggle">
          <span>
            <span className="setting-row__header">{t('settings.sound')}</span>
            <span className="setting-row__hint">{t('settings.soundHint')}</span>
          </span>
          <input
            type="checkbox"
            checked={form.soundEnabled}
            onChange={(e) => setForm({ ...form, soundEnabled: e.target.checked })}
          />
        </label>

        <div className="sheet__actions">
          <button className="btn btn--quiet" onClick={onClose}>
            {t('settings.cancel')}
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            {t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
