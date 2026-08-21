import type { FormFlag } from './rehabTypes'

export interface ExerciseDefinition {
  id: string
  name: string
  nameZh: string
  category: string
  targetLimb: string
  targetAngleDeg: number
  holdDurationS: number
  concentricCadenceS: number
  eccentricCadenceS: number
  targetReps: number
  descriptionZh: string
  tipsZh: string[]
  commonErrorsZh: Record<FormFlag, string>
  status: 'prescribed' | 'upcoming'
}

export const EXERCISE_CATALOG: ExerciseDefinition[] = [
  {
    id: 'right-arm-forward-flexion',
    name: 'Standing Right Arm Forward Flexion',
    nameZh: '站姿右手前舉復健訓練',
    category: '肩關節活動度與肌力重建',
    targetLimb: '右手',
    targetAngleDeg: 90,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '手臂自然垂放於身側，掌心朝下，以 5 秒緩慢平舉至 90° 水平位置，維持穩定停頓 5 秒，再以 5 秒緩慢控制下放。',
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
    },
    status: 'prescribed',
  },
]
