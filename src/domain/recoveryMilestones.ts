import type { CompletedSession } from './rehabTypes'
import { EXERCISE_CATALOG } from './exerciseCatalog'

/**
 * True when a recorded session belongs to an isometric-hold exercise (the
 * side-lying supraspinatus hold). Resolved from the catalog by id — sessions
 * store only `exerciseId`, not the tracking model. A low 10–15°
 * hold must never be pooled into the "higher elevation = better"
 * aggregates, where its peak angle would read as regression. Unknown ids (an
 * exercise later removed) resolve to false and stay in the general stats.
 */
function isIsometricSession(session: CompletedSession): boolean {
  const ex = EXERCISE_CATALOG.find((e) => e.id === session.exerciseId)
  return ex?.trackingModel === 'isometricHold'
}


export interface DayActivity {
  dateStr: string // YYYY-MM-DD
  dayNumber: number
  isToday: boolean
  isFuture: boolean
  isCurrentMonth: boolean
  sessionsCount: number
  totalReps: number
  cleanReps: number
  isRestDay: boolean
  sessions: CompletedSession[]
}

export interface MonthActivityGrid {
  year: number
  month: number // 1-12
  monthLabelZh: string
  days: DayActivity[]
  activeDaysCount: number
  restDaysCount: number
  totalRepsThisMonth: number
  currentStreak: number
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function calculateCalendarActivity(
  history: CompletedSession[],
  viewDate: Date = new Date()
): MonthActivityGrid {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1
  const monthLabelZh = `${year} 年 ${month} 月`

  const today = new Date()
  const todayKey = toLocalDateKey(today)

  /* Day boundaries, computed once. `today.setHours(23,59,59,999)` used to run
     inside the day loop below, which mutated the shared `today` object on the
     first iteration — so `today` silently changed meaning from "now" to "end of
     today" partway through the function, and every later comparison used the
     mutated value. Hoisted and made non-mutating. */
  const endOfToday = new Date(today).setHours(23, 59, 59, 999)
  const startOfToday = new Date(today).setHours(0, 0, 0, 0)

  // Map history sessions by date string
  const sessionsByDate = new Map<string, CompletedSession[]>()
  for (const session of history) {
    const key = toLocalDateKey(new Date(session.timestamp))
    const existing = sessionsByDate.get(key) ?? []
    existing.push(session)
    sessionsByDate.set(key, existing)
  }

  // First day of month and total days
  const firstDayOfMonth = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun, 1 = Mon, ...

  // We show 35 or 42 grid cells (Sunday to Saturday)
  const days: DayActivity[] = []
  
  // Previous month padding
  const prevMonthLastDate = new Date(year, month - 1, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDate - i
    const prevDate = new Date(year, month - 2, dayNum)
    const key = toLocalDateKey(prevDate)
    const sess = sessionsByDate.get(key) ?? []
    const totalReps = sess.reduce((a, s) => a + s.completedReps, 0)
    const cleanReps = sess.reduce((a, s) => a + s.cleanRepsCount, 0)

    days.push({
      dateStr: key,
      dayNumber: dayNum,
      isToday: key === todayKey,
      isFuture: prevDate.getTime() > today.getTime(),
      isCurrentMonth: false,
      sessionsCount: sess.length,
      totalReps,
      cleanReps,
      isRestDay: false,
      sessions: sess,
    })
  }

  // Current month days
  let activeDaysCount = 0
  let totalRepsThisMonth = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month - 1, d)
    const key = toLocalDateKey(currDate)
    const sess = sessionsByDate.get(key) ?? []
    const isFuture = currDate.getTime() > endOfToday
    const isPast = currDate.getTime() < startOfToday
    const totalReps = sess.reduce((a, s) => a + s.completedReps, 0)
    const cleanReps = sess.reduce((a, s) => a + s.cleanRepsCount, 0)

    if (sess.length > 0) {
      activeDaysCount++
      totalRepsThisMonth += totalReps
    }

    /* A rest day is a PAST day with no sessions, after the user's first session.
       Today is deliberately excluded: the old predicate used a past-or-today
       test, which marked the current day as rest from 00:00, so a user opening the app at 8am saw today already
       labelled 🌱 修復 and counted toward restDaysCount — before they had any
       chance to train. For an adherence surface that inverts the nudge, and it
       reads as the app excusing a day the user has not yet missed. Today is
       simply undecided until it ends. */
    const isRestDay =
      isPast && sess.length === 0 && history.some((s) => s.timestamp <= currDate.getTime())

