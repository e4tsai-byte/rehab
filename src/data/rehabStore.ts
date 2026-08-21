import type { CompletedSession, UserSettings } from '../domain/rehabTypes'

const SETTINGS_KEY = 'velocare_rehab_user_settings'
const HISTORY_KEY = 'velocare_rehab_session_history'

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
    const raw = localStorage.getItem(SETTINGS_KEY)
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

export function loadHistory(): CompletedSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
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
