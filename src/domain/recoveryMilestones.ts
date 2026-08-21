import type { CompletedSession } from './rehabTypes'
import type { Locale } from '../i18n/locale'

export interface RecoveryPhase {
  id: string
  phaseNumber: number
  nameZh: string
  nameEn: string
  /** Range-of-motion notation (e.g. "0° – 90°") — locale-neutral, shared. */
  targetRom: string
  descriptionZh: string
  descriptionEn: string
  criteriaZh: string
  criteriaEn: string
  clinicalNoteZh: string
  clinicalNoteEn: string
}

export interface LocalizedPhase {
  name: string
  targetRom: string
  description: string
  criteria: string
  clinicalNote: string
}

export function localizePhase(phase: RecoveryPhase, locale: Locale): LocalizedPhase {
  const en = locale === 'en'
  return {
    name: en ? phase.nameEn : phase.nameZh,
    targetRom: phase.targetRom,
    description: en ? phase.descriptionEn : phase.descriptionZh,
    criteria: en ? phase.criteriaEn : phase.criteriaZh,
    clinicalNote: en ? phase.clinicalNoteEn : phase.clinicalNoteZh,
  }
}

export const RECOVERY_PHASES: readonly RecoveryPhase[] = [
  {
    id: 'phase-1',
    phaseNumber: 1,
    nameZh: '急性保護與等長啟動',
    nameEn: 'Acute Protection & Isometric Activation',
    targetRom: '0° – 45°',
    descriptionZh: '被動與輔助活動度維持、肩胛控制與無痛等長收縮，保護修復中肌腱與關節囊。',
    descriptionEn:
      'Passive and assisted range-of-motion maintenance, scapular control, and pain-free isometric contractions to protect the healing tendon and joint capsule.',
    criteriaZh: '急性期疼痛減退，在無代償下可完成基礎等長支撐。',
    criteriaEn:
      'Acute pain has subsided and basic isometric holds can be performed without compensation.',
    clinicalNoteZh: '此階段首重避免發炎惡化與過度牽拉修復部位。',
    clinicalNoteEn:
      'This stage prioritizes avoiding aggravated inflammation and over-stretching the healing tissue.',
  },
  {
    id: 'phase-2',
    phaseNumber: 2,
    nameZh: '主動前屈與肩胛穩定',
    nameEn: 'Active Flexion & Scapular Stability',
    targetRom: '0° – 90°',
    descriptionZh: '站姿與坐姿 90° 主動前屈訓練，嚴格落實 5-5-5 節奏，消除聳肩代償，建立三角肌與前鋸肌穩定協同。',
    descriptionEn:
      'Standing and seated active forward flexion to 90°, holding strictly to the 5-5-5 tempo, eliminating shrug compensation and building steady deltoid–serratus coordination.',
    criteriaZh: '累計完成 20 組處方、平均角度穩定達 90° 且動作標準率 ≥ 80%。',
    criteriaEn:
      'Twenty prescribed sets completed, average angle steady at 90°, and clean-movement rate ≥ 80%.',
    clinicalNoteZh: '90° 為肩關節次發性夾擠的高發轉折點，此處建立的無聳肩動作模式是後續高角度訓練的基石。',
    clinicalNoteEn:
      '90° is a common turning point for secondary shoulder impingement; the shrug-free pattern built here is the foundation for later higher-angle work.',
  },
  {
    id: 'phase-3',
    phaseNumber: 3,
    nameZh: '高角度抬升與旋轉肌強化',
    nameEn: 'High-Angle Elevation & Rotator-Cuff Strengthening',
    targetRom: '90° – 150°',
    descriptionZh: '側向外展 (Abduction)、肩胛平面抬升 (Scaption) 與阻力外旋訓練，建立全角度動態穩定。',
    descriptionEn:
      'Lateral abduction, scaption, and resisted external rotation to build full-range dynamic stability.',
    criteriaZh: '第二階段達標並經物理治療師評估後晉級。',
    criteriaEn: "Advance after meeting Stage 2 targets and a physical therapist's assessment.",
    clinicalNoteZh: '需特別注意肩胛盂肱節律 (Scapulohumeral Rhythm) 之順暢度。',
    clinicalNoteEn: 'Pay particular attention to the smoothness of scapulohumeral rhythm.',
  },
  {
    id: 'phase-4',
    phaseNumber: 4,
    nameZh: '功能性負重與生活重返',
    nameEn: 'Functional Loading & Return to Life',
    targetRom: '150° – 180°',
    descriptionZh: '過頭功能性動作、動態負重與日常生活/工作動作模擬，恢復完整肩關節活動度與肌耐力。',
    descriptionEn:
      'Overhead functional movements, dynamic loading, and simulated daily-living and work tasks to restore full shoulder range and endurance.',
    criteriaZh: '雙側肌力對稱度 ≥ 90% 且全活動範圍無痛。',
    criteriaEn: 'Bilateral strength symmetry ≥ 90% and pain-free through the full range.',
    clinicalNoteZh: '維持長期預防性保養與日常姿勢校正。',
    clinicalNoteEn: 'Maintain long-term preventive care and daily posture correction.',
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
