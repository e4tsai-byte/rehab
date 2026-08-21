import type { FormFlag } from './rehabTypes'
import type { Locale } from '../i18n/locale'

export interface ExerciseDefinition {
  id: string
  name: string
  nameZh: string
  category: string
  categoryEn: string
  targetLimb: string
  targetLimbEn: string
  posture: 'standing' | 'seated'
  targetAngleDeg: number
  holdDurationS: number
  concentricCadenceS: number
  eccentricCadenceS: number
  targetReps: number
  descriptionZh: string
  descriptionEn: string
  framingHintZh: string
  framingHintEn: string
  tipsZh: string[]
  tipsEn: string[]
  commonErrorsZh: Record<FormFlag, string>
  commonErrorsEn: Record<FormFlag, string>
  thumbnailUrl: string
  diagramUrl?: string
  status: 'prescribed' | 'upcoming'
}

/** The locale-resolved view a component actually renders. */
export interface LocalizedExercise {
  id: string
  name: string
  category: string
  targetLimb: string
  description: string
  framingHint: string
  tips: string[]
  commonErrors: Record<FormFlag, string>
}

/**
 * Collapse a bilingual catalog entry down to the strings for one locale. This
 * is the single branch on language for exercise copy — components call it once
 * and read plain `.name` / `.description` fields, so no component carries a
 * `locale === 'en' ? … : …` ternary of its own.
 */
export function localizeExercise(ex: ExerciseDefinition, locale: Locale): LocalizedExercise {
  const en = locale === 'en'
  return {
    id: ex.id,
    name: en ? ex.name : ex.nameZh,
    category: en ? ex.categoryEn : ex.category,
    targetLimb: en ? ex.targetLimbEn : ex.targetLimb,
    description: en ? ex.descriptionEn : ex.descriptionZh,
    framingHint: en ? ex.framingHintEn : ex.framingHintZh,
    tips: en ? ex.tipsEn : ex.tipsZh,
    commonErrors: en ? ex.commonErrorsEn : ex.commonErrorsZh,
  }
}

/**
 * The display name for a recorded session. History stores only the Chinese name
 * (`exerciseNameZh`) it had at save time, so we resolve the current locale's
 * name from the catalog by id and fall back to the stored string when the id is
 * unknown (e.g. an exercise later removed). No storage migration needed.
 */
export function resolveExerciseName(exerciseId: string, fallback: string, locale: Locale): string {
  const ex = EXERCISE_CATALOG.find((e) => e.id === exerciseId)
  return ex ? localizeExercise(ex, locale).name : fallback
}

