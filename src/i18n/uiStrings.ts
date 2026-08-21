/* UI-chrome copy for both locales.
 *
 * This table holds interface text only — labels, buttons, headings, live
 * coaching cues. Copy that describes a specific exercise, routine, or recovery
 * stage lives beside its data in `domain/` (invariant §4) with a `localize*`
 * selector; it is NOT duplicated here.
 *
 * TONE (invariant 1.6, and it governs the English exactly as it governs the
 * Chinese): dignified, no cheerfulness, no exclamation marks. A finished set
 * reads "completed", never "stopped". Corrective copy names the observable
 * action, not the person's failure — "Relax the shoulder down", never "You
 * shrugged". Someone who manages three reps has a valid recorded outcome and
 * the copy must not suggest they broke something.
 *
 * The English table is typed against the Chinese keys, so a missing translation
 * is a compile error rather than a silent fall-through.
 */

import type { Locale } from './locale'

const zh = {
  // ── Units / formatting ──────────────────────────────────────────────
  'fmt.reps': '{n} 次',
  'fmt.seconds': '{n} 秒',
  'fmt.days': '{n} 天',
  'fmt.sets': '{n} 組',
  'fmt.repsOfShort': '{done} / {total}',

  // ── Header / navigation ─────────────────────────────────────────────
  'nav.backHome': '回到首頁',
  'nav.subtitle': '肩關節復健教練',
  'nav.tabsAria': '主導覽列',
  'nav.dashboard': '復健總覽',
  'nav.exercises': '動作與課表',
  'nav.streakTitle': '連續訓練天數',
  'nav.streakDays': '{n} 天',
  'nav.settings': '訓練設定',
  'nav.language': '切換語言',

  // ── Language names ──────────────────────────────────────────────────
  'lang.zh': '中文',
  'lang.en': 'English',

  // ── Settings modal ──────────────────────────────────────────────────
  'settings.title': '訓練參數',
  'settings.close': '關閉',
  'settings.language': '顯示語言',
  'settings.languageHint': '介面與動作說明語言，隨時可切換',
  'settings.targetAngle': '目標抬起角度',
  'settings.targetAngleHint': '標準肩關節平舉目標為 90°',
  'settings.holdDuration': '頂點停頓時間',
  'settings.holdValue': '{n} 秒',
  'settings.holdHint': '處方一般為 3 至 5 秒穩定停頓',
  'settings.reps': '每組次數',
  'settings.repsValue': '{n} 次',
  'settings.repsHint': '依照醫師或治療師的處方設定',
  'settings.sound': '提示音',
  'settings.soundHint': '到位與完成時播放提示音',
  'settings.cancel': '取消',
  'settings.save': '儲存',

  // ── Spec pills (shared) ─────────────────────────────────────────────
  'spec.targetAngle': '目標角度',
  'spec.topHold': '頂點停頓',
  'spec.riseFall': '上升 / 下放',
  'spec.prescribedReps': '處方次數',
  'spec.secondsValue': '{n} 秒',

  // ── Exercise card / reminders (shared) ──────────────────────────────
  'card.todayPrescription': '今日處方',
  'card.start': '開始訓練',
  'card.remindersTitle': '💡 訓練提醒與動作要點',
  'card.tipsSafetyTitle': '💡 動作要點與安全防護',
  'card.tempoReminder':
    '節奏控制：嚴格維持 5 秒平穩舉起、5 秒頂點穩定停頓、5 秒緩慢下放，每完成 1 次自動休息 3 秒。',
  'card.safetyReminder':
    '安全防護：若在抬起過程感到肩膀關節劇痛或明顯不適，請立即停止下放，切勿勉強。',
  'card.diagramAlt': '{name} 復健動作分解圖',

  // ── Posture labels ──────────────────────────────────────────────────
  'posture.standingShort': '站姿',
  'posture.seatedShort': '坐姿桌前',
  'posture.standingFull': '站姿全身',
  'posture.seatedDesk': '坐姿桌前',

  // ── Dashboard ───────────────────────────────────────────────────────
  'dash.heroTitle': '肩關節復健總覽',
  'dash.heroSub':
    '即時追蹤抬起角度與動作節奏，在家或辦公桌前完成處方復健。影像全程留在這台裝置上。',
  'dash.todayRecommend': '今日處方推薦',
  'dash.comboTitle': '肩胛綜合穩定強化課表（站姿 ＋ 坐姿）',
  'dash.comboDesc': '標準 90° 平舉 · 5s-5s-5s 節奏 · 2 站連續訓練 · 預估約 8 分鐘',
  'dash.exploreLibraryAria': '查看動作庫與課表',
  'dash.exploreLibrary': '探索動作庫 ▾',
  'dash.quickStart': '快速開始訓練',
  'dash.recordsTag': '病歷與復健歷程',
  'dash.recordsTitleFiltered': '{date} 訓練紀錄',
  'dash.recordsTitle': '近期訓練紀錄',
  'dash.recordsHint': '點擊任一紀錄可查看各次動作細節與角度分析（可供主治醫師評估參考）',
  'dash.showAll': '顯示全部紀錄',
  'dash.emptyFilteredTitle': '{date} 沒有訓練紀錄',
  'dash.emptyTitle': '還沒有紀錄',
  'dash.emptyFilteredBody': '當日為肌腱修復休息日，或尚未進行訓練。',
  'dash.emptyBody': '完成第一組之後，每次的達標次數、停頓時間與動作細節都會列在這裡。',
  'dash.viewDetail': '查看細節 ›',
  'dash.repsUnit': '{done} / {total} 次',

  // Table column headers (dashboard history)
  'col.time': '訓練時間',
  'col.movement': '動作',
  'col.completedReps': '完成次數',
  'col.avgHold': '平均停頓',
  'col.onTarget': '達標次數',
  'col.report': '詳細報告',

  // ── Live training surface ───────────────────────────────────────────
  'phase.resting': '準備開始',
  'phase.ascending': '向上平舉',
  'phase.holding': '維持停頓',
  'phase.descending': '控制下放',
  'train.loading': '載入中',
  'gauge.holdHere': '很好，停在這裡',
  'camera.errorTitle': '相機權限未開啟',
  'camera.errorPermission': '請在瀏覽器網址列允許相機存取權限',
  'train.step1': '以 {cadence} 秒緩慢平舉至 {angle}°',
  'train.step2': '維持停頓 {hold} 秒',
  'train.step3': '以 {cadence} 秒緩慢控制下放',
  'train.startSet': '開始這一組 · {reps} 次',
  'train.repsOf': '/ {total} 次',
  'train.restBetween': '次間休息 {s}s',
  'train.finishRecord': '結束並記錄',
  'train.back': '返回',
  'train.completeSet': '完成這一組',

  // ── Cadence pacer ───────────────────────────────────────────────────
  'pacer.secUnit': '秒',
  'pacer.restCaption': '次間休息',
  'pacer.idle': '準備完成後，將右手臂以 5 秒平緩向前平舉',
  'pacer.holdCaption': '維持水平停頓',
  'pacer.moveCaption': '{dir} · 目標 {t} 秒',
  'pacer.verdictSlower': '慢一點',
  'pacer.verdictFaster': '快一點',
  'pacer.verdictGood': '很好',

  // ── Form-alert banner (instruction, never verdict) ──────────────────
  'flag.SHOULDER_HIKE.title': '肩膀放鬆下沉',
  'flag.SHOULDER_HIKE.hint': '右肩往下沉，讓手臂自己出力',
  'flag.TORSO_LEAN.title': '軀幹保持直立',
  'flag.TORSO_LEAN.hint': '身體回到中線，不要後仰借力',
  'flag.ELBOW_BENT.title': '手肘伸直',
  'flag.ELBOW_BENT.hint': '維持手臂成一直線',
  'flag.PACING_TOO_FAST.title': '放慢速度',
  'flag.PACING_TOO_FAST.hint': '配合 5 秒節奏平穩移動',
  'flag.PACING_TOO_SLOW.title': '稍微加快',
  'flag.PACING_TOO_SLOW.hint': '配合 5 秒節奏平穩移動',
  'flag.RUSHED_CONCENTRIC.title': '抬起放慢',
  'flag.RUSHED_CONCENTRIC.hint': '以 5 秒緩慢平舉',
  'flag.RUSHED_ECCENTRIC.title': '下放放慢',
  'flag.RUSHED_ECCENTRIC.hint': '以 5 秒緩慢控制放下',
  'flag.INCOMPLETE_HOLD.title': '停頓再久一點',
  'flag.INCOMPLETE_HOLD.hint': '在水平位置維持穩定',

  // ── Angle gauge (screen-reader) ─────────────────────────────────────
  'gauge.srAngle': '目前抬起角度 {n} 度，{phase}',

  // ── Session summary ─────────────────────────────────────────────────
  'summary.captionDidAny': '完成 {done} 次，其中 {clean} 次抬到目標區間（90°）並維持 5 秒節奏。',
  'summary.captionNone': '這一組沒有記錄到完整動作。休息一下，等準備好再開始。',
  'summary.completedReps': '完成次數',
  'summary.avgTopHold': '平均頂點停頓',
  'summary.peakAngle': '最高抬起角度',
  'summary.detailTitle': '單次動作細節（供臨床醫師評估）',
  'summary.printTitle': '列印或另存為 PDF',
  'summary.print': '🖨️ 列印報告',
  'summary.returnHome': '返回首頁',
  'rep.colN': '次數',
  'rep.colRiseFall': '上升 / 下放',
  'rep.colTopHold': '頂點停頓',
  'rep.colMaxAngle': '最大角度',
  'rep.colRecord': '動作紀錄',
  'rep.nth': '第 {n} 次',
  'rep.onTarget': '達標',

  // ── Exercise library ────────────────────────────────────────────────
  'lib.catAll': '全部項目',
  'lib.catRoutines': '處方課表 (含自訂)',
  'lib.catStanding': '站姿動作',
  'lib.catSeated': '坐姿桌前',
  'lib.catUpcoming': '進階規劃 (Roadmap)',
  'lib.tag': '臨床復健運動庫',
  'lib.heroTitle': '訓練動作與處方課表',
  'lib.heroSub':
    '探索適合不同復健階段的單項動作與連續課表。點擊任一項目即可查看標準分解圖與動作要點。',
  'lib.filtersAria': '動作分類篩選',
  'lib.routinesAria': '推薦處方課表',
  'lib.routinesTitle': '📑 處方連續訓練課表',
  'lib.routinesSub':
    '多站式連續訓練菜單，結合全身動力鏈與局部關節控制，含中場主動肌腱修復休息。',
  'lib.restoreDefaults': '恢復預設課表',
  'lib.restoreDefaultsTitle': '恢復被隱藏的原廠預設課表',
  'lib.createCustom': '＋ 建立醫師自訂課表',
  'lib.exercisesAria': '單項復健動作',
  'lib.upcomingTitle': '🔒 進階規劃中動作（待臨床驗證）',
  'lib.selfTitle': '🎥 自主訓練動作庫',
  'lib.upcomingSub': '依循復健運動醫學進程，陸續解鎖高角度外展、肩胛平面抬升與外旋動作。',
  'lib.selfSub': '單一關節角度與節奏自主訓練，即時偵測角度與防範代償。',

  // ── Exercise video card ─────────────────────────────────────────────
  'vcard.aria': '查看 {name} 動作詳情',
  'vcard.upcomingBadge': '規劃中',
  'vcard.todayBadge': '今日處方',
  'vcard.viewStart': '點擊查看動作分解與開始訓練 ›',
  'vcard.upcomingCue': '臨床動作規範編制中 ›',

  // ── Routine video card ──────────────────────────────────────────────
  'rcard.stations': '{n} 項連續動作',
  'rcard.durationBadge': '⏳ 約 {n} 分鐘',
  'rcard.customBadge': '醫師自訂處方',
  'rcard.presetBadge': '處方菜單',
  'rcard.customTag': '🩺 醫師客製課表',
  'rcard.presetTag': '複合式處方課表',
  'rcard.viewFlow': '點擊查看課表流程與開始訓練 ›',
  'rcard.aria': '查看 {name} 課表詳情',

  // ── Exercise detail modal ───────────────────────────────────────────
  'detail.close': '關閉詳情',
  'detail.diagramAlt': '{name} 動作分解圖示',
  'detail.executeTitle': '動作執行說明',
  'detail.framing': '鏡頭取景提醒：{hint}',
  'detail.backLibrary': '返回動作庫',
  'detail.start': '開始此動作訓練',
  'detail.upcomingDisabled': '臨床規範編制中（即將推出）',

  // ── Exercise picker modal ───────────────────────────────────────────
  'picker.tag': '處方動作庫',
  'picker.title': '選擇復健訓練動作',
  'picker.close': '關閉選單',
  'picker.postureAria': '選擇姿勢模式',
  'picker.back': '返回首頁',
  'picker.startNamed': '開始 {name}',

  // ── Exercise launcher card ──────────────────────────────────────────
  'launcher.aria': '今日復健處方訓練',
  'launcher.tag': '今日處方訓練',
  'launcher.title': '肩關節角度與節奏自主訓練',
  'launcher.desc': '嚴格維持 5 秒平穩抬升、5 秒頂點等長停頓、5 秒控制下放。即時偵測角度與防範聳肩代償。',
  'launcher.specTargetAngle': '目標角度',
  'launcher.specTopHold': '頂點停頓',
  'launcher.specTempo': '升降節奏',
  'launcher.specSets': '處方組次',
  'launcher.pickerAria': '更換訓練動作與查看分解圖',
  'launcher.pickerBtn': '更換動作 / 查看要點 ▾',

  // ── Routine detail modal ────────────────────────────────────────────
  'rdetail.customLabel': '🩺 醫師客製處方課表',
  'rdetail.compoundLabel': '複合處方課表',
  'rdetail.minutes': '{n} 分鐘',
  'rdetail.close': '關閉詳情',
  'rdetail.focus': '🎯 訓練焦點：',
  'rdetail.flowTitle': '課表流程與動作站點',
  'rdetail.repsTag': '{n} 次處方',
  'rdetail.rest': '中場主動肌腱修復休息：{s} 秒（預防旋轉肌群疲勞）',
  'rdetail.clinicalTitle': '🩺 臨床處方建議',
  'rdetail.clinicalBody':
    '本課表依循先站姿整體動態穩定、後坐姿局部隔離之運動醫學原則。每站動作皆具備即時角度與代償監測。',
  'rdetail.delete': '🗑️ 刪除課表',
  'rdetail.edit': '✏️ 編輯課表',
  'rdetail.startAll': '開始整組課表訓練',
  'rdetail.confirmDelete': '確定要刪除「{name}」這組處方課表嗎？',

  // ── Custom routine builder modal ────────────────────────────────────
  'builder.presetScapular': '肩胛複合',
  'builder.presetStanding': '站姿前舉',
  'builder.presetSeated': '坐姿桌前',
  'builder.presetDesk': '辦公舒緩',
  'builder.presetAbduction': '側向外展',
  'builder.defaultName': '醫師處方客製復健課表',
  'builder.defaultSubtitle': '主治醫師指定個別化居家處方',
  'builder.defaultDesc': '依據臨床醫師指示配置之動作組合與處方次數，落實每日居家肩關節復健。',
  'builder.defaultSubtitleFallback': '主治醫師指定居家處方',
  'builder.defaultDescFallback': '依據醫師指示配置之個別化復健課表。',
  'builder.defaultFocus': '醫師個別化處方 · 肩關節活動度與穩定',
  'builder.editTag': '編輯處方課表',
  'builder.createTag': '客製化處方建立器',
  'builder.editTitle': '編輯「{name}」',
  'builder.createTitle': '建立醫師自訂處方課表',
  'builder.sub': '輸入主治醫師或物理治療師交代之動作組合、次數、休息間隔與專屬封面縮圖。',
  'builder.close': '關閉建立器',
  'builder.coverAlt': '課表封面預覽',
  'builder.coverBadge': '16:9 封面預覽',
  'builder.thumbTitle': '🖼️ 課表縮圖封面',
  'builder.thumbDesc': '可上傳門診醫囑照片、個人訓練照，或從下方預設縮圖快速選擇：',
  'builder.uploadCover': '📁 上傳自訂封面照片',
  'builder.nameLabel': '課表名稱',
  'builder.namePlaceholder': '例如：陳醫師指定每日肩胛強化課表',
  'builder.subtitleLabel': '副標題 / 訓練焦點',
  'builder.subtitlePlaceholder': '例如：早晚各一組 · 強化前三角肌',
  'builder.descLabel': '醫師叮嚀與備註說明',
  'builder.descPlaceholder': '例如：動作過程專注沉肩，若有劇烈刺痛即刻停止...',
  'builder.stationsTitle': '動作站點清單（共 {count} 項 · 預估約 {min} 分鐘）',
  'builder.stationsSub': '系統將在訓練中自動依序引導，並於站點之間啟動中場休息計時。',
  'builder.addStation': '＋ 新增動作站點',
  'builder.stationN': '第 {n} 站',
  'builder.removeStation': '移除站點',
  'builder.stationExercise': '執行動作',
  'builder.stationExerciseOpt': '{name}（{posture}）',
  'builder.stationReps': '處方次數',
  'builder.repsOpt': '{n} 次',
  'builder.stationRest': '完畢後中場休息',
  'builder.restNone': '無休息（直接進入）',
  'builder.rest30': '30 秒肌腱修復',
  'builder.rest60': '60 秒標準休息',
  'builder.rest90': '90 秒充分緩和',
  'builder.cancel': '取消',
  'builder.saveEdit': '儲存修改',
  'builder.saveNew': '儲存自訂處方課表',

  // ── Recent stats grid ───────────────────────────────────────────────
  'stats.aria': '近期復健成效數據',
  'stats.tag': '臨床生物力學指標',
  'stats.title': '近期訓練品質與活動度分析',
  'stats.rangeAria': '分析時間範圍',
  'stats.last7': '近 7 天',
  'stats.last30': '近 30 天',
  'stats.volumePeriod': '近 {n} 天累計',
  'stats.volumeUnit': '次',
  'stats.volumeLabel': '累計訓練動作次數',
  'stats.setsSub': '{n} 組處方',
  'stats.activeDays': '活躍 {n} 天',
  'stats.angleTarget': '目標 90° 水平',
  'stats.angleLabel': '平均最高抬起角度',
  'stats.angleInTarget': '🎯 落在處方目標區間',
  'stats.angleStable': '動作控制穩定',
  'stats.noRecent': '尚無近期紀錄',
  'stats.holdTarget': '處方 5.0 秒',
  'stats.holdUnit': '秒',
  'stats.holdLabel': '平均頂點等長停頓',
  'stats.holdGood': '等長肌耐力良好',
  'stats.holdMaintain': '維持滿 5 秒穩定',
  'stats.formTarget': '無代償動作',
  'stats.formLabel': '動作標準率',
  'stats.formSub': '{clean} / {total} 次達標無代償',

  // ── Activity calendar ───────────────────────────────────────────────
  'cal.aria': '訓練與修復月曆',
  'cal.tag': '訓練與肌腱修復日誌',
  'cal.prevMonth': '上一個月',
  'cal.today': '今天',
  'cal.nextMonth': '下一個月',
  'cal.streak': '連續訓練',
  'cal.trainDays': '訓練天數',
  'cal.cumReps': '累計動作',
  'cal.recovery': '肌腱修復',
  'cal.todayBadge': '今',
  'cal.dayReps': '{n}次',
  'cal.restLabel': '修復',
  'cal.restTitle': '肌腱修復日',
  'cal.legendDone': '完成訓練',
  'cal.legendRest': '肌腱修復日',
  'cal.legendToday': '今日',
  'cal.clearFilter': '✕ 清除篩選 ({date})',
  'cal.unitDays': '天',
  'cal.unitReps': '次',

  // ── Recovery roadmap ────────────────────────────────────────────────
  'road.aria': '肩關節復健進程地圖',
  'road.tag': '臨床復健進程地圖',
  'road.title': '四階段肩關節功能重塑',
  'road.stepperAria': '復健階段導覽',
  'road.phase2Rate': '第 2 階段達成率',
  'road.stepDone': '已完成',
  'road.stepCurrent': '進行中',
  'road.statusDone': '已達成',
  'road.statusCurrent': '目前',
  'road.detailCurrent': '📍 目前訓練階段',
  'road.detailDone': '✓ 已達成階段',
  'road.detailLocked': '🔒 後續解鎖階段',
  'road.detailTitle': '第 {n} 階段：{name}',
  'road.targetRom': '目標活動度：',
  'road.metricSets': '本階段處方完成度',
  'road.metricSetsVal': '/ {total} 組',
  'road.metricClean': '動作標準率 (無聳肩)',
  'road.metricAngle': '平均抬起高度',
  'road.progressLabel': '第 2 階段處方目標 (20 組)',
  'road.clinicalLabel': '臨床評估準則：',
} as const

