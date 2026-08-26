import type { FormFlag, BodyRegion } from './rehabTypes'
import type { Locale } from '../i18n/locale'
import type { Posture } from '../pose/shoulderKinematics'

export interface BodyRegionInfo {
  id: BodyRegion
  code: string
  nameZh: string
  nameEn: string
  tagZh: string
  tagEn: string
  descriptionZh: string
  descriptionEn: string
  primaryMusclesZh: string[]
  primaryMusclesEn: string[]
  status: 'active' | 'upcoming'
}

export const BODY_REGIONS: readonly BodyRegionInfo[] = [
  {
    id: 'shoulder',
    code: 'SH',
    nameZh: '肩關節與旋轉肌群',
    nameEn: 'Shoulder & Rotator Cuff',
    tagZh: '肩部肌力與活動度',
    tagEn: 'Shoulder Strength & Mobility',
    descriptionZh:
      '前舉、側平舉、外旋與棘上肌低角度等長啟動，重建肩盂肱關節穩定性與肩胛節律。',
    descriptionEn:
      'Forward flexion, lateral abduction, external rotation, and low-angle supraspinatus holds for glenohumeral stability.',
    primaryMusclesZh: ['棘上肌', '三角肌前/中束', '前鋸肌', '棘下肌'],
    primaryMusclesEn: ['Supraspinatus', 'Anterior/Middle Deltoid', 'Serratus Anterior', 'Infraspinatus'],
    status: 'active',
  },
  {
    id: 'knee',
    code: 'KN',
    nameZh: '膝關節與股四頭肌',
    nameEn: 'Knee & Quadriceps',
    tagZh: '膝部肌力與終端伸直',
    tagEn: 'Knee Extension & Stability',
    descriptionZh:
      '股四頭肌等長收縮、終端伸膝與直膝抬腿，針對前十字韌帶修復與髕骨股骨關節追蹤。',
    descriptionEn:
      'Quad sets, terminal knee extensions, and straight leg raises for ACL recovery and patellofemoral tracking.',
    primaryMusclesZh: ['股內側肌 (VMO)', '股直肌', '膕旁肌'],
    primaryMusclesEn: ['Vastus Medialis (VMO)', 'Rectus Femoris', 'Hamstrings'],
    status: 'upcoming',
  },
  {
    id: 'hip',
    code: 'HP',
    nameZh: '髖關節與臀肌群',
    nameEn: 'Hip & Gluteal Complex',
    tagZh: '髖部穩定與外展肌力',
    tagEn: 'Hip Abduction & Pelvic Stability',
    descriptionZh:
      '側躺蚌殼式、臀橋等長支撐與側向抬腿，強化臀中肌以改善骨盆水平與步態代償。',
    descriptionEn:
      'Side-lying clamshells, bridge holds, and lateral abduction targeting the gluteus medius for pelvic control.',
    primaryMusclesZh: ['臀中肌', '臀大肌', '闊筋膜張肌'],
    primaryMusclesEn: ['Gluteus Medius', 'Gluteus Maximus', 'Tensor Fasciae Latae'],
    status: 'upcoming',
  },
  {
    id: 'elbow',
    code: 'EL',
    nameZh: '手肘與前臂肌群',
    nameEn: 'Elbow & Forearm',
    tagZh: '前臂離心與手肘穩定',
    tagEn: 'Forearm Eccentrics & Elbow Stability',
    descriptionZh:
      '手腕伸肌離心控制與前臂旋前/旋後訓練，適用於網球肘與外上髁肌腱發炎修復。',
    descriptionEn:
      'Eccentric wrist extension and forearm pronation/supination for epicondylitis rehab.',
    primaryMusclesZh: ['橈側伸腕短肌', '肱二頭肌', '旋前圓肌'],
    primaryMusclesEn: ['ECRB', 'Biceps Brachii', 'Pronator Teres'],
    status: 'upcoming',
  },
  {
    id: 'spine',
    code: 'SP',
    nameZh: '頸椎、胸椎與腰椎核心',
    nameEn: 'Spine & Core Posture',
    tagZh: '脊椎活動度與深層核心',
    tagEn: 'Spinal Mobility & Deep Core',
    descriptionZh:
      '頸椎縮下巴、胸椎旋轉與骨盆時鐘運動，重建中軸骨排列與深層頸屈肌肌耐力。',
    descriptionEn:
      'Cervical chin tucks, thoracic open books, and pelvic tilts for axial alignment and postural endurance.',
    primaryMusclesZh: ['深層頸屈肌', '胸椎伸肌', '腹橫肌'],
    primaryMusclesEn: ['Deep Neck Flexors', 'Thoracic Extensors', 'Transverse Abdominis'],
    status: 'upcoming',
  },
  {
    id: 'ankle',
    code: 'AK',
    nameZh: '腳踝與小腿肌群',
    nameEn: 'Ankle & Lower Leg',
    tagZh: '踝關節背屈與離心肌力',
    tagEn: 'Ankle Dorsiflexion & Calf Control',
    descriptionZh:
      '踝關節主動背屈與阿基里斯腱離心下放，提升本體感覺與足踝動態避震。',
    descriptionEn:
      'Active dorsiflexion and eccentric calf lowering for Achilles tendon recovery and ankle stability.',
    primaryMusclesZh: ['脛前肌', '腓腸肌', '比目魚肌'],
    primaryMusclesEn: ['Tibialis Anterior', 'Gastrocnemius', 'Soleus'],
    status: 'upcoming',
  },
]


