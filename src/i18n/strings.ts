/* ─────────────────────────────────────────────────────────────────────────────
   Strings. Every user-visible character in the product lives here.

   INVARIANT 5 — zh-TW is the interface. This build ships zh-TW only, a dated
   exception recorded in the design doc's Scope Exceptions; English completes
   before any second site. The `Strings` type is the contract an English locale
   must satisfy, so adding it later is an implementation, not a refactor.

   TONE (PRODUCT.md) — dignified. No cheerfulness, no encouragement, no
   exclamation marks. A finished trial reads 完成. Never 停止, never 加油,
   never 太棒了. Someone who manages three reps has a valid recorded outcome and
   the copy must not suggest they broke something.
   ───────────────────────────────────────────────────────────────────────────── */

export interface Strings {
  readonly app: {
    readonly name: string
    readonly assessmentName: string
    readonly logoProvisional: string
  }
  readonly demo: {
    readonly badge: string
    readonly detail: string
  }
  readonly phase: {
    readonly pre: string
    readonly post: string
  }
  readonly tracking: {
    readonly live: string
    readonly idle: string
    readonly lost: string
  }
  readonly roster: {
    readonly title: string
    readonly outstanding: string
    readonly done: string
    readonly progress: (done: number, total: number) => string
    readonly attendanceNote: (n: number) => string
    readonly start: string
    readonly review: string
    readonly openSheet: string
    readonly emptyTitle: string
    readonly emptyBody: string
  }
  readonly status: {
    readonly awaiting: string
    readonly complete: string
    readonly incomplete: string
    readonly handContact: string
    readonly unable: string
    readonly aborted: string
    readonly voided: string
    readonly corrected: string
  }
  readonly trial: {
    readonly repsOf: (done: number, total: number) => string
    readonly repsLabel: string
    readonly cue: string
    readonly cueHint: string
    readonly begin: string
    readonly end: string
    readonly discard: string
    readonly complete: string
    readonly viewResult: string
    readonly voidTitle: string
    readonly voidBody: string
    readonly restart: string
    readonly backToRoster: string
    readonly srRepAnnounce: (n: number, total: number) => string
  }
  readonly nav: {
    readonly switchToPre: string
    readonly switchToPost: string
    /** Landmark label for the back-to-hub control. */
    readonly whereLabel: string
    readonly backToRoster: string
    readonly placeRoster: string
    readonly placeTrial: (label: string) => string
    readonly placeResult: (label: string) => string
    readonly placeSheet: string
    readonly phaseLabel: string
  }
  readonly camera: {
    readonly title: string
    readonly selfView: string
    readonly selfViewHint: string
    readonly privacy: string
    readonly enable: string
    readonly disable: string
    readonly starting: string
    readonly idle: string
    readonly denied: string
    readonly notfound: string
    readonly insecure: string
    readonly unsupported: string
    readonly error: string
    readonly signalLabel: string
    readonly signalLive: string
    readonly signalStalled: string
    readonly signalEnded: string
  }
  readonly result: {
    readonly title: string
    readonly elapsed: string
    readonly seconds: string
    readonly reps: string
    readonly perRep: string
    readonly repN: (n: number) => string
    readonly noTime: string
    readonly accept: string
    readonly redo: string
    readonly correct: string
    readonly seatHeight: string
    readonly cm: string
  }
  readonly correction: {
    readonly title: string
    readonly body: string
    readonly noteLabel: string
    readonly notes: {
      readonly rep_miscount: string
      readonly wrong_participant: string
      readonly hand_contact_missed: string
      readonly other: string
    }
    readonly repsLabel: string
    readonly submit: string
    readonly cancel: string
    readonly appendNote: string
  }
  readonly abort: {
    readonly title: string
    readonly body: string
    readonly reasons: {
      readonly wrong_participant: string
      readonly interruption: string
      readonly participant_declined: string
      readonly equipment: string
      readonly other: string
    }
    readonly confirm: string
    readonly cancel: string
  }
  readonly unable: {
    readonly action: string
    readonly title: string
    readonly body: string
    readonly confirm: string
    readonly cancel: string
  }
  readonly sheet: {
    readonly title: string
    readonly subtitle: string
    readonly site: string
    readonly block: string
    readonly printedOn: string
    readonly colId: string
    readonly colLabel: string
    readonly colPre: string
    readonly colPost: string
    readonly colChange: string
    readonly colNote: string
    readonly unitSeconds: string
    readonly notRecorded: string
    readonly notComparable: string
    readonly summaryAssessed: string
    readonly summaryProtocolValid: string
    readonly summaryAttendance: string
    readonly footerScope: string
    readonly footerComparable: string
    readonly footerHandContact: string
    readonly footerPrivacy: string
    readonly signFacilitator: string
    readonly signLead: string
    readonly print: string
    readonly close: string
    /** Wraps an inline aside, e.g. 已更正. Full-width parens are copy, not code. */
    readonly aside: (inner: string) => string
  }
  readonly scenario: {
    readonly title: string
    readonly hint: string
    readonly close: string
    readonly groupSurfaces: string
    readonly groupTrial: string
    readonly groupEdge: string
    readonly groupSheet: string
    readonly rosterFor: (phase: string) => string
    readonly sheetMixed: string
    readonly trials: {
      readonly complete_typical: string
      readonly complete_slow: string
      readonly incomplete_three: string
      readonly hand_contact: string
      readonly void_midway: string
    }
    readonly results: {
      readonly complete: string
      readonly incomplete: string
      readonly hand_contact: string
      readonly unable: string
      readonly aborted: string
    }
  }
}