export type StringKey = keyof typeof zh

const en: Record<StringKey, string> = {
  // ── Units / formatting ──────────────────────────────────────────────
  'fmt.reps': '{n} reps',
  'fmt.seconds': '{n} s',
  'fmt.days': '{n} days',
  'fmt.sets': '{n} sets',
  'fmt.repsOfShort': '{done} / {total}',

  // ── Header / navigation ─────────────────────────────────────────────
  'nav.backHome': 'Back to home',
  'nav.subtitle': 'Shoulder Rehabilitation Coach',
  'nav.tabsAria': 'Primary navigation',
  'nav.dashboard': 'Overview',
  'nav.exercises': 'Exercises & Menus',
  'nav.streakTitle': 'Consecutive training days',
  'nav.streakDays': '{n} d',
  'nav.settings': 'Training settings',
  'nav.language': 'Switch language',

  // ── Language names ──────────────────────────────────────────────────
  'lang.zh': '中文',
  'lang.en': 'English',

  // ── Settings modal ──────────────────────────────────────────────────
  'settings.title': 'Training Parameters',
  'settings.close': 'Close',
  'settings.language': 'Display language',
  'settings.languageHint': 'Language for the interface and movement guidance — switch anytime',
  'settings.targetAngle': 'Target elevation angle',
  'settings.targetAngleHint': 'The standard shoulder elevation target is 90°.',
  'settings.holdDuration': 'Top hold duration',
  'settings.holdValue': '{n} s',
  'settings.holdHint': 'A prescription is typically a steady 3–5 second hold.',
  'settings.reps': 'Reps per set',
  'settings.repsValue': '{n} reps',
  'settings.repsHint': "Set according to your physician's or therapist's prescription.",
  'settings.sound': 'Cue sound',
  'settings.soundHint': 'Play a cue on reaching position and on completion.',
  'settings.cancel': 'Cancel',
  'settings.save': 'Save',

  // ── Spec pills (shared) ─────────────────────────────────────────────
  'spec.targetAngle': 'Target angle',
  'spec.topHold': 'Top hold',
  'spec.riseFall': 'Up / down',
  'spec.prescribedReps': 'Prescribed reps',
  'spec.secondsValue': '{n} s',

  // ── Exercise card / reminders (shared) ──────────────────────────────
  'card.todayPrescription': "Today's prescription",
  'card.start': 'Start training',
  'card.remindersTitle': '💡 Training reminders & key points',
  'card.tipsSafetyTitle': '💡 Key points & safety',
  'card.tempoReminder':
    'Tempo: hold to a steady 5 seconds up, a 5-second hold at the top, and 5 seconds down, with an automatic 3-second rest after each rep.',
  'card.safetyReminder':
    'Safety: if the shoulder joint becomes sharply painful or clearly uncomfortable while raising, lower the arm and stop — do not push through.',
  'card.diagramAlt': '{name} movement breakdown diagram',

  // ── Posture labels ──────────────────────────────────────────────────
  'posture.standingShort': 'Standing',
  'posture.seatedShort': 'Seated (desk)',
  'posture.standingFull': 'Standing (full body)',
  'posture.seatedDesk': 'Seated (desk)',

  // ── Dashboard ───────────────────────────────────────────────────────
  'dash.heroTitle': 'Shoulder Rehabilitation Overview',
  'dash.heroSub':
    'Track elevation angle and movement tempo in real time, and complete your prescribed rehabilitation at home or at your desk. Video stays on this device throughout.',
  'dash.todayRecommend': "Today's recommended prescription",
  'dash.comboTitle': 'Scapular Stability Menu (Standing + Seated)',
  'dash.comboDesc': 'Standard 90° raise · 5s-5s-5s tempo · 2-station sequence · about 8 minutes',
  'dash.exploreLibraryAria': 'View exercise library and menus',
  'dash.exploreLibrary': 'Explore library ▾',
  'dash.quickStart': 'Quick start',
  'dash.recordsTag': 'Records & rehabilitation history',
  'dash.recordsTitleFiltered': '{date} training records',
  'dash.recordsTitle': 'Recent training records',
  'dash.recordsHint':
    "Select any record to see per-rep detail and angle analysis (suitable for your physician's review).",
  'dash.showAll': 'Show all records',
  'dash.emptyFilteredTitle': 'No training records for {date}',
  'dash.emptyTitle': 'No records yet',
  'dash.emptyFilteredBody': 'That day was a tendon-recovery rest day, or no training was recorded.',
  'dash.emptyBody':
    "After your first set, each session's on-target reps, hold times, and movement detail will appear here.",
  'dash.viewDetail': 'View detail ›',
  'dash.repsUnit': '{done} / {total} reps',

  // Table column headers (dashboard history)
  'col.time': 'Time',
  'col.movement': 'Movement',
  'col.completedReps': 'Completed',
  'col.avgHold': 'Avg. hold',
  'col.onTarget': 'On target',
  'col.report': 'Report',

  // ── Live training surface ───────────────────────────────────────────
  'phase.resting': 'Get ready',
  'phase.ascending': 'Raise up',
  'phase.holding': 'Hold',
  'phase.descending': 'Lower down',
  'train.loading': 'Loading',
  'gauge.holdHere': 'Good — hold here',
  'camera.errorTitle': 'Camera access is off',
  'camera.errorPermission': "Allow camera access from the browser's address bar.",
  'train.step1': 'Raise slowly to {angle}° over {cadence} seconds',
  'train.step2': 'Hold for {hold} seconds',
  'train.step3': 'Lower under control over {cadence} seconds',
  'train.startSet': 'Start this set · {reps} reps',
  'train.repsOf': '/ {total} reps',
  'train.restBetween': 'Rest {s}s',
  'train.finishRecord': 'End & record',
  'train.back': 'Back',
  'train.completeSet': 'Complete set',

  // ── Cadence pacer ───────────────────────────────────────────────────
  'pacer.secUnit': 's',
  'pacer.restCaption': 'Rest between reps',
  'pacer.idle': 'When ready, raise the right arm forward over a steady 5 seconds.',
  'pacer.holdCaption': 'Hold at horizontal',
  'pacer.moveCaption': '{dir} · target {t} s',
  'pacer.verdictSlower': 'Slower',
  'pacer.verdictFaster': 'Faster',
  'pacer.verdictGood': 'Good',

  // ── Form-alert banner (instruction, never verdict) ──────────────────
  'flag.SHOULDER_HIKE.title': 'Relax the shoulder down',
  'flag.SHOULDER_HIKE.hint': 'Let the right shoulder drop and let the arm do the work',
  'flag.TORSO_LEAN.title': 'Keep the torso upright',
  'flag.TORSO_LEAN.hint': "Return to center; don't lean back for leverage",
  'flag.ELBOW_BENT.title': 'Straighten the elbow',
  'flag.ELBOW_BENT.hint': 'Keep the arm in a straight line',
  'flag.PACING_TOO_FAST.title': 'Slow down',
  'flag.PACING_TOO_FAST.hint': 'Move steadily on the 5-second tempo',
  'flag.PACING_TOO_SLOW.title': 'A little faster',
  'flag.PACING_TOO_SLOW.hint': 'Move steadily on the 5-second tempo',
  'flag.RUSHED_CONCENTRIC.title': 'Raise more slowly',
  'flag.RUSHED_CONCENTRIC.hint': 'Raise over a slow 5 seconds',
  'flag.RUSHED_ECCENTRIC.title': 'Lower more slowly',
  'flag.RUSHED_ECCENTRIC.hint': 'Lower under control over 5 seconds',
  'flag.INCOMPLETE_HOLD.title': 'Hold a little longer',
  'flag.INCOMPLETE_HOLD.hint': 'Stay steady at horizontal',

  // ── Angle gauge (screen-reader) ─────────────────────────────────────
  'gauge.srAngle': 'Current elevation {n} degrees, {phase}',

  // ── Session summary ─────────────────────────────────────────────────
  'summary.captionDidAny':
    'Completed {done} reps; {clean} of them reached the target range (90°) and held the 5-second tempo.',
  'summary.captionNone':
    'No complete movement was recorded for this set. Take a rest and begin again when ready.',
  'summary.completedReps': 'Completed',
  'summary.avgTopHold': 'Avg. top hold',
  'summary.peakAngle': 'Peak elevation',
  'summary.detailTitle': 'Per-rep detail (for clinical review)',
  'summary.printTitle': 'Print or save as PDF',
  'summary.print': '🖨️ Print report',
  'summary.returnHome': 'Return home',
  'rep.colN': 'Rep',
  'rep.colRiseFall': 'Up / down',
  'rep.colTopHold': 'Top hold',
  'rep.colMaxAngle': 'Max angle',
  'rep.colRecord': 'Record',
  'rep.nth': 'Rep {n}',
  'rep.onTarget': 'On target',

  // ── Exercise library ────────────────────────────────────────────────
  'lib.catAll': 'All',
  'lib.catRoutines': 'Menus (incl. custom)',
  'lib.catStanding': 'Standing',
  'lib.catSeated': 'Seated (desk)',
  'lib.catUpcoming': 'Roadmap (planned)',
  'lib.tag': 'Clinical rehabilitation library',
  'lib.heroTitle': 'Exercises & Prescription Menus',
  'lib.heroSub':
    'Browse individual movements and sequenced menus for each stage of recovery. Select any item to see its breakdown diagram and key points.',
  'lib.filtersAria': 'Exercise category filter',
  'lib.routinesAria': 'Recommended menus',
  'lib.routinesTitle': '📑 Prescription sequence menus',
  'lib.routinesSub':
    'Multi-station sequences that combine whole-body kinetic-chain work with local joint control, including mid-menu active tendon-recovery rests.',
  'lib.restoreDefaults': 'Restore default menus',
  'lib.restoreDefaultsTitle': 'Restore hidden default menus',
  'lib.createCustom': '＋ Create custom menu',
  'lib.exercisesAria': 'Individual movements',
  'lib.upcomingTitle': '🔒 Planned movements (pending clinical validation)',
  'lib.selfTitle': '🎥 Self-training library',
  'lib.upcomingSub':
    'Following rehabilitation-medicine progression, higher-angle abduction, scaption, and external rotation unlock over time.',
  'lib.selfSub':
    'Self-guided single-joint angle and tempo training, with real-time angle detection and compensation guarding.',

  // ── Exercise video card ─────────────────────────────────────────────
  'vcard.aria': 'View {name} movement detail',
  'vcard.upcomingBadge': 'Planned',
  'vcard.todayBadge': "Today's Rx",
  'vcard.viewStart': 'View breakdown and start ›',
  'vcard.upcomingCue': 'Clinical protocol in preparation ›',

  // ── Routine video card ──────────────────────────────────────────────
  'rcard.stations': '{n} movements in sequence',
  'rcard.durationBadge': '⏳ about {n} min',
  'rcard.customBadge': 'Custom prescription',
  'rcard.presetBadge': 'Prescription menu',
  'rcard.customTag': '🩺 Custom menu',
  'rcard.presetTag': 'Compound prescription menu',
  'rcard.viewFlow': 'View menu flow and start ›',
  'rcard.aria': 'View {name} menu detail',

  // ── Exercise detail modal ───────────────────────────────────────────
  'detail.close': 'Close detail',
  'detail.diagramAlt': '{name} movement breakdown',
  'detail.executeTitle': 'How to perform',
  'detail.framing': 'Camera framing: {hint}',
  'detail.backLibrary': 'Back to library',
  'detail.start': 'Start this movement',
  'detail.upcomingDisabled': 'Clinical protocol in preparation (coming soon)',

  // ── Exercise picker modal ───────────────────────────────────────────
  'picker.tag': 'Prescription library',
  'picker.title': 'Choose a movement',
  'picker.close': 'Close menu',
  'picker.postureAria': 'Choose posture mode',
  'picker.back': 'Return home',
  'picker.startNamed': 'Start {name}',

  // ── Exercise launcher card ──────────────────────────────────────────
  'launcher.aria': "Today's prescribed training",
  'launcher.tag': "Today's prescribed training",
  'launcher.title': 'Self-guided shoulder angle & tempo training',
  'launcher.desc':
    'Hold to a steady 5 seconds up, a 5-second isometric hold at the top, and 5 seconds down. Real-time angle detection and shrug-compensation guarding.',
  'launcher.specTargetAngle': 'Target angle',
  'launcher.specTopHold': 'Top hold',
  'launcher.specTempo': 'Up/down tempo',
  'launcher.specSets': 'Prescribed reps',
  'launcher.pickerAria': 'Change movement and view breakdown',
  'launcher.pickerBtn': 'Change movement / view points ▾',

  // ── Routine detail modal ────────────────────────────────────────────
  'rdetail.customLabel': '🩺 Custom prescription menu',
  'rdetail.compoundLabel': 'Compound prescription menu',
  'rdetail.minutes': '{n} min',
  'rdetail.close': 'Close detail',
  'rdetail.focus': '🎯 Focus: ',
  'rdetail.flowTitle': 'Menu flow & stations',
  'rdetail.repsTag': '{n} reps',
  'rdetail.rest': 'Active tendon-recovery rest: {s} seconds (prevents rotator-cuff fatigue)',
  'rdetail.clinicalTitle': '🩺 Clinical guidance',
  'rdetail.clinicalBody':
    'This menu follows the principle of whole-body dynamic stability standing first, then local isolation seated. Every station carries real-time angle and compensation monitoring.',
  'rdetail.delete': '🗑️ Delete menu',
  'rdetail.edit': '✏️ Edit menu',
  'rdetail.startAll': 'Start full menu',
  'rdetail.confirmDelete': 'Delete the menu “{name}”?',

  // ── Custom routine builder modal ────────────────────────────────────
  'builder.presetScapular': 'Scapular',
  'builder.presetStanding': 'Standing raise',
  'builder.presetSeated': 'Seated desk',
  'builder.presetDesk': 'Desk relief',
  'builder.presetAbduction': 'Abduction',
  'builder.defaultName': 'Custom prescription menu',
  'builder.defaultSubtitle': 'Individualized home prescription from your physician',
  'builder.defaultDesc':
    'A movement combination and rep prescription arranged on clinical instruction, for daily home shoulder rehabilitation.',
  'builder.defaultSubtitleFallback': 'Physician-specified home prescription',
  'builder.defaultDescFallback': 'An individualized menu arranged on physician instruction.',
  'builder.defaultFocus': 'Individualized prescription · shoulder mobility & stability',
  'builder.editTag': 'Edit menu',
  'builder.createTag': 'Custom menu builder',
  'builder.editTitle': 'Edit “{name}”',
  'builder.createTitle': 'Create custom prescription menu',
  'builder.sub':
    'Enter the movement combination, reps, rest intervals, and cover image your physician or therapist specified.',
  'builder.close': 'Close builder',
  'builder.coverAlt': 'Menu cover preview',
  'builder.coverBadge': '16:9 cover preview',
  'builder.thumbTitle': '🖼️ Menu cover image',
  'builder.thumbDesc':
    'Upload a photo of your clinic instructions or your own training, or pick a preset below:',
  'builder.uploadCover': '📁 Upload cover photo',
  'builder.nameLabel': 'Menu name',
  'builder.namePlaceholder': "e.g. Dr. Chen's daily scapular menu",
  'builder.subtitleLabel': 'Subtitle / focus',
  'builder.subtitlePlaceholder': 'e.g. One set morning and evening · anterior deltoid',
  'builder.descLabel': 'Physician notes & remarks',
  'builder.descPlaceholder':
    'e.g. Keep the shoulder settled throughout; stop immediately if there is sharp pain…',
  'builder.stationsTitle': 'Stations ({count} · about {min} min)',
  'builder.stationsSub':
    'Training guides through the stations in order and runs a rest timer between them.',
  'builder.addStation': '＋ Add station',
  'builder.stationN': 'Station {n}',
  'builder.removeStation': 'Remove',
  'builder.stationExercise': 'Movement',
  'builder.stationExerciseOpt': '{name} ({posture})',
  'builder.stationReps': 'Prescribed reps',
  'builder.repsOpt': '{n} reps',
  'builder.stationRest': 'Rest after',
  'builder.restNone': 'No rest (continue)',
  'builder.rest30': '30 s tendon recovery',
  'builder.rest60': '60 s standard rest',
  'builder.rest90': '90 s full recovery',
  'builder.cancel': 'Cancel',
  'builder.saveEdit': 'Save changes',
  'builder.saveNew': 'Save custom menu',

  // ── Recent stats grid ───────────────────────────────────────────────
  'stats.aria': 'Recent rehabilitation metrics',
  'stats.tag': 'Clinical biomechanical metrics',
  'stats.title': 'Recent movement quality & mobility',
  'stats.rangeAria': 'Analysis time range',
  'stats.last7': 'Last 7 days',
  'stats.last30': 'Last 30 days',
  'stats.volumePeriod': '{n}-day total',
  'stats.volumeUnit': 'reps',
  'stats.volumeLabel': 'Total movement reps',
  'stats.setsSub': '{n} sets',
  'stats.activeDays': '{n} active days',
  'stats.angleTarget': 'Target 90° horizontal',
  'stats.angleLabel': 'Avg. peak elevation',
  'stats.angleInTarget': '🎯 Within target range',
  'stats.angleStable': 'Movement control steady',
  'stats.noRecent': 'No recent records',
  'stats.holdTarget': 'Prescribed 5.0 s',
  'stats.holdUnit': 's',
  'stats.holdLabel': 'Avg. isometric top hold',
  'stats.holdGood': 'Isometric endurance is solid',
  'stats.holdMaintain': 'Hold a steady full 5 s',
  'stats.formTarget': 'Compensation-free',
  'stats.formLabel': 'Clean-movement rate',
  'stats.formSub': '{clean} / {total} reps clean, no compensation',

  // ── Activity calendar ───────────────────────────────────────────────
  'cal.aria': 'Training & recovery calendar',
  'cal.tag': 'Training & tendon-recovery log',
  'cal.prevMonth': 'Previous month',
  'cal.today': 'Today',
  'cal.nextMonth': 'Next month',
  'cal.streak': 'Streak',
  'cal.trainDays': 'Training days',
  'cal.cumReps': 'Total reps',
  'cal.recovery': 'Recovery',
  'cal.todayBadge': 'Now',
  'cal.dayReps': '{n} reps',
  'cal.restLabel': 'Rest',
  'cal.restTitle': 'Tendon-recovery day',
  'cal.legendDone': 'Trained',
  'cal.legendRest': 'Recovery day',
  'cal.legendToday': 'Today',
  'cal.clearFilter': '✕ Clear filter ({date})',
  'cal.unitDays': 'days',
  'cal.unitReps': 'reps',

  // ── Recovery roadmap ────────────────────────────────────────────────
  'road.aria': 'Shoulder rehabilitation roadmap',
  'road.tag': 'Clinical rehabilitation roadmap',
  'road.title': 'Four-Stage Shoulder Function Rebuild',
  'road.stepperAria': 'Recovery stage navigation',
  'road.phase2Rate': 'Stage 2 completion',
  'road.stepDone': 'Completed',
  'road.stepCurrent': 'In progress',
  'road.statusDone': 'Achieved',
  'road.statusCurrent': 'Current',
  'road.detailCurrent': '📍 Current stage',
  'road.detailDone': '✓ Achieved stage',
  'road.detailLocked': '🔒 Upcoming stage',
  'road.detailTitle': 'Stage {n}: {name}',
  'road.targetRom': 'Target ROM: ',
  'road.metricSets': 'Prescriptions completed this stage',
  'road.metricSetsVal': '/ {total} sets',
  'road.metricClean': 'Clean-movement rate (no shrug)',
  'road.metricAngle': 'Avg. elevation',
  'road.progressLabel': 'Stage 2 target (20 sets)',
  'road.clinicalLabel': 'Clinical criteria: ',
}

export const UI_STRINGS: Record<Locale, Record<StringKey, string>> = { zh, en }

export type TVars = Record<string, string | number>

/** Look up `key` for `locale` and substitute any `{token}` placeholders. */
export function translate(locale: Locale, key: StringKey, vars?: TVars): string {
  let out: string = UI_STRINGS[locale][key] ?? zh[key]
  if (vars) {
    for (const name in vars) {
      out = out.split(`{${name}}`).join(String(vars[name]))
    }
  }
  return out
}
