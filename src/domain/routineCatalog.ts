import type { Locale } from '../i18n/locale'

export interface RoutineStation {
  exerciseId: string
  targetReps: number
  restAfterS: number // Inter-exercise rest interval in seconds (e.g. 60s)
}

export interface RehabRoutine {
  id: string
  nameZh: string
  nameEn: string
  subtitleZh: string
  subtitleEn?: string
  descriptionZh: string
  descriptionEn?: string
  targetFocusZh: string
  targetFocusEn?: string
  estimatedDurationMin: number
  category: 'daily_prescribed' | 'desk_relief' | 'advanced_stability' | 'custom_doctor'
  stations: readonly RoutineStation[]
  thumbnailUrl: string
  status: 'prescribed' | 'upcoming'
  isCustom?: boolean
}

export interface LocalizedRoutine {
  name: string
  subtitle: string
  description: string
  targetFocus: string
}

/**
 * Resolve a routine's copy for one locale. The English fields are optional
 * because a doctor-built custom routine is entered once, in Chinese, through
 * the builder — when its `*En` fields are absent the English view falls back to
 * the author's own text rather than showing an empty string.
 */
export function localizeRoutine(routine: RehabRoutine, locale: Locale): LocalizedRoutine {
  if (locale === 'en') {
    return {
      name: routine.nameEn || routine.nameZh,
      subtitle: routine.subtitleEn || routine.subtitleZh,
      description: routine.descriptionEn || routine.descriptionZh,
      targetFocus: routine.targetFocusEn || routine.targetFocusZh,
    }
  }
  return {
    name: routine.nameZh,
    subtitle: routine.subtitleZh,
    description: routine.descriptionZh,
    targetFocus: routine.targetFocusZh,
  }
}

export const REHAB_ROUTINES: readonly RehabRoutine[] = [
  {
    id: 'routine-scapular-daily-combo',
    nameZh: '肩胛綜合穩定強化課表',
    nameEn: 'Daily Scapular & Deltoid Stability Menu',
    subtitleZh: '站姿動力鏈啟動 ＋ 坐姿前三角肌隔離控制',
    subtitleEn: 'Standing kinetic-chain activation + seated anterior-deltoid isolation',
    descriptionZh: '結合站姿全身核心協同與坐姿桌前平舉隔離訓練，以標準 5-5-5 節奏消除聳肩代償，全方位重建肩胛肱骨節律。',
    descriptionEn:
      'Combines standing whole-body coordination with seated desk isolation raises, using the standard 5-5-5 tempo to eliminate shrug compensation and rebuild scapulohumeral rhythm.',
    targetFocusZh: '前三角肌 · 前鋸肌 · 上斜方肌抑制',
    targetFocusEn: 'Anterior deltoid · serratus anterior · upper-trapezius inhibition',
    estimatedDurationMin: 8,
    category: 'daily_prescribed',
    stations: [
      {
        exerciseId: 'right-arm-forward-flexion-standing',
        targetReps: 10,
        restAfterS: 60,
      },
      {
        exerciseId: 'right-arm-forward-flexion-seated',
        targetReps: 10,
        restAfterS: 0,
      },
    ],
    thumbnailUrl: 'images/thumb-routine-scapular.jpg',
    status: 'prescribed',
  },
  {
    id: 'routine-desk-quick-relief',
    nameZh: '辦公桌前快速關節放鬆課表',
    nameEn: 'Desk Quick Relief Menu',
    subtitleZh: '久坐舒緩 · 上半身姿勢校正',
    subtitleEn: 'Sitting relief · upper-body posture correction',
    descriptionZh: '針對辦公與久坐族群設計，利用椅背與桌面支撐，在 4 分鐘內完成 10 次高品質 90° 前屈平舉與等長停頓。',
    descriptionEn:
      'Designed for desk and sedentary users: using the chair back and desk for support, complete ten high-quality 90° forward raises with isometric holds in about 4 minutes.',
    targetFocusZh: '姿勢校正 · 頸肩減壓 · 前三角肌活動度',
    targetFocusEn: 'Posture correction · neck-shoulder relief · anterior-deltoid mobility',
    estimatedDurationMin: 4,
    category: 'desk_relief',
    stations: [
      {
        exerciseId: 'right-arm-forward-flexion-seated',
        targetReps: 10,
        restAfterS: 0,
      },
    ],
    thumbnailUrl: 'images/thumb-routine-desk.jpg',
    status: 'prescribed',
  },
] as const
