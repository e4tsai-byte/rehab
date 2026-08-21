import type { CompletedSession } from './rehabTypes'

export interface RecoveryPhase {
  id: string
  phaseNumber: number
  nameZh: string
  targetRomZh: string
  descriptionZh: string
  criteriaZh: string
  clinicalNoteZh: string
}

export const RECOVERY_PHASES: readonly RecoveryPhase[] = [
  {
    id: 'phase-1',
    phaseNumber: 1,
    nameZh: '急性保護與等長啟動',
    targetRomZh: '0° – 45°',
    descriptionZh: '被動與輔助活動度維持、肩胛控制與無痛等長收縮，保護修復中肌腱與關節囊。',
    criteriaZh: '急性期疼痛減退，在無代償下可完成基礎等長支撐。',
    clinicalNoteZh: '此階段首重避免發炎惡化與過度牽拉修復部位。',
  },
  {
    id: 'phase-2',
    phaseNumber: 2,
    nameZh: '主動前屈與肩胛穩定',
    targetRomZh: '0° – 90°',
    descriptionZh: '站姿與坐姿 90° 主動前屈訓練，嚴格落實 5-5-5 節奏，消除聳肩代償，建立三角肌與前鋸肌穩定協同。',
    criteriaZh: '累計完成 20 組處方、平均角度穩定達 90° 且動作標準率 ≥ 80%。',
    clinicalNoteZh: '90° 為肩關節次發性夾擠的高發轉折點，此處建立的無聳肩動作模式是後續高角度訓練的基石。',
  },
  {
    id: 'phase-3',
    phaseNumber: 3,
    nameZh: '高角度抬升與旋轉肌強化',
    targetRomZh: '90° – 150°',
    descriptionZh: '側向外展 (Abduction)、肩胛平面抬升 (Scaption) 與阻力外旋訓練，建立全角度動態穩定。',
    criteriaZh: '第二階段達標並經物理治療師評估後晉級。',
    clinicalNoteZh: '需特別注意肩胛盂肱節律 (Scapulohumeral Rhythm) 之順暢度。',
  },
  {
    id: 'phase-4',
    phaseNumber: 4,
    nameZh: '功能性負重與生活重返',
    targetRomZh: '150° – 180°',
    descriptionZh: '過頭功能性動作、動態負重與日常生活/工作動作模擬，恢復完整肩關節活動度與肌耐力。',
    criteriaZh: '雙側肌力對稱度 ≥ 90% 且全活動範圍無痛。',
    clinicalNoteZh: '維持長期預防性保養與日常姿勢校正。',
  },
] as const

export interface RecoveryProgress {
  currentPhase: RecoveryPhase
  allPhases: readonly RecoveryPhase[]
  progressPct: number
  completedSetsInPhase: number
  targetSetsForPhase: number
  cleanMovementRatePct: number
  avgElevationDeg: number
  isReadyForNextPhase: boolean
}

export function calculateRecoveryProgress(history: CompletedSession[]): RecoveryProgress {
  const currentPhase = RECOVERY_PHASES[1]! // Phase 2 is the active phase
  const targetSetsForPhase = 20
  const completedSetsInPhase = history.length

  const totalReps = history.reduce((acc, s) => acc + s.completedReps, 0)
  const totalClean = history.reduce((acc, s) => acc + s.cleanRepsCount, 0)
  const cleanMovementRatePct = totalReps > 0 ? Math.round((totalClean / totalReps) * 100) : 0

  const avgElevationDeg =
    history.length > 0
      ? Math.round(history.reduce((acc, s) => acc + s.peakElevationDeg, 0) / history.length)
      : 0

  const progressPct = Math.min(100, Math.round((completedSetsInPhase / targetSetsForPhase) * 100))
  const isReadyForNextPhase = completedSetsInPhase >= targetSetsForPhase && cleanMovementRatePct >= 80

  return {
    currentPhase,
    allPhases: RECOVERY_PHASES,
    progressPct,
    completedSetsInPhase,
    targetSetsForPhase,
    cleanMovementRatePct,
    avgElevationDeg,
    isReadyForNextPhase,
  }
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
    const isFuture = currDate.getTime() > today.setHours(23, 59, 59, 999)
    const isPastOrToday = !isFuture
    const totalReps = sess.reduce((a, s) => a + s.completedReps, 0)
    const cleanReps = sess.reduce((a, s) => a + s.cleanRepsCount, 0)

    if (sess.length > 0) {
      activeDaysCount++
      totalRepsThisMonth += totalReps
    }

    // A rest day is a past day with 0 sessions after the user started their first session,
    // or if the user has history on adjacent days
    const isRestDay = isPastOrToday && sess.length === 0 && history.some((s) => s.timestamp <= currDate.getTime())

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

  const avgPeakElevationDeg =
    recentSessions.length > 0
      ? Math.round(
          (recentSessions.reduce((acc, s) => acc + s.peakElevationDeg, 0) / recentSessions.length) * 10
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
