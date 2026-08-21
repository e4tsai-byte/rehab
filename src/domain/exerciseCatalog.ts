import type { FormFlag } from './rehabTypes'
import type { Locale } from '../i18n/locale'
import type { Posture } from '../pose/shoulderKinematics'

export interface ExerciseDefinition {
  id: string
  name: string
  nameZh: string
  category: string
  categoryEn: string
  targetLimb: string
  targetLimbEn: string
  posture: Posture
  // Which state machine drives this exercise (§9 D2): the paced RESTING→ASCENDING
  // →HOLDING→DESCENDING elevation ramp, or the side-lying isometric READY→HOLDING
  // hold. Selected in usePoseTracker; the target is a FLOOR for paced and a
  // CEILING for the hold.
  trackingModel: 'pacedElevation' | 'isometricHold'
  targetAngleDeg: number
  holdDurationS: number
  concentricCadenceS: number
  eccentricCadenceS: number
  targetReps: number
  // Prescribed sessions per day (§9 D4). Optional: absent = no daily-frequency
  // goal (today's behavior for the paced entries). Adherence is COMPUTED from
  // CompletedSession history — no new persisted state (invariant 1).
  dailySessionTarget?: number
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
    trackingModel: 'pacedElevation',
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
      // OVER_ELEVATION is dead-but-typed for the paced exercises: their target is a
      // FLOOR the arm climbs to, not a low ceiling, so the flag never fires here.
      // Present only to satisfy Record<FormFlag, string>; copywriter to revisit.
      OVER_ELEVATION: '此動作不涉及低角度上限',
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
      // Dead-but-typed for the paced exercises (target is a floor, not a low
      // ceiling); present only for Record<FormFlag, string> completeness.
      OVER_ELEVATION: 'Not applicable to this movement',
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
    trackingModel: 'pacedElevation',
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
      // OVER_ELEVATION is dead-but-typed for the paced exercises: their target is a
      // FLOOR the arm climbs to, not a low ceiling, so the flag never fires here.
      // Present only to satisfy Record<FormFlag, string>; copywriter to revisit.
      OVER_ELEVATION: '此動作不涉及低角度上限',
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
      // Dead-but-typed for the paced exercises (target is a floor, not a low
      // ceiling); present only for Record<FormFlag, string> completeness.
      OVER_ELEVATION: 'Not applicable to this movement',
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
    trackingModel: 'pacedElevation',
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
      // OVER_ELEVATION is dead-but-typed for the paced exercises: their target is a
      // FLOOR the arm climbs to, not a low ceiling, so the flag never fires here.
      // Present only to satisfy Record<FormFlag, string>; copywriter to revisit.
      OVER_ELEVATION: '此動作不涉及低角度上限',
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
      // Dead-but-typed for the paced exercises (target is a floor, not a low
      // ceiling); present only for Record<FormFlag, string> completeness.
      OVER_ELEVATION: 'Not applicable to this movement',
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
    trackingModel: 'pacedElevation',
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
      // OVER_ELEVATION is dead-but-typed for the paced exercises: their target is a
      // FLOOR the arm climbs to, not a low ceiling, so the flag never fires here.
      // Present only to satisfy Record<FormFlag, string>; copywriter to revisit.
      OVER_ELEVATION: '此動作不涉及低角度上限',
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
      // Dead-but-typed for the paced exercises (target is a floor, not a low
      // ceiling); present only for Record<FormFlag, string> completeness.
      OVER_ELEVATION: 'Not applicable to this movement',
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
    trackingModel: 'pacedElevation',
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
      // OVER_ELEVATION is dead-but-typed for the paced exercises: their target is a
      // FLOOR the arm climbs to, not a low ceiling, so the flag never fires here.
      // Present only to satisfy Record<FormFlag, string>; copywriter to revisit.
      OVER_ELEVATION: '此動作不涉及低角度上限',
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
      // Dead-but-typed for the paced exercises (target is a floor, not a low
      // ceiling); present only for Record<FormFlag, string> completeness.
      OVER_ELEVATION: 'Not applicable to this movement',
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
  {
    // §9 — the first exercise on the isometric-hold model. Side-lying, right (top)
    // arm, low 10–15° abduction CEILING held ~20s. Cadence fields are INERT here
    // (no concentric/eccentric tempo); kept only so the shape matches the paced
    // entries. Dose is a FIXED prescription (targetReps=5, holdDurationS=20) and
    // does NOT read the global Settings sliders — see RehabTraining.
    id: 'right-arm-side-lying-abduction-hold',
    name: 'Side-Lying Right Arm Low Abduction Hold (10–15°)',
    nameZh: '側臥右臂低角度外展等長支撐',
    category: '棘上肌低角度等長肌耐力',
    categoryEn: 'Low-angle supraspinatus isometric endurance',
    targetLimb: '右手',
    targetLimbEn: 'Right arm',
    posture: 'sideLying',
    trackingModel: 'isometricHold',
    targetAngleDeg: 12,
    holdDurationS: 20,
    concentricCadenceS: 2.0, // INERT — no tempo on the isometric model
    eccentricCadenceS: 2.0, // INERT — no tempo on the isometric model
    targetReps: 5,
    dailySessionTarget: 2,
    descriptionZh:
      '向左側躺，右手臂伸直、掌心朝向大腿，將手臂由身側向上抬起約 10–15°，維持在這個低位等長支撐 20 秒（可漸進至 30 秒）。重點在於低角度啟動棘上肌，不追求抬高。每回合 5 次，每日至少 2 回合。請在臨床醫師允許此階段進行主動等長訓練後再開始；過程中應感覺到肌肉用力，而非疼痛。',
    descriptionEn:
      'Lie on your left side with the right arm straight and palm facing your thigh. Lift the arm about 10–15° away from your side and hold that low position for 20 seconds (progress toward 30). The point is to activate the supraspinatus at a low angle — do not lift higher. Five holds per session, at least two sessions a day. Begin only once your clinician has cleared active isometric holds for your current stage; the hold should feel like muscular effort, not pain.',
    framingHintZh:
      '向左側躺，面向裝置。將裝置放在胸前約一手臂距離的地面上，螢幕直立、鏡頭與肩同高，讓肩、肘、腕與髖都在畫面內。上方的右手是訓練側。',
    framingHintEn:
      "Lie on your left side facing the device. Set it on the floor about one arm's length in front of your chest, screen upright and the lens level with your shoulder. Keep your shoulder, elbow, wrist, and hip all in frame. Your top (right) arm is the working arm.",
    tipsZh: [
      '掌心朝向大腿（中立位），避免大拇指朝下內旋',
      '肩膀放鬆下沉、遠離耳朵，勿聳肩帶動手臂',
      '軀幹保持穩定側躺，勿向後翻滾借力',
      '手肘保持伸直',
      '低角度就是目標，不要越抬越高',
    ],
    tipsEn: [
      'Palm faces the thigh (neutral); avoid rotating the thumb down.',
      "Let the shoulder relax and drop away from the ear; don't shrug to drive the arm.",
      "Keep the trunk stable on your side; don't roll backward for leverage.",
      'Keep the elbow straight.',
      'Low is the goal — do not lift higher.',
    ],
    commonErrorsZh: {
      OVER_ELEVATION: '手臂抬得過高（超過 15°），改由中三角肌與上斜方肌出力',
      SHOULDER_HIKE: '肩膀朝耳朵方向聳起，以上斜方肌上提手臂',
      TORSO_LEAN: '軀幹向後翻滾借力',
      ELBOW_BENT: '手肘彎曲，縮短力臂並改變施力肌群',
      INCOMPLETE_HOLD: '手臂在完成秒數前即落下，低於低位下限',
      RUSHED_CONCENTRIC: '此動作為等長支撐，無節奏節拍',
      RUSHED_ECCENTRIC: '此動作為等長支撐，無節奏節拍',
      PACING_TOO_FAST: '此動作為等長支撐，無節奏節拍',
      PACING_TOO_SLOW: '此動作為等長支撐，無節奏節拍',
    },
    commonErrorsEn: {
      OVER_ELEVATION:
        'Arm lifted too high (past 15°), shifting the work to the middle deltoid and upper trapezius',
      SHOULDER_HIKE: 'Shoulder hikes toward the ear, hoisting the arm with the upper trapezius',
      TORSO_LEAN: 'Trunk rolls backward to offload the arm',
      ELBOW_BENT: 'Elbow bends, shortening the lever and shifting the load',
      INCOMPLETE_HOLD: 'Arm drops below the low band before the hold time is met',
      RUSHED_CONCENTRIC: 'This is an isometric hold; there is no tempo to pace',
      RUSHED_ECCENTRIC: 'This is an isometric hold; there is no tempo to pace',
      PACING_TOO_FAST: 'This is an isometric hold; there is no tempo to pace',
      PACING_TOO_SLOW: 'This is an isometric hold; there is no tempo to pace',
    },
    thumbnailUrl: 'images/thumb-side-lying-hold.jpg',
    diagramUrl: 'images/side-lying-abduction-guide.jpg',
    status: 'prescribed',
  },
]
