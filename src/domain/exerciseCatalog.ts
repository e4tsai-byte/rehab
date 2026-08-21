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
  thumbnailUrl: string
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
    thumbnailUrl: '/images/thumb-standing-flexion.jpg',
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
    thumbnailUrl: '/images/thumb-seated-flexion.jpg',
    diagramUrl: '/images/seated-desk-flexion-guide.jpg',
    status: 'prescribed',
  },
  {
    id: 'right-arm-lateral-abduction-standing',
    name: 'Standing Lateral Abduction (90°)',
    nameZh: '站姿右臂側向外展訓練',
    category: '中三角肌與棘上肌強化',
    targetLimb: '右手',
    posture: 'standing',
    targetAngleDeg: 90,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '手臂由身體兩側緩慢向外平舉至 90° 水平位置，維持 5 秒停頓後緩慢下放，強化中三角肌與棘上肌動態穩定。',
    framingHintZh: '請退後站立，確保雙臂外展時均在鏡頭視野內',
    tipsZh: [
      '掌心朝下或微向前，避免大拇指朝下內旋',
      '兩側肩膀沉肩，勿聳肩帶動手臂',
    ],
    commonErrorsZh: {
      SHOULDER_HIKE: '肩關節聳起代償',
      TORSO_LEAN: '軀幹側傾借力',
      ELBOW_BENT: '手肘微彎',
      RUSHED_CONCENTRIC: '外展速度過快',
      RUSHED_ECCENTRIC: '下沉速度過快',
      INCOMPLETE_HOLD: '未滿停頓秒數',
      PACING_TOO_FAST: '速度過快',
      PACING_TOO_SLOW: '速度過慢',
    },
    thumbnailUrl: '/images/thumb-lateral-abduction.jpg',
    diagramUrl: '/images/standing-arm-flexion-guide.jpg',
    status: 'upcoming',
  },
  {
    id: 'right-arm-scaption-standing',
    name: 'Scaption (Scapular Plane Elevation 30°)',
    nameZh: '肩胛平面抬升訓練 (Scaption)',
    category: '棘上肌孤立與關節囊減壓',
    targetLimb: '右手',
    posture: 'standing',
    targetAngleDeg: 90,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '手臂沿肩胛骨平面（前方約 30° 夾角）平舉至 90°，在最低關節囊壓力下精準啟動旋轉肌袖。',
    framingHintZh: '面向鏡頭，手臂微朝外斜前方 30 度平舉',
    tipsZh: [
      '大拇指朝上（外旋位），預防夾擠',
      '維持肩胛骨貼合胸廓，平穩升降',
    ],
    commonErrorsZh: {
      SHOULDER_HIKE: '肩部聳起代償',
      TORSO_LEAN: '後仰借力',
      ELBOW_BENT: '手臂彎曲',
      RUSHED_CONCENTRIC: '速度過快',
      RUSHED_ECCENTRIC: '下放過快',
      INCOMPLETE_HOLD: '停頓不足',
      PACING_TOO_FAST: '節奏過快',
      PACING_TOO_SLOW: '節奏過慢',
    },
    thumbnailUrl: '/images/thumb-scaption.jpg',
    diagramUrl: '/images/standing-arm-flexion-guide.jpg',
    status: 'upcoming',
  },
  {
    id: 'right-arm-external-rotation-supported',
    name: 'Supported External Rotation',
    nameZh: '桌面支撐式肩外旋訓練',
    category: '棘下肌與小圓肌肌力強化',
    targetLimb: '右手',
    posture: 'seated',
    targetAngleDeg: 45,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '手肘彎曲 90° 貼緊身體或置於桌面，前臂向外側水平旋轉，強化肩關節後側旋轉肌群。',
    framingHintZh: '坐姿側面或正對鏡頭，手臂清晰露出',
    tipsZh: [
      '手肘夾緊側腹，不可向外張開',
      '手腕保持平直，勿甩手腕代償',
    ],
    commonErrorsZh: {
      SHOULDER_HIKE: '聳肩代償',
      TORSO_LEAN: '軀幹旋轉借力',
      ELBOW_BENT: '手肘角度改變',
      RUSHED_CONCENTRIC: '旋轉過快',
      RUSHED_ECCENTRIC: '回彈過快',
      INCOMPLETE_HOLD: '停頓不足',
      PACING_TOO_FAST: '速度過快',
      PACING_TOO_SLOW: '速度過慢',
    },
    thumbnailUrl: '/images/thumb-external-rotation.jpg',
    diagramUrl: '/images/seated-desk-flexion-guide.jpg',
    status: 'upcoming',
  },
]
