import type { CompletedSession, UserSettings } from '../domain/rehabTypes'
import { detectBrowserLocale, isLocale, type Locale } from '../i18n/locale'

/* Local storage only. Invariant #1: what persists is rep records and settings,
   on this device, in this browser. No frames, no landmark arrays, no identity.

   Renamed from the `velocare_rehab_*` keys on 2026-08-21. LEGACY_* is read once
   on a cold start so an existing install keeps its streak and history rather
   than silently resetting to zero; drop the fallback after the next release. */
const SETTINGS_KEY = 'rehabibi_user_settings'
const HISTORY_KEY = 'rehabibi_session_history'
const LOCALE_KEY = 'rehabibi_locale'
const LEGACY_SETTINGS_KEY = 'velocare_rehab_user_settings'
const LEGACY_HISTORY_KEY = 'velocare_rehab_session_history'

export const DEFAULT_SETTINGS: UserSettings = {
  targetAngleDeg: 90,
  holdDurationS: 5.0,
  concentricCadenceS: 5.0,
  eccentricCadenceS: 5.0,
  targetReps: 10,
  soundEnabled: true,
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY) ?? localStorage.getItem(LEGACY_SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Failed to save settings to localStorage', err)
  }
}

/* The chosen UI language. A stored choice wins; otherwise the browser's own
   language preferences decide (English for en-*, Chinese for zh-* or anything
   else). Kept here with the other persisted state per invariant 1 — the i18n
   layer owns detection, this file owns storage. */
export function loadLocale(): Locale {
  try {
    const raw = localStorage.getItem(LOCALE_KEY)
    if (isLocale(raw)) return raw
  } catch {
    /* localStorage unavailable — fall through to browser detection */
  }
  return detectBrowserLocale()
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch (err) {
    console.error('Failed to save locale to localStorage', err)
  }
}

export function loadHistory(): CompletedSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY) ?? localStorage.getItem(LEGACY_HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveSession(session: CompletedSession): CompletedSession[] {
  try {
    const history = loadHistory()
    const updated = [session, ...history]
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to save session to localStorage', err)
    return loadHistory()
  }
}

export function calculateStreak(history: CompletedSession[]): number {
  if (history.length === 0) return 0
  const dates = Array.from(
    new Set(
      history.map((s) => {
        const d = new Date(s.timestamp)
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      })
    )
  )

  // Sort descending
  dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  
  const yesterday = new Date(Date.now() - 86400000)
  const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`

  let streak = 0
  const firstDate = dates[0]
  if (firstDate !== todayStr && firstDate !== yesterdayStr) {
    return 0
  }

  for (let i = 0; i < dates.length; i++) {
    streak++
    if (i < dates.length - 1) {
      const curr = new Date(dates[i] ?? '').getTime()
      const next = new Date(dates[i + 1] ?? '').getTime()
      const diffDays = Math.round((curr - next) / 86400000)
      if (diffDays !== 1) break
    }
  }

  return streak
}

const CUSTOM_ROUTINES_KEY = 'rehabibi_custom_routines'

export function loadCustomRoutines(): import('../domain/routineCatalog').RehabRoutine[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ROUTINES_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveCustomRoutine(
  routine: import('../domain/routineCatalog').RehabRoutine
): import('../domain/routineCatalog').RehabRoutine[] {
  try {
    const existing = loadCustomRoutines()
    const filtered = existing.filter((r) => r.id !== routine.id)
    const updated = [routine, ...filtered]
    localStorage.setItem(CUSTOM_ROUTINES_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to save custom routine', err)
    return loadCustomRoutines()
  }
}

export function deleteCustomRoutine(id: string): import('../domain/routineCatalog').RehabRoutine[] {
  try {
    const existing = loadCustomRoutines()
    const updated = existing.filter((r) => r.id !== id)
    localStorage.setItem(CUSTOM_ROUTINES_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to delete custom routine', err)
    return loadCustomRoutines()
  }
}

const HIDDEN_ROUTINES_KEY = 'rehabibi_hidden_routines'

export function loadHiddenRoutineIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_ROUTINES_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function hideRoutine(id: string): string[] {
  try {
    const existing = loadHiddenRoutineIds()
    if (!existing.includes(id)) {
      const updated = [...existing, id]
      localStorage.setItem(HIDDEN_ROUTINES_KEY, JSON.stringify(updated))
      return updated
    }
    return existing
  } catch (err) {
    console.error('Failed to hide routine', err)
    return loadHiddenRoutineIds()
  }
}

export function unhideAllRoutines(): string[] {
  try {
    localStorage.removeItem(HIDDEN_ROUTINES_KEY)
    return []
  } catch {
    return []
  }
}