const zhTW: Strings = {
  app: {
    name: 'VeloCare',
    assessmentName: '五次起立坐下量測',
    // Marks the logo slot as artwork-pending. Removed when a real identity lands.
    logoProvisional: '標誌暫定',
  },

  demo: {
    // Honest marker. This must never read as a working measurement system.
    //
    // Reworded when the framing preview landed. The previous copy said
    // 未連接攝影機 ("no camera is connected"), which the opt-in preview makes
    // false the moment a facilitator enables it. An honesty notice that is
    // literally untrue is worse than none, so it now separates the two claims:
    // the measurement DATA is simulated, and the camera is preview only.
    badge: '示範模式 · 模擬資料',
    detail:
      '本頁為介面原型，量測資料為模擬產生，未進行任何實際量測。鏡頭僅供取景預覽，不錄影、不儲存影像。',
  },

  phase: {
    pre: '前測',
    post: '後測',
  },

  tracking: {
    live: '追蹤中',
    idle: '待機',
    lost: '追蹤中斷',
  },

  roster: {
    title: '本期名單',
    outstanding: '待量測',
    done: '已量測',
    progress: (done, total) => `已量測 ${done} / ${total} 人`,
    attendanceNote: (n) => `本期出席 ${n} 人`,
    start: '開始量測',
    review: '查看紀錄',
    openSheet: '產生報表',
    emptyTitle: '本期尚無名單',
    emptyBody: '請先於現場紙本名冊建立代號，再於此處對應。',
  },

  status: {
    awaiting: '待量測',
    complete: '已量測',
    incomplete: '未完成五次',
    handContact: '手部支撐',
    unable: '無法進行',
    aborted: '已作廢',
    voided: '追蹤中斷',
    corrected: '已更正',
  },

  trial: {
    repsOf: (done, total) => `${done} / ${total}`,
    repsLabel: '次',
    cue: '請準備',
    cueHint: '雙手抱胸，坐穩後由工作人員開始。',
    begin: '開始',
    end: '結束',
    discard: '作廢',
    complete: '完成',
    viewResult: '查看紀錄',
    voidTitle: '追蹤中斷',
    voidBody: '本次未能完整記錄，請重新開始。先前資料不列入。',
    restart: '重新開始',
    backToRoster: '回名單',
    srRepAnnounce: (n, total) => `第 ${n} 次，共 ${total} 次`,
  },

  nav: {
    switchToPre: '切換至前測',
    switchToPost: '切換至後測',
    whereLabel: '目前位置',
    backToRoster: '回本期名單',
    placeRoster: '本期名單',
    placeTrial: (label) => `${label}．量測`,
    placeResult: (label) => `${label}．紀錄`,
    placeSheet: '報表',
    phaseLabel: '本期階段',
  },

  camera: {
    title: '鏡頭取景',
    selfView: '自己的畫面',
    selfViewHint: '請確認整個人都在框內。',
    // Stated next to the live image, not buried in a settings page. Must stay
    // literally true of the code in useCameraPreview.ts: preview only, no
    // capture, no analysis, no retention.
    privacy: '畫面僅即時顯示於本機，不錄影、不擷取、不分析、不上傳、不儲存。關閉後立即結束。',
    enable: '開啟鏡頭取景',
    disable: '關閉鏡頭',
    starting: '啟動中…',
    idle: '尚未開啟鏡頭。開啟後可在開始前確認取景範圍。',
    denied: '未取得鏡頭權限。可於瀏覽器網址列重新允許，或直接以模擬資料操作。',
    notfound: '找不到可用的鏡頭。可直接以模擬資料操作。',
    insecure: '目前連線非安全來源，瀏覽器不提供鏡頭。可直接以模擬資料操作。',
    unsupported: '此瀏覽器不支援鏡頭取景。可直接以模擬資料操作。',
    error: '無法開啟鏡頭。可直接以模擬資料操作。',
    // 訊號, not 追蹤. This build performs no pose estimation, so it reports
    // whether the camera is still delivering frames — never a tracking or
    // confidence figure it has no way to compute.
    // Worded so they cannot be mistaken for the tracking chip beside them in
    // the rail (追蹤中 / 待機 / 追蹤中斷). That one is simulated; this one is real.
    signalLabel: '鏡頭訊號',
    signalLive: '鏡頭訊號正常',
    signalStalled: '鏡頭訊號不穩',
    signalEnded: '鏡頭已關閉',
  },

  result: {
    title: '本次紀錄',
    elapsed: '總時間',
    seconds: '秒',
    reps: '完成次數',
    perRep: '各次時間',
    repN: (n) => `第 ${n} 次`,
    noTime: '未計時',
    accept: '確認並回名單',
    redo: '重新量測',
    correct: '更正紀錄',
    seatHeight: '座高',
    cm: '公分',
  },

  correction: {
    title: '更正紀錄',
    body: '原紀錄會保留，更正將另存一筆。這是正常操作。',
    noteLabel: '更正原因',
    notes: {
      rep_miscount: '次數計算有誤',
      wrong_participant: '對應代號有誤',
      hand_contact_missed: '未記錄到手部支撐',
      other: '其他',
    },
    repsLabel: '更正後完成次數',
    submit: '儲存更正',
    cancel: '取消',
    appendNote: '原紀錄仍會保留於紀錄檔中。',
  },

  abort: {
    title: '作廢本次量測',
    body: '本次不列入紀錄，並記錄作廢原因。',
    reasons: {
      wrong_participant: '對應代號有誤',
      interruption: '現場中斷',
      participant_declined: '長輩表示不進行',
      equipment: '器材問題',
      other: '其他',
    },
    confirm: '確認作廢',
    cancel: '取消',
  },

  unable: {
    action: '記錄為無法進行',
    title: '記錄為無法進行',
    body: '此為有效的紀錄結果。長輩仍在本期名單內，出席照常計算。',
    confirm: '確認記錄',
    cancel: '取消',
  },

  sheet: {
    title: '五次起立坐下量測紀錄',
    subtitle: '預防及延緩失能照護服務 — 前後測時間紀錄表',
    site: '服務提供單位',
    block: '期別',
    printedOn: '列印日期',
    colId: '代號',
    colLabel: '稱謂',
    colPre: '前測（秒）',
    colPost: '後測（秒）',
    colChange: '差值（秒）',
    colNote: '備註',
    unitSeconds: '秒',
    notRecorded: '未記錄',
    notComparable: '不可比較',
    summaryAssessed: '完成量測人數',
    summaryProtocolValid: '符合測驗規範人數',
    summaryAttendance: '本期出席人數',

    // ── Regulatory surface. Not boilerplate. ──────────────────────────────
    // Per the invariant 3 amendment: the instrument reports a measured time to
    // a human. It does not apply the 14-second threshold, does not grade, and
    // does not state a determination. Do not edit casually.
    footerScope:
      '本表僅記錄受測者完成五次起立坐下所需之時間，由現場工作人員操作器材並確認紀錄。本器材不進行判讀、不提供分級、不作成任何評估、篩檢或轉介結論。是否符合各項標準，由具資格之人員依相關規定判定。',
    // Why a difference is sometimes withheld. Without this the blank cell looks
    // like missing data rather than a deliberate refusal to compare.
    footerComparable:
      '差值僅在前後測皆符合測驗規範且完成次數相同時計算；完成次數不同者標示「不可比較」，因不同次數之時間無法直接相減。',
    footerHandContact:
      '標示「手部支撐」者，表示過程中偵測到手部支撐，未符合雙手抱胸之測驗規範，該次時間僅供現場參考。標示「無法進行」者為有效紀錄結果。',
    footerPrivacy:
      '本器材不錄影、不儲存影像。攝影機僅即時計算人體關節位置，影像不留存、不傳輸。紀錄僅含代號，不含姓名或身分資料。',

    signFacilitator: '現場工作人員簽名',
    signLead: '單位負責人簽名',
    print: '列印',
    close: '關閉',
    aside: (inner) => `（${inner}）`,
  },

  scenario: {
    title: '示範情境',
    hint: '按 S 開啟或關閉。此面板僅存在於示範版本。',
    close: '關閉',
    groupSurfaces: '主要畫面',
    groupTrial: '量測過程',
    groupEdge: '各種結果',
    groupSheet: '報表',
    rosterFor: (phase) => `名單 · ${phase}`,
    sheetMixed: '報表 · 混合結果',
    trials: {
      complete_typical: '典型完成',
      complete_slow: '較慢完成',
      incomplete_three: '只完成三次',
      hand_contact: '手部支撐',
      void_midway: '追蹤中斷後重測',
    },
    results: {
      complete: '完成五次',
      incomplete: '未完成五次',
      hand_contact: '手部支撐',
      unable: '無法進行',
      aborted: '已作廢',
    },
  },
}

export const strings: Strings = zhTW

/** Locale tag for `Intl` and the `lang` attribute. */
export const locale = 'zh-TW'
