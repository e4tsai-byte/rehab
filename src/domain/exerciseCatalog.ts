import type { FormFlag } from './rehabTypes'

export interface ExerciseDefinition {
  id: string
  name: string
  nameZh: string
  category: string
  targetLimb: string
  posture: 'standing' | 'seated'
  targetAngleDeg: number
  holdDurationS: number
  concentricCadenceS: number
  eccentricCadenceS: number
  targetReps: number
  descriptionZh: string
  framingHintZh: string
  tipsZh: string[]
  commonErrorsZh: Record<FormFlag, string>
  diagramUrl?: string
  status: 'prescribed' | 'upcoming'
}

export const EXERCISE_CATALOG: ExerciseDefinition[] = [
  {
    id: 'right-arm-forward-flexion-standing',
    name: 'Standing Right Arm Forward Flexion',
    nameZh: '站姿右手前舉復健訓練',
    category: '站姿全身活動度與肌力重建',
    targetLimb: '右手',
    posture: 'standing',
    targetAngleDeg: 90,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '手臂自然垂放身側，以 5 秒緩慢平舉至 90° 水平位置，維持穩定停頓 5 秒，再以 5 秒緩慢控制下放。',
    framingHintZh: '請面向鏡頭站立，確保上半身與右手完整進入畫面中',
    tipsZh: [
      '保持身體直立，勿後仰借力',
      '右側肩膀放鬆下沉，避免聳肩',
      '手肘保持伸直，動作平穩緩慢',
    ],
    commonErrorsZh: {
      SHOULDER_HIKE: '右肩聳起（斜方肌代償）',
      TORSO_LEAN: '軀幹後仰或側傾借力',
      ELBOW_BENT: '手肘彎曲縮短力臂',
      RUSHED_CONCENTRIC: '平舉抬起速度過快（< 3秒）',
      RUSHED_ECCENTRIC: '下放下沉速度過快（< 3秒）',
      INCOMPLETE_HOLD: '水平停頓未滿 5 秒即掉落',
      PACING_TOO_FAST: '動作平舉/下放速度過快',
      PACING_TOO_SLOW: '動作平舉/下放速度過慢',
    },
    diagramUrl: '/images/standing-arm-flexion-guide.jpg',
    status: 'prescribed',
  },
  {
    id: 'right-arm-forward-flexion-seated',
    name: 'Seated Desk Right Arm Forward Flexion',
    nameZh: '坐姿桌前前舉復健訓練',
    category: '辦公/書桌前上半身復健',
    targetLimb: '右手',
    posture: 'seated',
    targetAngleDeg: 90,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '坐在書桌前，手臂垂放於大腿或椅側，以 5 秒平舉至 90° 水平位置，頂點穩定停頓 5 秒，再以 5 秒緩慢下放。',
    framingHintZh: '請坐在桌前，確保頭部、肩膀與右手完整進入鏡頭畫面中',
    tipsZh: [
      '背部靠緊椅背或挺直，避免駝背或後仰',
      '專注右肩前三角肌，右肩放鬆避免聳肩',
      '手肘完全伸直，維持水平平舉',
    ],
    commonErrorsZh: {
      SHOULDER_HIKE: '右肩聳起（斜方肌代償）',
      TORSO_LEAN: '軀幹後仰或側傾借力',
      ELBOW_BENT: '手肘彎曲縮短力臂',
      RUSHED_CONCENTRIC: '平舉抬起速度過快（< 3秒）',
      RUSHED_ECCENTRIC: '下放下沉速度過快（< 3秒）',
      INCOMPLETE_HOLD: '水平停頓未滿 5 秒即掉落',
      PACING_TOO_FAST: '動作平舉/下放速度過快',
      PACING_TOO_SLOW: '動作平舉/下放速度過慢',
    },
    diagramUrl: '/images/seated-desk-flexion-guide.jpg',
    status: 'prescribed',
  },
]