export const EXERCISE_CATALOG: ExerciseDefinition[] = [
  {
    id: 'right-arm-forward-flexion-standing',
    name: 'Standing Right Arm Forward Flexion',
    nameZh: '站姿右手前舉復健訓練',
    category: '站姿全身活動度與肌力重建',
    categoryEn: 'Standing full-body mobility & strength rebuild',
    targetLimb: '右手',
    targetLimbEn: 'Right arm',
    posture: 'standing',
    targetAngleDeg: 90,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '手臂自然垂放身側，以 5 秒緩慢平舉至 90° 水平位置，維持穩定停頓 5 秒，再以 5 秒緩慢控制下放。',
    descriptionEn:
      'With the arm resting at your side, raise it slowly to the 90° horizontal position over 5 seconds, hold steady for 5 seconds, then lower under control over 5 seconds.',
    framingHintZh: '請面向鏡頭站立，確保上半身與右手完整進入畫面中',
    framingHintEn: 'Stand facing the camera so your upper body and right arm are fully in frame.',
    tipsZh: [
      '保持身體直立，勿後仰借力',
      '右側肩膀放鬆下沉，避免聳肩',
      '手肘保持伸直，動作平穩緩慢',
    ],
    tipsEn: [
      "Keep the body upright; don't lean back for leverage.",
      'Let the right shoulder relax and drop; avoid shrugging.',
      'Keep the elbow straight and move smoothly and slowly.',
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
    commonErrorsEn: {
      SHOULDER_HIKE: 'Right shoulder shrugs (trapezius compensation)',
      TORSO_LEAN: 'Torso leans back or sideways for leverage',
      ELBOW_BENT: 'Elbow bends and shortens the lever arm',
      RUSHED_CONCENTRIC: 'Raising too fast (< 3 s)',
      RUSHED_ECCENTRIC: 'Lowering too fast (< 3 s)',
      INCOMPLETE_HOLD: 'Dropped before the full 5-second hold',
      PACING_TOO_FAST: 'Raise/lower tempo too fast',
      PACING_TOO_SLOW: 'Raise/lower tempo too slow',
    },
    thumbnailUrl: 'images/thumb-standing-flexion.jpg',
    diagramUrl: 'images/standing-arm-flexion-guide.jpg',
    status: 'prescribed',
  },
  {
    id: 'right-arm-forward-flexion-seated',
    name: 'Seated Desk Right Arm Forward Flexion',
    nameZh: '坐姿桌前前舉復健訓練',
    category: '辦公/書桌前上半身復健',
    categoryEn: 'Desk-based upper-body rehabilitation',
    targetLimb: '右手',
    targetLimbEn: 'Right arm',
    posture: 'seated',
    targetAngleDeg: 90,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '坐在書桌前，手臂垂放於大腿或椅側，以 5 秒平舉至 90° 水平位置，頂點穩定停頓 5 秒，再以 5 秒緩慢下放。',
    descriptionEn:
      'Seated at a desk with the arm resting on your thigh or beside the chair, raise it to the 90° horizontal position over 5 seconds, hold steady at the top for 5 seconds, then lower slowly over 5 seconds.',
    framingHintZh: '請坐在桌前，確保頭部、肩膀與右手完整進入鏡頭畫面中',
    framingHintEn:
      'Sit at the desk so your head, shoulders, and right arm are fully in the camera frame.',
    tipsZh: [
      '背部靠緊椅背或挺直，避免駝背或後仰',
      '專注右肩前三角肌，右肩放鬆避免聳肩',
      '手肘完全伸直，維持水平平舉',
    ],
    tipsEn: [
      'Keep your back against the chair or upright; avoid slouching or leaning back.',
      'Focus on the right anterior deltoid; keep the shoulder relaxed and avoid shrugging.',
      'Fully straighten the elbow and keep the raise horizontal.',
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
    commonErrorsEn: {
      SHOULDER_HIKE: 'Right shoulder shrugs (trapezius compensation)',
      TORSO_LEAN: 'Torso leans back or sideways for leverage',
      ELBOW_BENT: 'Elbow bends and shortens the lever arm',
      RUSHED_CONCENTRIC: 'Raising too fast (< 3 s)',
      RUSHED_ECCENTRIC: 'Lowering too fast (< 3 s)',
      INCOMPLETE_HOLD: 'Dropped before the full 5-second hold',
      PACING_TOO_FAST: 'Raise/lower tempo too fast',
      PACING_TOO_SLOW: 'Raise/lower tempo too slow',
    },
    thumbnailUrl: 'images/thumb-seated-flexion.jpg',
    diagramUrl: 'images/seated-desk-flexion-guide.jpg',
    status: 'prescribed',
  },
  {
    id: 'right-arm-lateral-abduction-standing',
    name: 'Standing Lateral Abduction (90°)',
    nameZh: '站姿右臂側向外展訓練',
    category: '中三角肌與棘上肌強化',
    categoryEn: 'Middle deltoid & supraspinatus strengthening',
    targetLimb: '右手',
    targetLimbEn: 'Right arm',
    posture: 'standing',
    targetAngleDeg: 90,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '手臂由身體兩側緩慢向外平舉至 90° 水平位置，維持 5 秒停頓後緩慢下放，強化中三角肌與棘上肌動態穩定。',
    descriptionEn:
      'Raise the arm slowly out to the side to the 90° horizontal position, hold for 5 seconds, then lower slowly — strengthening dynamic stability of the middle deltoid and supraspinatus.',
    framingHintZh: '請退後站立，確保雙臂外展時均在鏡頭視野內',
    framingHintEn: "Stand back so both arms stay within the camera's view when abducted.",
    tipsZh: [
      '掌心朝下或微向前，避免大拇指朝下內旋',
      '兩側肩膀沉肩，勿聳肩帶動手臂',
    ],
    tipsEn: [
      'Keep the palm down or slightly forward; avoid thumb-down internal rotation.',
      "Keep both shoulders down; don't shrug to drive the arm.",
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
    commonErrorsEn: {
      SHOULDER_HIKE: 'Shoulder shrugs in compensation',
      TORSO_LEAN: 'Torso leans sideways for leverage',
      ELBOW_BENT: 'Elbow slightly bent',
      RUSHED_CONCENTRIC: 'Abduction too fast',
      RUSHED_ECCENTRIC: 'Lowering too fast',
      INCOMPLETE_HOLD: 'Hold time not met',
      PACING_TOO_FAST: 'Tempo too fast',
      PACING_TOO_SLOW: 'Tempo too slow',
    },
    thumbnailUrl: 'images/thumb-lateral-abduction.jpg',
    diagramUrl: 'images/standing-arm-flexion-guide.jpg',
    status: 'upcoming',
  },
  {
    id: 'right-arm-scaption-standing',
    name: 'Scaption (Scapular Plane Elevation 30°)',
    nameZh: '肩胛平面抬升訓練 (Scaption)',
    category: '棘上肌孤立與關節囊減壓',
    categoryEn: 'Supraspinatus isolation & capsular decompression',
    targetLimb: '右手',
    targetLimbEn: 'Right arm',
    posture: 'standing',
    targetAngleDeg: 90,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '手臂沿肩胛骨平面（前方約 30° 夾角）平舉至 90°，在最低關節囊壓力下精準啟動旋轉肌袖。',
    descriptionEn:
      'Raise the arm along the scapular plane (about 30° forward of the side) to 90°, precisely activating the rotator cuff under minimal capsular pressure.',
    framingHintZh: '面向鏡頭，手臂微朝外斜前方 30 度平舉',
    framingHintEn: 'Face the camera and raise the arm about 30° forward of the side.',
    tipsZh: [
      '大拇指朝上（外旋位），預防夾擠',
      '維持肩胛骨貼合胸廓，平穩升降',
    ],
    tipsEn: [
      'Thumb up (external rotation) to prevent impingement.',
      'Keep the scapula against the ribcage and raise and lower smoothly.',
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
    commonErrorsEn: {
      SHOULDER_HIKE: 'Shoulder shrugs in compensation',
      TORSO_LEAN: 'Leaning back for leverage',
      ELBOW_BENT: 'Arm bends',
      RUSHED_CONCENTRIC: 'Raising too fast',
      RUSHED_ECCENTRIC: 'Lowering too fast',
      INCOMPLETE_HOLD: 'Hold too short',
      PACING_TOO_FAST: 'Tempo too fast',
      PACING_TOO_SLOW: 'Tempo too slow',
    },
    thumbnailUrl: 'images/thumb-scaption.jpg',
    diagramUrl: 'images/standing-arm-flexion-guide.jpg',
    status: 'upcoming',
  },
  {
    id: 'right-arm-external-rotation-supported',
    name: 'Supported External Rotation',
    nameZh: '桌面支撐式肩外旋訓練',
    category: '棘下肌與小圓肌肌力強化',
    categoryEn: 'Infraspinatus & teres minor strengthening',
    targetLimb: '右手',
    targetLimbEn: 'Right arm',
    posture: 'seated',
    targetAngleDeg: 45,
    holdDurationS: 5.0,
    concentricCadenceS: 5.0,
    eccentricCadenceS: 5.0,
    targetReps: 10,
    descriptionZh: '手肘彎曲 90° 貼緊身體或置於桌面，前臂向外側水平旋轉，強化肩關節後側旋轉肌群。',
    descriptionEn:
      'With the elbow bent 90° against your side or on the desk, rotate the forearm outward horizontally, strengthening the posterior rotator muscles of the shoulder.',
    framingHintZh: '坐姿側面或正對鏡頭，手臂清晰露出',
    framingHintEn: 'Seated in profile or facing the camera, with the arm clearly visible.',
    tipsZh: [
      '手肘夾緊側腹，不可向外張開',
      '手腕保持平直，勿甩手腕代償',
    ],
    tipsEn: [
      "Keep the elbow tucked against your side; don't let it drift outward.",
      "Keep the wrist straight; don't flick it to compensate.",
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
    commonErrorsEn: {
      SHOULDER_HIKE: 'Shrug compensation',
      TORSO_LEAN: 'Torso rotates for leverage',
      ELBOW_BENT: 'Elbow angle changes',
      RUSHED_CONCENTRIC: 'Rotating too fast',
      RUSHED_ECCENTRIC: 'Returning too fast',
      INCOMPLETE_HOLD: 'Hold too short',
      PACING_TOO_FAST: 'Tempo too fast',
      PACING_TOO_SLOW: 'Tempo too slow',
    },
    thumbnailUrl: 'images/thumb-external-rotation.jpg',
    diagramUrl: 'images/seated-desk-flexion-guide.jpg',
    status: 'upcoming',
  },
]