    days.push({
      dateStr: key,
      dayNumber: d,
      isToday: key === todayKey,
      isFuture,
      isCurrentMonth: true,
      sessionsCount: sess.length,
      totalReps,
      cleanReps,
      isRestDay,
      sessions: sess,
    })
  }

  // Next month padding to complete week rows
  const remainingCells = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month, i)
    const key = toLocalDateKey(nextDate)
    const sess = sessionsByDate.get(key) ?? []
    const totalReps = sess.reduce((a, s) => a + s.completedReps, 0)
    const cleanReps = sess.reduce((a, s) => a + s.cleanRepsCount, 0)

    days.push({
      dateStr: key,
      dayNumber: i,
      isToday: key === todayKey,
      isFuture: true,
      isCurrentMonth: false,
      sessionsCount: sess.length,
      totalReps,
      cleanReps,
      isRestDay: false,
      sessions: sess,
    })
  }

  // Calculate current streak
  let currentStreak = 0
  const uniqueDatesDescending = Array.from(sessionsByDate.keys()).sort((a, b) => (a > b ? -1 : 1))
  const yesterday = new Date(Date.now() - 86400000)
  const yesterdayKey = toLocalDateKey(yesterday)

  if (uniqueDatesDescending.length > 0) {
    const firstKey = uniqueDatesDescending[0]
    if (firstKey === todayKey || firstKey === yesterdayKey) {
      for (let i = 0; i < uniqueDatesDescending.length; i++) {
        currentStreak++
        if (i < uniqueDatesDescending.length - 1) {
          const currTime = new Date(uniqueDatesDescending[i]!).getTime()
          const nextTime = new Date(uniqueDatesDescending[i + 1]!).getTime()
          const diffDays = Math.round((currTime - nextTime) / 86400000)
          if (diffDays !== 1) break
        }
      }
    }
  }

  const restDaysCount = days.filter((d) => d.isCurrentMonth && d.isRestDay).length

  return {
    year,
    month,
    monthLabelZh,
    days,
    activeDaysCount,
    restDaysCount,
    totalRepsThisMonth,
    currentStreak,
  }
}

export interface RecentStatsSummary {
  periodDays: number
  totalSets: number
  totalReps: number
  cleanReps: number
  cleanMovementRatePct: number
  avgPeakElevationDeg: number
  avgHoldDurationS: number
  daysActiveInPeriod: number
}

export function calculateRecentStats(
  history: CompletedSession[],
  periodDays: number = 7
): RecentStatsSummary {
  const cutoffTime = Date.now() - periodDays * 86400000
  const recentSessions = history.filter((s) => s.timestamp >= cutoffTime)

  const totalSets = recentSessions.length
  const totalReps = recentSessions.reduce((acc, s) => acc + s.completedReps, 0)
  const cleanReps = recentSessions.reduce((acc, s) => acc + s.cleanRepsCount, 0)
  const cleanMovementRatePct = totalReps > 0 ? Math.round((cleanReps / totalReps) * 100) : 0

  /* Elevation average excludes isometric-hold sessions (physiatrist §6): a
     prescribed 12° hold is not a lower peak on the same scale as a 90° flexion
     rep, and averaging them together misreports both. Hold sessions still count
     toward totalSets/totalReps/hold-duration/active-days below — they are real
     training, just not an elevation achievement. */
  const pacedRecent = recentSessions.filter((s) => !isIsometricSession(s))
  const avgPeakElevationDeg =
    pacedRecent.length > 0
      ? Math.round(
          (pacedRecent.reduce((acc, s) => acc + s.peakElevationDeg, 0) / pacedRecent.length) * 10
        ) / 10
      : 0

  const avgHoldDurationS =
    recentSessions.length > 0
      ? Math.round(
          (recentSessions.reduce((acc, s) => acc + s.averageHoldDurationS, 0) /
            recentSessions.length) *
            10
        ) / 10
      : 0

  const uniqueDays = new Set(
    recentSessions.map((s) => toLocalDateKey(new Date(s.timestamp)))
  ).size

  return {
    periodDays,
    totalSets,
    totalReps,
    cleanReps,
    cleanMovementRatePct,
    avgPeakElevationDeg,
    avgHoldDurationS,
    daysActiveInPeriod: uniqueDays,
  }
}

export interface HoldAdherence {
  /** Sessions of this exercise completed on `viewDate` (default today). */
  sessionsToday: number
  /** The exercise's prescribed sessions-per-day (dailySessionTarget), or 0 if none. */
  dailyTarget: number
  /** Holds (sets) completed across today's sessions of this exercise. */
  holdsToday: number
  /** True once sessionsToday has reached the daily target (target > 0). */
  targetMet: boolean
}

/**
 * Adherence for a sessions-per-day exercise (the side-lying supraspinatus hold):
 * how many sessions of `exerciseId` were done today versus its `dailySessionTarget`.
 * This is the surface this exercise is tracked by INSTEAD of the Phase-2 elevation
 * metrics (physiatrist §6) — a low hold is scored by how faithfully it is repeated,
 * not by how high the arm went. Computed from existing history grouped by local day
 * (invariant 1: no new persisted state).
 */
export function calculateHoldAdherence(
  history: CompletedSession[],
  exerciseId: string,
  viewDate: Date = new Date()
): HoldAdherence {
  const ex = EXERCISE_CATALOG.find((e) => e.id === exerciseId)
  const dailyTarget = ex?.dailySessionTarget ?? 0

  const dayKey = toLocalDateKey(viewDate)
  const todaysSessions = history.filter(
    (s) => s.exerciseId === exerciseId && toLocalDateKey(new Date(s.timestamp)) === dayKey
  )

  const sessionsToday = todaysSessions.length
  const holdsToday = todaysSessions.reduce((acc, s) => acc + s.completedReps, 0)

  return {
    sessionsToday,
    dailyTarget,
    holdsToday,
    targetMet: dailyTarget > 0 && sessionsToday >= dailyTarget,
  }
}