export interface ExerciseDefinition {
  id: string
  name: string
  nameZh: string
  bodyRegion: BodyRegion
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
  status: 'available' | 'upcoming'
}

/** The locale-resolved view a component actually renders. */
export interface LocalizedExercise {
  id: string
  name: string
  bodyRegion: BodyRegion
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
    bodyRegion: ex.bodyRegion,
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
    bodyRegion: 'shoulder',
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
      OVER_ELEVATION: '此動作不涉及低角度上限',
      SHOULDER_HIKE: '右肩聳起（斜方肌代償）',
      TORSO_LEAN: '軀幹後仰或側傾借力',
      ELBOW_BENT: '手肘彎曲縮短力臂',
      RUSHED_CONCENTRIC: '平舉抬起速度過快（< 3秒）',
      RUSHED_ECCENTRIC: '下放下沉速度過快（< 3秒）',
      INCOMPLETE_HOLD: '水平停頓未滿 5 秒即掉落',
      PACING_TOO_FAST: '動作平舉/下放速度過快',
      PACING_TOO_SLOW: '動作平舉/下放速度過慢',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Not applicable to this movement',
      SHOULDER_HIKE: 'Right shoulder shrugs (trapezius compensation)',
      TORSO_LEAN: 'Torso leans back or sideways for leverage',
      ELBOW_BENT: 'Elbow bends and shortens the lever arm',
      RUSHED_CONCENTRIC: 'Raising too fast (< 3 s)',
      RUSHED_ECCENTRIC: 'Lowering too fast (< 3 s)',
      INCOMPLETE_HOLD: 'Dropped before the full 5-second hold',
      PACING_TOO_FAST: 'Raise/lower tempo too fast',
      PACING_TOO_SLOW: 'Raise/lower tempo too slow',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/thumb-standing-flexion.jpg',
    diagramUrl: 'images/standing-arm-flexion-guide.jpg',
    status: 'available',
  },
  {
    id: 'right-arm-forward-flexion-seated',
    name: 'Seated Desk Right Arm Forward Flexion',
    nameZh: '坐姿桌前前舉復健訓練',
    bodyRegion: 'shoulder',
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
      OVER_ELEVATION: '此動作不涉及低角度上限',
      SHOULDER_HIKE: '右肩聳起（斜方肌代償）',
      TORSO_LEAN: '軀幹後仰或側傾借力',
      ELBOW_BENT: '手肘彎曲縮短力臂',
      RUSHED_CONCENTRIC: '平舉抬起速度過快（< 3秒）',
      RUSHED_ECCENTRIC: '下放下沉速度過快（< 3秒）',
      INCOMPLETE_HOLD: '水平停頓未滿 5 秒即掉落',
      PACING_TOO_FAST: '動作平舉/下放速度過快',
      PACING_TOO_SLOW: '動作平舉/下放速度過慢',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Not applicable to this movement',
      SHOULDER_HIKE: 'Right shoulder shrugs (trapezius compensation)',
      TORSO_LEAN: 'Torso leans back or sideways for leverage',
      ELBOW_BENT: 'Elbow bends and shortens the lever arm',
      RUSHED_CONCENTRIC: 'Raising too fast (< 3 s)',
      RUSHED_ECCENTRIC: 'Lowering too fast (< 3 s)',
      INCOMPLETE_HOLD: 'Dropped before the full 5-second hold',
      PACING_TOO_FAST: 'Raise/lower tempo too fast',
      PACING_TOO_SLOW: 'Raise/lower tempo too slow',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/thumb-seated-flexion.jpg',
    diagramUrl: 'images/seated-desk-flexion-guide.jpg',
    status: 'available',
  },
  // PLACEHOLDER — architectural roadmap row only. Numeric values (angle/hold/cadence)
  // and copy are illustrative, not clinically authored. Do not treat as validated
  // until this exercise goes through the physiatrist → kinematicist →
  // measurement-engineer → qa-engineer chain (AGENTS.md).
  {
    id: 'right-arm-lateral-abduction-standing',
    name: 'Standing Lateral Abduction (90°)',
    nameZh: '站姿右臂側向外展訓練',
    bodyRegion: 'shoulder',
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
      OVER_ELEVATION: '此動作不涉及低角度上限',
      SHOULDER_HIKE: '肩關節聳起代償',
      TORSO_LEAN: '軀幹側傾借力',
      ELBOW_BENT: '手肘微彎',
      RUSHED_CONCENTRIC: '外展速度過快',
      RUSHED_ECCENTRIC: '下沉速度過快',
      INCOMPLETE_HOLD: '未滿停頓秒數',
      PACING_TOO_FAST: '速度過快',
      PACING_TOO_SLOW: '速度過慢',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Not applicable to this movement',
      SHOULDER_HIKE: 'Shoulder shrugs in compensation',
      TORSO_LEAN: 'Torso leans sideways for leverage',
      ELBOW_BENT: 'Elbow slightly bent',
      RUSHED_CONCENTRIC: 'Abduction too fast',
      RUSHED_ECCENTRIC: 'Lowering too fast',
      INCOMPLETE_HOLD: 'Hold time not met',
      PACING_TOO_FAST: 'Tempo too fast',
      PACING_TOO_SLOW: 'Tempo too slow',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/exercises/wip-exercise.jpg',
    diagramUrl: 'images/lateral-abduction-guide.jpg',
    status: 'upcoming',
  },
  // PLACEHOLDER — architectural roadmap row only. Numeric values (angle/hold/cadence)
  // and copy are illustrative, not clinically authored. Do not treat as validated
  // until this exercise goes through the physiatrist → kinematicist →
  // measurement-engineer → qa-engineer chain (AGENTS.md).
  {
    id: 'right-arm-scaption-standing',
    name: 'Scaption (Scapular Plane Elevation 30°)',
    nameZh: '肩胛平面抬升訓練 (Scaption)',
    bodyRegion: 'shoulder',
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
      OVER_ELEVATION: '此動作不涉及低角度上限',
      SHOULDER_HIKE: '肩部聳起代償',
      TORSO_LEAN: '後仰借力',
      ELBOW_BENT: '手臂彎曲',
      RUSHED_CONCENTRIC: '速度過快',
      RUSHED_ECCENTRIC: '下放過快',
      INCOMPLETE_HOLD: '停頓不足',
      PACING_TOO_FAST: '節奏過快',
      PACING_TOO_SLOW: '節奏過慢',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Not applicable to this movement',
      SHOULDER_HIKE: 'Shoulder shrugs in compensation',
      TORSO_LEAN: 'Leaning back for leverage',
      ELBOW_BENT: 'Arm bends',
      RUSHED_CONCENTRIC: 'Raising too fast',
      RUSHED_ECCENTRIC: 'Lowering too fast',
      INCOMPLETE_HOLD: 'Hold too short',
      PACING_TOO_FAST: 'Tempo too fast',
      PACING_TOO_SLOW: 'Tempo too slow',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/exercises/wip-exercise.jpg',
    diagramUrl: 'images/scaption-guide.jpg',
    status: 'upcoming',
  },
  // PLACEHOLDER — architectural roadmap row only. Numeric values (angle/hold/cadence)
  // and copy are illustrative, not clinically authored. Do not treat as validated
  // until this exercise goes through the physiatrist → kinematicist →
  // measurement-engineer → qa-engineer chain (AGENTS.md).
  {
    id: 'right-arm-external-rotation-supported',
    name: 'Supported External Rotation',
    nameZh: '桌面支撐式肩外旋訓練',
    bodyRegion: 'shoulder',
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
      OVER_ELEVATION: '此動作不涉及低角度上限',
      SHOULDER_HIKE: '聳肩代償',
      TORSO_LEAN: '軀幹旋轉借力',
      ELBOW_BENT: '手肘角度改變',
      RUSHED_CONCENTRIC: '旋轉過快',
      RUSHED_ECCENTRIC: '回彈過快',
      INCOMPLETE_HOLD: '停頓不足',
      PACING_TOO_FAST: '速度過快',
      PACING_TOO_SLOW: '速度過慢',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Not applicable to this movement',
      SHOULDER_HIKE: 'Shrug compensation',
      TORSO_LEAN: 'Torso rotates for leverage',
      ELBOW_BENT: 'Elbow angle changes',
      RUSHED_CONCENTRIC: 'Rotating too fast',
      RUSHED_ECCENTRIC: 'Returning too fast',
      INCOMPLETE_HOLD: 'Hold too short',
      PACING_TOO_FAST: 'Tempo too fast',
      PACING_TOO_SLOW: 'Tempo too slow',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/exercises/wip-exercise.jpg',
    diagramUrl: 'images/external-rotation-guide.jpg',
    status: 'upcoming',
  },
  {
    id: 'right-arm-side-lying-abduction-hold',
    name: 'Side-Lying Right Arm Low Abduction Hold (10–15°)',
    nameZh: '側臥右臂低角度外展等長支撐',
    bodyRegion: 'shoulder',
    category: '棘上肌低角度等長肌耐力',
    categoryEn: 'Low-angle supraspinatus isometric endurance',
    targetLimb: '右手',
    targetLimbEn: 'Right arm',
    posture: 'sideLying',
    trackingModel: 'isometricHold',
    targetAngleDeg: 12,
    holdDurationS: 20,
    concentricCadenceS: 2.0,
    eccentricCadenceS: 2.0,
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
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
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
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/thumb-side-lying-hold.jpg',
    diagramUrl: 'images/side-lying-abduction-guide.jpg',
    status: 'available',
  },
  // ── Knee Region Exercises ──────────────────────────────────────────
  // PLACEHOLDER — architectural roadmap row only. Numeric values (angle/hold/cadence)
  // and copy are illustrative, not clinically authored. Do not treat as validated
  // until this exercise goes through the physiatrist → kinematicist →
  // measurement-engineer → qa-engineer chain (AGENTS.md).
  {
    id: 'knee-quad-sets-seated',
    name: 'Seated Isometric Quad Sets',
    nameZh: '坐姿股四頭肌等長收縮 (Quad Sets)',
    bodyRegion: 'knee',
    category: '股四頭肌神經肌肉啟動',
    categoryEn: 'Quadriceps neuromuscular activation',
    targetLimb: '膝關節',
    targetLimbEn: 'Knee joint',
    posture: 'seated',
    targetAngleDeg: 0,
    holdDurationS: 10,
    concentricCadenceS: 2.0,
    eccentricCadenceS: 2.0,
    targetReps: 10,
    trackingModel: 'isometricHold',
    descriptionZh: '坐於床面或地面，膝蓋下方墊毛巾捲，主動向下壓毛巾使大腿前側股四頭肌強力等長緊繃收縮 10 秒。',
    descriptionEn: 'Seated with a small towel roll under the knee, press the back of the knee downward to actively contract the quadriceps for 10 seconds.',
    framingHintZh: '鏡頭置於側面，確保大腿、膝關節與腳踝完整入鏡',
    framingHintEn: 'Position camera in sagittal view so thigh, knee, and ankle are clearly visible.',
    tipsZh: ['腳趾朝上勾起', '感受股內側肌 (VMO) 堅硬緊繃', '保持平穩呼吸勿憋氣'],
    tipsEn: ['Keep toes pointed up', 'Focus on tightening the vastus medialis', 'Maintain smooth breathing'],
    commonErrorsZh: {
      OVER_ELEVATION: '無關聯',
      SHOULDER_HIKE: '聳肩出力',
      TORSO_LEAN: '軀幹向後傾斜',
      ELBOW_BENT: '手部支撐借力',
      INCOMPLETE_HOLD: '未滿10秒即放鬆',
      RUSHED_CONCENTRIC: '此動作為等長支撐，無節奏節拍',
      RUSHED_ECCENTRIC: '此動作為等長支撐，無節奏節拍',
      PACING_TOO_FAST: '此動作為等長支撐，無節奏節拍',
      PACING_TOO_SLOW: '此動作為等長支撐，無節奏節拍',
      LUMBAR_ARCH: '過度挺腰代償',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Not applicable',
      SHOULDER_HIKE: 'Shoulders tense up',
      TORSO_LEAN: 'Torso leans backward',
      ELBOW_BENT: 'Arm pushing excessively',
      INCOMPLETE_HOLD: 'Hold released too early',
      RUSHED_CONCENTRIC: 'This is an isometric hold; there is no tempo to pace',
      RUSHED_ECCENTRIC: 'This is an isometric hold; there is no tempo to pace',
      PACING_TOO_FAST: 'This is an isometric hold; there is no tempo to pace',
      PACING_TOO_SLOW: 'This is an isometric hold; there is no tempo to pace',
      LUMBAR_ARCH: 'Excessive lumbar arching',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/exercises/wip-exercise.jpg',
    status: 'upcoming',
  },
  // PLACEHOLDER — architectural roadmap row only. Numeric values (angle/hold/cadence)
  // and copy are illustrative, not clinically authored. Do not treat as validated
  // until this exercise goes through the physiatrist → kinematicist →
  // measurement-engineer → qa-engineer chain (AGENTS.md).
  {
    id: 'knee-terminal-extension-standing',
    name: 'Terminal Knee Extension (TKE)',
    nameZh: '站姿終端伸膝控制訓練 (TKE)',
    bodyRegion: 'knee',
    category: '終端伸膝與髕骨軌跡穩定',
    categoryEn: 'Terminal knee extension & patellar tracking',
    targetLimb: '膝關節',
    targetLimbEn: 'Knee joint',
    posture: 'standing',
    targetAngleDeg: 30,
    holdDurationS: 3.0,
    concentricCadenceS: 3.0,
    eccentricCadenceS: 3.0,
    targetReps: 12,
    trackingModel: 'pacedElevation',
    descriptionZh: '站姿下膝關節由微彎 30° 緩慢平穩伸直鎖定，頂點停頓 3 秒，強化股內側肌於終端伸膝時的動態控制。',
    descriptionEn: 'From a 30° soft knee bend, smoothly extend to complete knee lock and hold for 3 seconds to train terminal extension control.',
    framingHintZh: '站姿側面取景，確保髖、膝、踝關節都在畫面內',
    framingHintEn: 'Side view capturing hip, knee, and ankle joints in frame.',
    tipsZh: ['腳跟完全著地', '膝關節對齊第二腳趾方向', '骨盆保持水平中立'],
    tipsEn: ['Keep heel flat on ground', 'Knee tracks over second toe', 'Keep pelvis level and neutral'],
    commonErrorsZh: {
      OVER_ELEVATION: '無關聯',
      SHOULDER_HIKE: '上半身聳肩',
      TORSO_LEAN: '骨盆前傾或側移',
      ELBOW_BENT: '無關聯',
      INCOMPLETE_HOLD: '伸直停頓不足',
      RUSHED_CONCENTRIC: '伸膝過快',
      RUSHED_ECCENTRIC: '屈膝回彈過快',
      PACING_TOO_FAST: '節奏過快',
      PACING_TOO_SLOW: '節奏過慢',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '膝過伸 (Hyperextension)',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Not applicable',
      SHOULDER_HIKE: 'Upper body tenses',
      TORSO_LEAN: 'Pelvic shift',
      ELBOW_BENT: 'Not applicable',
      INCOMPLETE_HOLD: 'Hold time too short',
      RUSHED_CONCENTRIC: 'Extending too quickly',
      RUSHED_ECCENTRIC: 'Flexing too fast',
      PACING_TOO_FAST: 'Pacing too fast',
      PACING_TOO_SLOW: 'Pacing too slow',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Knee hyperextension',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/exercises/wip-exercise.jpg',
    status: 'upcoming',
  },
  // ── Hip Region Exercises ───────────────────────────────────────────
  // PLACEHOLDER — architectural roadmap row only. Numeric values (angle/hold/cadence)
  // and copy are illustrative, not clinically authored. Do not treat as validated
  // until this exercise goes through the physiatrist → kinematicist →
  // measurement-engineer → qa-engineer chain (AGENTS.md).
  {
    id: 'hip-clamshell-side-lying',
    name: 'Side-Lying Clamshell Activation',
    nameZh: '側躺蚌殼式臀中肌啟動 (Clamshell)',
    bodyRegion: 'hip',
    category: '臀中肌外展與骨盆穩定',
    categoryEn: 'Gluteus medius abduction & pelvic stability',
    targetLimb: '髖關節',
    targetLimbEn: 'Hip joint',
    posture: 'sideLying',
    targetAngleDeg: 45,
    holdDurationS: 3.0,
    concentricCadenceS: 3.0,
    eccentricCadenceS: 3.0,
    targetReps: 12,
    trackingModel: 'pacedElevation',
    descriptionZh: '側臥雙膝彎曲 90°，雙腳腳跟保持貼合，上方膝蓋緩慢如貝殼開啟至 45°，頂點停頓 3 秒後下放。',
    descriptionEn: 'Lie on your side with knees bent at 90°, heels touching; smoothly open the top knee like a clamshell to 45° and hold for 3 seconds.',
    framingHintZh: '相機置於地面，側臥面對或斜對鏡頭',
    framingHintEn: 'Camera on floor in frontal/oblique view capturing lower body.',
    tipsZh: ['骨盆保持垂直地面，勿向後翻倒', '專注臀部外側酸脹感', '腳跟持續輕碰'],
    tipsEn: ['Keep pelvis perpendicular to floor; do not roll back', 'Focus on the lateral glute burn', 'Keep heels glued together'],
    commonErrorsZh: {
      OVER_ELEVATION: '無關聯',
      SHOULDER_HIKE: '無關聯',
      TORSO_LEAN: '骨盆後翻代償',
      ELBOW_BENT: '無關聯',
      INCOMPLETE_HOLD: '頂點停頓不足',
      RUSHED_CONCENTRIC: '開腿過快',
      RUSHED_ECCENTRIC: '闔腿過快',
      PACING_TOO_FAST: '節奏過快',
      PACING_TOO_SLOW: '節奏過慢',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '過度外展導致骨盆翻轉',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Not applicable',
      SHOULDER_HIKE: 'Not applicable',
      TORSO_LEAN: 'Pelvic roll backward',
      ELBOW_BENT: 'Not applicable',
      INCOMPLETE_HOLD: 'Hold time too short',
      RUSHED_CONCENTRIC: 'Opening too quickly',
      RUSHED_ECCENTRIC: 'Closing too quickly',
      PACING_TOO_FAST: 'Pacing too fast',
      PACING_TOO_SLOW: 'Pacing too slow',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Excessive opening causing pelvic roll',
    },
    thumbnailUrl: 'images/exercises/wip-exercise.jpg',
    status: 'upcoming',
  },
  // ── Elbow & Forearm Exercises ──────────────────────────────────────
  // PLACEHOLDER — architectural roadmap row only. Numeric values (angle/hold/cadence)
  // and copy are illustrative, not clinically authored. Do not treat as validated
  // until this exercise goes through the physiatrist → kinematicist →
  // measurement-engineer → qa-engineer chain (AGENTS.md).
  {
    id: 'elbow-wrist-eccentric-extension',
    name: 'Eccentric Wrist Extension (Tennis Elbow)',
    nameZh: '手腕伸肌離心下放訓練 (網球肘復健)',
    bodyRegion: 'elbow',
    category: '前臂伸肌腱離心肌力與膠原重塑',
    categoryEn: 'Forearm extensor tendon eccentric loading',
    targetLimb: '手肘/前臂',
    targetLimbEn: 'Elbow/Forearm',
    posture: 'seated',
    targetAngleDeg: 60,
    holdDurationS: 2.0,
    concentricCadenceS: 2.0,
    eccentricCadenceS: 5.0,
    targetReps: 12,
    trackingModel: 'pacedElevation',
    descriptionZh: '前臂平放於桌面、手腕懸空，以 2 秒抬起手腕後，進行 5 秒超慢速離心控制下放，促進肌腱膠原纖維排列。',
    descriptionEn: 'Forearm resting on table with hand off edge; lift wrist in 2 seconds, then lower under slow 5-second eccentric control.',
    framingHintZh: '坐姿桌前近景，清晰露出前臂與手腕',
    framingHintEn: 'Close-up seated view showing forearm and wrist clearly.',
    tipsZh: ['前臂不可離開桌面', '下放過程嚴格維持 5 秒等速', '動作應無尖銳疼痛'],
    tipsEn: ['Forearm stays glued to table', 'Lower steadily over full 5 seconds', 'Movement should not cause sharp pain'],
    commonErrorsZh: {
      OVER_ELEVATION: '過度翹起手腕',
      SHOULDER_HIKE: '肩部縮緊代償',
      TORSO_LEAN: '身體向後倒',
      ELBOW_BENT: '前臂離桌',
      INCOMPLETE_HOLD: '頂點過短',
      RUSHED_CONCENTRIC: '抬起過快',
      RUSHED_ECCENTRIC: '下放未達5秒（下墜）',
      PACING_TOO_FAST: '離心下放過快',
      PACING_TOO_SLOW: '節奏過慢',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Excessive wrist extension',
      SHOULDER_HIKE: 'Shoulder tension',
      TORSO_LEAN: 'Torso lean',
      ELBOW_BENT: 'Forearm lifts from desk',
      INCOMPLETE_HOLD: 'Hold too short',
      RUSHED_CONCENTRIC: 'Lifting too fast',
      RUSHED_ECCENTRIC: 'Dropping down under 5 seconds',
      PACING_TOO_FAST: 'Eccentric phase too fast',
      PACING_TOO_SLOW: 'Pacing too slow',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/exercises/wip-exercise.jpg',
    status: 'upcoming',
  },
  // ── Spine & Core Exercises ─────────────────────────────────────────
  // PLACEHOLDER — architectural roadmap row only. Numeric values (angle/hold/cadence)
  // and copy are illustrative, not clinically authored. Do not treat as validated
  // until this exercise goes through the physiatrist → kinematicist →
  // measurement-engineer → qa-engineer chain (AGENTS.md).
  {
    id: 'spine-cervical-chin-tuck',
    name: 'Cervical Retraction Chin Tuck',
    nameZh: '頸椎深層屈肌收縮 (Chin Tuck)',
    bodyRegion: 'spine',
    category: '頸椎中軸排列與深層頸屈肌肌耐力',
    categoryEn: 'Cervical axial alignment & deep neck flexors',
    targetLimb: '頸椎/中軸',
    targetLimbEn: 'Cervical spine',
    posture: 'seated',
    targetAngleDeg: 0,
    holdDurationS: 5.0,
    concentricCadenceS: 2.0,
    eccentricCadenceS: 2.0,
    targetReps: 10,
    trackingModel: 'isometricHold',
    descriptionZh: '端坐挺胸，眼睛平視前方，將下巴水平向後平移收回（做雙下巴動作），感受頸後側被拉長，維持 5 秒。',
    descriptionEn: 'Sitting upright with eyes forward, draw your chin horizontally backward into a gentle double chin, elongating the back of the neck for 5 seconds.',
    framingHintZh: '坐姿側面取景，鏡頭與頭部同高',
    framingHintEn: 'Side view at eye level capturing head and cervical alignment.',
    tipsZh: ['視線保持水平，勿低頭或仰頭', '感受頭頂向上延伸長高', '下巴向後滑動而非向下點頭'],
    tipsEn: ['Keep gaze straight ahead; do not nod down or tilt up', 'Feel length through the crown of the head', 'Slide chin backward horizontally'],
    commonErrorsZh: {
      OVER_ELEVATION: '仰頭看天花板',
      SHOULDER_HIKE: '聳肩縮脖子',
      TORSO_LEAN: '駝背或後仰',
      ELBOW_BENT: '無關聯',
      INCOMPLETE_HOLD: '未滿5秒即鬆開',
      RUSHED_CONCENTRIC: '此動作為等長支撐，無節奏節拍',
      RUSHED_ECCENTRIC: '此動作為等長支撐，無節奏節拍',
      PACING_TOO_FAST: '此動作為等長支撐，無節奏節拍',
      PACING_TOO_SLOW: '此動作為等長支撐，無節奏節拍',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Tilting head upward',
      SHOULDER_HIKE: 'Shoulders shrugging up',
      TORSO_LEAN: 'Slouching or leaning back',
      ELBOW_BENT: 'Not applicable',
      INCOMPLETE_HOLD: 'Hold released too early',
      RUSHED_CONCENTRIC: 'This is an isometric hold; there is no tempo to pace',
      RUSHED_ECCENTRIC: 'This is an isometric hold; there is no tempo to pace',
      PACING_TOO_FAST: 'This is an isometric hold; there is no tempo to pace',
      PACING_TOO_SLOW: 'This is an isometric hold; there is no tempo to pace',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/exercises/wip-exercise.jpg',
    status: 'upcoming',
  },
  // ── Ankle & Lower Leg Exercises ────────────────────────────────────
  // PLACEHOLDER — architectural roadmap row only. Numeric values (angle/hold/cadence)
  // and copy are illustrative, not clinically authored. Do not treat as validated
  // until this exercise goes through the physiatrist → kinematicist →
  // measurement-engineer → qa-engineer chain (AGENTS.md).
  {
    id: 'ankle-dorsiflexion-seated',
    name: 'Seated Active Ankle Dorsiflexion',
    nameZh: '坐姿踝關節主動背屈 (Ankle Dorsiflexion)',
    bodyRegion: 'ankle',
    category: '脛前肌肌力與步態腳尖抬起控制',
    categoryEn: 'Tibialis anterior activation & foot clearance',
    targetLimb: '踝關節',
    targetLimbEn: 'Ankle joint',
    posture: 'seated',
    targetAngleDeg: 20,
    holdDurationS: 3.0,
    concentricCadenceS: 3.0,
    eccentricCadenceS: 3.0,
    targetReps: 15,
    trackingModel: 'pacedElevation',
    descriptionZh: '坐姿雙腳腳跟著地，將腳尖與腳掌主動向上勾起至最大角度，頂點停頓 3 秒，再以 3 秒緩慢下放著地。',
    descriptionEn: 'Seated with heels grounded, actively pull toes and forefoot upward toward the shin, hold 3 seconds, then lower slowly over 3 seconds.',
    framingHintZh: '鏡頭置於腳踝高度側面視角',
    framingHintEn: 'Camera placed at lower leg height in side profile.',
    tipsZh: ['腳跟固定在地面不移動', '感受小腿前側肌肉緊繃', '腳掌保持平整勿內翻或外翻'],
    tipsEn: ['Heel stays planted firmly', 'Feel the shin muscle working', 'Keep foot neutral without rolling inward or outward'],
    commonErrorsZh: {
      OVER_ELEVATION: '無關聯',
      SHOULDER_HIKE: '無關聯',
      TORSO_LEAN: '身體過度後傾',
      ELBOW_BENT: '無關聯',
      INCOMPLETE_HOLD: '背屈停頓不足',
      RUSHED_CONCENTRIC: '勾腳過快',
      RUSHED_ECCENTRIC: '腳掌拍地（無離心控制）',
      PACING_TOO_FAST: '速度過快',
      PACING_TOO_SLOW: '速度過慢',
      LUMBAR_ARCH: '無關聯',
      KNEE_HYPEREXTENSION: '無關聯',
      PELVIC_ROLL: '無關聯',
    },
    commonErrorsEn: {
      OVER_ELEVATION: 'Not applicable',
      SHOULDER_HIKE: 'Not applicable',
      TORSO_LEAN: 'Torso leaning backward',
      ELBOW_BENT: 'Not applicable',
      INCOMPLETE_HOLD: 'Hold time too short',
      RUSHED_CONCENTRIC: 'Pulling up too fast',
      RUSHED_ECCENTRIC: 'Slapping foot down',
      PACING_TOO_FAST: 'Pacing too fast',
      PACING_TOO_SLOW: 'Pacing too slow',
      LUMBAR_ARCH: 'Not applicable',
      KNEE_HYPEREXTENSION: 'Not applicable',
      PELVIC_ROLL: 'Not applicable',
    },
    thumbnailUrl: 'images/exercises/wip-exercise.jpg',
    status: 'upcoming',
  },
]


