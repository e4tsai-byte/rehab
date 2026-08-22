import type { Locale } from '../i18n/locale'

/*
 * Evidence provenance data for the in-app Evidence surface.
 *
 * This module is a READ-ONLY presentation of the clinical-evidence decision
 * record at `docs/decisions/rehabibi-clinical-evidence.md`. It holds NO
 * prescription value and drives NO kinematic logic — it only describes, per
 * claim, what the app value is, how well the literature supports it, and the
 * sources checked. The decision record is the source of truth; when it changes,
 * this file changes with it. Values live in `exerciseCatalog.ts` / CONFIG and
 * are never restated here as anything but display text.
 *
 * Tone follows invariant 1.6 (dignified, no overclaiming) and the form-coach
 * boundary (invariant 7): this surface reports evidence, it never diagnoses,
 * prescribes, or grades healing. An honest "clinical convention, uncited" is
 * preferred over a stretched citation — that honesty is the point.
 *
 * Bilingual per invariant §4: paired `*Zh` / `*En` fields, collapsed by the
 * `localizeEvidence` selector so components read plain fields and never branch
 * on locale themselves.
 */

/** The five provenance labels, from the evidence-analyst's scheme. */
export type ProvenanceLabel =
  | 'literature-supported'
  | 'literature-adjacent'
  | 'clinical-convention'
  | 'judgment-call'
  | 'placeholder'

export interface EvidenceCitation {
  /** Display label for the source, e.g. "Reinold et al. 2007 · J Athl Train". */
  source: string
  /** Absolute URL to the abstract / source text (user-initiated navigation only). */
  url: string
  populationZh: string
  populationEn: string
}

export interface EvidenceClaim {
  /** Matches the claim ID in the decision record (e.g. 'HOLD-DURATION'). */
  id: string
  titleZh: string
  titleEn: string
  /** The current app value, as display text — not a live read of CONFIG. */
  appValueZh: string
  appValueEn: string
  label: ProvenanceLabel
  /** Plain-language reading of the evidence, incl. any population mismatch. */
  summaryZh: string
  summaryEn: string
  /** Verified sources; empty for convention / judgment / placeholder claims. */
  citations: EvidenceCitation[]
}

export interface EvidenceCluster {
  id: string
  titleZh: string
  titleEn: string
  claims: EvidenceClaim[]
}

/** Locale-resolved views the surface actually renders. */
export interface LocalizedCitation {
  source: string
  url: string
  population: string
}
export interface LocalizedClaim {
  id: string
  title: string
  appValue: string
  label: ProvenanceLabel
  summary: string
  citations: LocalizedCitation[]
}
export interface LocalizedCluster {
  id: string
  title: string
  claims: LocalizedClaim[]
}

export function localizeEvidence(cluster: EvidenceCluster, locale: Locale): LocalizedCluster {
  const en = locale === 'en'
  return {
    id: cluster.id,
    title: en ? cluster.titleEn : cluster.titleZh,
    claims: cluster.claims.map((c) => ({
      id: c.id,
      title: en ? c.titleEn : c.titleZh,
      appValue: en ? c.appValueEn : c.appValueZh,
      label: c.label,
      summary: en ? c.summaryEn : c.summaryZh,
      citations: c.citations.map((cite) => ({
        source: cite.source,
        url: cite.url,
        population: en ? cite.populationEn : cite.populationZh,
      })),
    })),
  }
}

/** Provenance-label display metadata for the legend + chips. */
export interface ProvenanceLabelMeta {
  id: ProvenanceLabel
  nameZh: string
  nameEn: string
  descZh: string
  descEn: string
}

export const PROVENANCE_LABELS: readonly ProvenanceLabelMeta[] = [
  {
    id: 'literature-supported',
    nameZh: '文獻支持',
    nameEn: 'Literature-supported',
    descZh: '有經查證的文獻來源，且研究族群與本產品對象（居家肩關節術後復健）相符。',
    descEn:
      'A verified source in a population that matches this product (at-home post-operative shoulder rehabilitation).',
  },
  {
    id: 'literature-adjacent',
    nameZh: '文獻相近',
    nameEn: 'Literature-adjacent',
    descZh: '有經查證的文獻來源，但研究族群不同（如健康年輕人、肌腱病變或下肢族群）；差異已於說明中標明。',
    descEn:
      'A verified source in a different population (e.g. healthy young adults, tendinopathy, or lower-limb cohorts); the mismatch is stated in the summary.',
  },
  {
    id: 'clinical-convention',
    nameZh: '臨床慣例',
    nameEn: 'Clinical convention',
    descZh: '復健臨床上的標準做法，但沒有特定文獻可直接引用。',
    descEn: 'Standard clinical practice, with no specific citation to point to.',
  },
  {
    id: 'judgment-call',
    nameZh: '合理判斷（未驗證）',
    nameEn: 'Judgment call (unvalidated)',
    descZh: '依原理與臨床經驗推導的合理預設值，尚未以研究或實測資料驗證。',
    descEn:
      'A reasoned default from first principles and clinical experience, not yet validated against study or field data.',
  },
  {
    id: 'placeholder',
    nameZh: '暫定值（待實測）',
    nameEn: 'Placeholder (pending pilot data)',
    descZh: '目前為暫定值，需以實際影像／動作資料校正後才算確立。',
    descEn: 'A provisional value that must be tuned against real footage / movement data before it is settled.',
  },
] as const

export function localizeProvenanceLabel(id: ProvenanceLabel, locale: Locale): { name: string; desc: string } {
  const meta = PROVENANCE_LABELS.find((m) => m.id === id) ?? PROVENANCE_LABELS[2]!
  const en = locale === 'en'
  return { name: en ? meta.nameEn : meta.nameZh, desc: en ? meta.descEn : meta.descZh }
}

/*
 * The clusters. Ordered strongest-support first so the surface leads with what
 * the literature actually backs, not with the app's weakest guesses.
 */
export const EVIDENCE_CLUSTERS: readonly EvidenceCluster[] = [
  {
    id: 'side-lying-hold',
    titleZh: '側臥棘上肌等長支撐',
    titleEn: 'Side-lying supraspinatus hold',
    claims: [
      {
        id: 'HOLD-DURATION',
        titleZh: '維持時間 20 秒（進階至 30 秒）',
        titleEn: 'Hold duration — 20 s (progress to 30 s)',
        appValueZh: '20 秒；30 秒為進階目標；≥3 秒即記錄',
        appValueEn: '20 s; 30 s stretch goal; recorded at ≥3 s',
        label: 'literature-adjacent',
        summaryZh:
          '20–30 秒的低負荷等長維持，落在旋轉肌袖「肌腱病變」等長訓練文獻常用的區間內（如每組 30 餘秒、每日數次）。但那些研究對象是肌腱病變、且負荷高達最大自主收縮的 40–70%，與本產品的術後族群與極低負荷（約 12°）不同，故列為文獻相近而非文獻支持。30 秒僅為顯示用的進階目標，不構成失敗判定。',
        summaryEn:
          'A 20–30 s low-load isometric hold sits inside the range used in rotator-cuff tendinopathy isometric protocols (e.g. ~30 s holds, several times daily). But those studies are tendinopathy cohorts at 40–70% of maximal contraction — a different population and far higher load than this ~12° hold — so this is literature-adjacent, not literature-supported. The 30 s stretch goal is display-only and never a failure line.',
        citations: [
          {
            source: 'Isometric protocol for RC tendinopathy · PLOS ONE (pone.0293457)',
            url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0293457',
            populationZh: '影像確診旋轉肌袖肌腱病變成人（18–60 歲），非術後族群',
            populationEn: 'Adults 18–60 with imaging-confirmed RC tendinopathy — not post-operative',
          },
        ],
      },
      {
        id: 'HOLD-SETS-FREQ',
        titleZh: '每回合 5 次維持、每日 2 回合以上',
        titleEn: '5 holds per session, 2+ sessions per day',
        appValueZh: '5 次 / 回合；每日 ≥ 2 回合',
        appValueEn: '5 holds / session; ≥ 2 sessions / day',
        label: 'literature-adjacent',
        summaryZh:
          '「少量、多次」的低負荷活化是早期神經肌肉再教育的標準模式；肌腱病變等長訓練文獻常用約 5 次、每日 2–3 次的處方。同樣屬肌腱病變族群，故列為文獻相近。',
        summaryEn:
          'Little-and-often low-load activation is the standard pattern for early neuromuscular re-education; tendinopathy isometric guidance repeatedly uses ~5 reps, 2–3×/day. Same tendinopathy-population caveat, so literature-adjacent.',
        citations: [
          {
            source: 'Isometric protocol for RC tendinopathy · PLOS ONE (pone.0293457)',
            url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0293457',
            populationZh: '旋轉肌袖肌腱病變成人，非術後族群',
            populationEn: 'RC tendinopathy adults — not post-operative',
          },
        ],
      },
      {
        id: 'HOLD-BAND',
        titleZh: '10–15° 低角度區間與上限（超過即為代償）',
        titleEn: '10–15° band and ceiling (rising above is a fault)',
        appValueZh: '目標 12°；良好區間 10–15°；>15° 提示、持續 >18° 判定代償',
        appValueEn: 'Target 12°; good band 10–15°; >15° cue, sustained >18° invalidates',
        label: 'judgment-call',
        summaryZh:
          '「低角度時棘上肌為主、抬太高則三角肌與上斜方肌接手」的方向是合理的；但「約 15° 是接手的臨界角」這個本產品核心賴以運作的角度，目前沒有任何查證到的文獻能明確標定。已查證的肌電圖研究（Reinold 2007、Boettcher 2009，皆為健康年輕人）反而顯示：在所測試的任何姿勢下，棘上肌都無法被真正「單獨」啟動。因此此區間為合理判斷、尚待實測校正，而非文獻所定。',
        summaryEn:
          'The direction — supraspinatus leads at low angles, deltoid/upper-trapezius take over higher up — is sound. But the ~15° "takeover" angle the app is built around is pinned by no source we could verify. The EMG studies we did verify (Reinold 2007, Boettcher 2009, both healthy young adults) actually show the supraspinatus is never truly isolated at any tested position. So this band is a judgment call awaiting field data, not a literature-set number.',
        citations: [
          {
            source: 'Boettcher, Ginn & Cathers 2009 · J Sci Med Sport (MED/19054712)',
            url: 'https://europepmc.org/abstract/MED/19054712',
            populationZh: '15 名正常受試者；顯示這些姿勢無法單獨啟動棘上肌',
            populationEn: '15 normal subjects; these positions do not isolate supraspinatus',
          },
        ],
      },
      {
        id: 'HOLD-ELBOW-POSITION',
        titleZh: '側臥、上側手臂、掌心朝腿、手肘打直',
        titleEn: 'Side-lying, top arm, palm to thigh, straight elbow',
        appValueZh: '手肘 ≥160°（打直）；中立旋轉',
        appValueEn: 'Elbow ≥160° (straight); neutral rotation',
        label: 'clinical-convention',
        summaryZh:
          '側臥、上側手臂低角度外展以重力作為輕負荷，掌心朝腿（中立位）以避開夾擠姿勢——皆為標準臨床慣例。手肘打直用以固定力臂，讓 12° 對應到已知的負荷；「≥160° 才算打直」的門檻為量測預設值。若受術側為下側（左側）肩膀，側臥會壓迫該肩，應先諮詢臨床醫師。',
        summaryEn:
          'Side-lying with the top arm at a low abduction angle makes gravity a light load, and neutral rotation (palm to thigh) avoids the impingement position — all standard convention. A straight elbow fixes the moment arm so 12° means a known load; the "≥160° counts as straight" cutoff is a measurement default. If the operative shoulder is the down (left) side, lying on it compresses it — clear the position with a clinician first.',
        citations: [],
      },
    ],
  },
  {
    id: 'scaption',
    titleZh: '肩胛平面抬升（Scaption）',
    titleEn: 'Scaption (scapular-plane elevation)',
    claims: [
      {
        id: 'SCAP-THUMB',
        titleZh: '大拇指朝上（「滿罐」姿勢）以減少夾擠',
        titleEn: 'Thumb-up ("full can") to reduce impingement',
        appValueZh: '大拇指朝上（外旋位）',
        appValueEn: 'Thumb up (external rotation)',
        label: 'literature-adjacent',
        summaryZh:
          '經查證的肌電圖研究顯示「滿罐」（大拇指朝上）姿勢的三角肌活動明顯低於「空罐」（大拇指朝下），作者認為此姿勢「可能是徵召棘上肌的最佳位置」。研究對象為健康年輕人（無肩部病史），非術後族群，故列文獻相近。此提示為本產品中證據最一致的動作提示。',
        summaryEn:
          'Verified EMG shows the "full can" (thumb-up) position produces significantly less deltoid activity than the "empty can" (thumb-down), and the authors conclude it "may be the optimal position to recruit the supraspinatus." The subjects were healthy young adults with no shoulder history — not post-operative — hence literature-adjacent. This is the best-evidenced movement cue in the product.',
        citations: [
          {
            source: 'Reinold et al. 2007 · J Athl Train (PMC2140071)',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2140071/',
            populationZh: '22 名無症狀受試者，平均年齡約 27 歲，無肩部病史',
            populationEn: '22 asymptomatic subjects, mean age ~27, no shoulder pathology',
          },
        ],
      },
      {
        id: 'SCAP-PLANE',
        titleZh: '沿肩胛平面（前方約 30°）抬升',
        titleEn: 'Elevate in the scapular plane (~30° forward)',
        appValueZh: '冠狀面前方約 30°',
        appValueEn: 'About 30° forward of the coronal plane',
        label: 'literature-adjacent',
        summaryZh:
          '肩胛平面一般定義為冠狀面前方約 30–45°，於此平面抬升關節囊張力較低、盂肱關節位移較小，是較不易引發夾擠的抬升平面——因此在早期復健中通常優先於冠狀面外展。相關文獻多為無症狀或夾擠族群，非術後；「約 30°」為此區間中偏保守的慣用值。',
        summaryEn:
          'The scapular plane is conventionally ~30–45° forward of the coronal plane; elevating in it involves lower capsular tension and smaller glenohumeral excursion, making it the less impingement-provocative plane — so it is generally preferred over coronal abduction in early rehab. The literature is mostly asymptomatic or impingement cohorts, not post-op; "~30°" is a conservative convention within that 30–45° range.',
        citations: [
          {
            source: 'Scapular-plane elevation kinematics · PMC2857390',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2857390/',
            populationZh: '肩關節運動學文獻（無症狀／夾擠族群），非術後',
            populationEn: 'Shoulder kinematics literature (asymptomatic / impingement), not post-op',
          },
        ],
      },
    ],
  },
  {
    id: 'lateral-abduction',
    titleZh: '側向外展',
    titleEn: 'Lateral abduction',
    claims: [
      {
        id: 'ABD-PALM',
        titleZh: '外展時的前臂旋轉提示（現為「掌心朝下」）',
        titleEn: 'Forearm-rotation cue in abduction (currently "palm down")',
        appValueZh: '目前提示：掌心朝下或微向前',
        appValueEn: 'Current cue: palm down or slightly forward',
        label: 'literature-adjacent',
        summaryZh:
          '經查證的肌電圖證據偏好「大拇指朝上／滿罐」以減少三角肌代償。目前外展的「掌心朝下」較接近中立／輕微內旋，是較不具保護性的提示——而外展本身又是最容易誘發夾擠的平面。這與 Scaption 採用的「大拇指朝上」提示不一致，已列為公開待決問題（是否僅在刻意強調中三角肌時保留掌心朝下）。此為文字提示層面，非角度或參數變更。',
        summaryEn:
          'Verified EMG favors thumb-up / full-can to minimize deltoid substitution. The current "palm down" cue for abduction is closer to neutral/mild internal rotation — the less protective option — on the plane that is most impingement-provocative. This is inconsistent with the thumb-up cue used for scaption, and is flagged as an open question (keep palm-down only if deliberate middle-deltoid emphasis is intended). This is a wording matter, not an angle or parameter change.',
        citations: [
          {
            source: 'Reinold et al. 2007 · J Athl Train (PMC2140071)',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2140071/',
            populationZh: '22 名無症狀年輕受試者，非術後',
            populationEn: '22 asymptomatic young subjects, not post-op',
          },
        ],
      },
      {
        id: 'ABD-TARGET',
        titleZh: '90° 冠狀面外展目標',
        titleEn: '90° coronal-plane abduction target',
        appValueZh: '90°（尚在規劃中的進階動作）',
        appValueEn: '90° (a planned / upcoming exercise)',
        label: 'clinical-convention',
        summaryZh:
          '冠狀面外展徵召中三角肌與棘上肌屬教科書慣例。需注意：約 60–120° 為「疼痛弧」，棘上肌肌腱在此區間最易被夾擠——故冠狀面外展是本產品中最具誘發性的動作，此動作維持在「規劃中」並需臨床把關是恰當的。早期階段建議以 Scaption 取代或先於冠狀面外展。',
        summaryEn:
          'That coronal abduction recruits middle deltoid and supraspinatus is textbook convention. Note the ~60–120° "painful arc," where the supraspinatus tendon is most compressed — making coronal abduction the most provocative movement in the product. Keeping it gated as "upcoming" is appropriate; prefer scaption before coronal abduction in early phases.',
        citations: [],
      },
    ],
  },
  {
    id: 'forward-flexion',
    titleZh: '前舉與動作節奏',
    titleEn: 'Forward flexion & tempo',
    claims: [
      {
        id: 'FF-TARGET',
        titleZh: '90° 前舉目標',
        titleEn: '90° forward-flexion target',
        appValueZh: '90°（站姿與坐姿）',
        appValueEn: '90° (standing and seated)',
        label: 'clinical-convention',
        summaryZh:
          '90° 是常見的功能里程碑與中段力偶訓練的合理上界，屬教學慣例，未找到明確標定「90°」為特定目標的文獻。真正的重點在時機：主動抬升需待臨床醫師許可後才進行（見下方「安全把關」）。90° 應維持為臨床可調整的輸入值。',
        summaryEn:
          '90° is a common functional milestone and a reasonable ceiling for mid-range force-couple work — taught convention, with no source pinning "90°" as a specific target. The real point is timing: active elevation should wait until a clinician has cleared it (see "Safety gate" below). 90° should stay a clinician-tunable input.',
        citations: [],
      },
      {
        id: 'FF-TEMPO',
        titleZh: '5-5-5 節奏（5 秒上舉 / 5 秒停頓 / 5 秒下放）',
        titleEn: '5-5-5 tempo (5 s up / 5 s hold / 5 s down)',
        appValueZh: '5 / 5 / 5 秒',
        appValueEn: '5 / 5 / 5 s',
        label: 'judgment-call',
        summaryZh:
          '「緩慢、可控、重視離心」的原則在旋轉肌相關肩痛與夾擠的離心／動作控制訓練中有相近文獻支持（族群多為肌腱病變／夾擠，非術後）。但「恰為 5 秒上、5 秒下」這個對稱節奏並無研究直接支持，是清楚好教、但屬合理判斷的數字。',
        summaryEn:
          'The principle — slow, controlled, eccentric-aware — has adjacent support in eccentric/motor-control literature for rotator-cuff-related shoulder pain and impingement (mostly tendinopathy/impingement cohorts, not post-op). But the specific symmetric "5 s up, 5 s down" tempo is not directly supported by any study — a clean, teachable number that is a judgment call.',
        citations: [],
      },
      {
        id: 'FF-HOLD-REPS',
        titleZh: '頂點停頓 5 秒、每組 10 次',
        titleEn: '5 s top hold, 10 reps per set',
        appValueZh: '停頓 5 秒；10 次 / 組；次間休息 3 秒',
        appValueEn: '5 s hold; 10 reps / set; 3 s rest between reps',
        label: 'clinical-convention',
        summaryZh:
          '頂點短暫停頓用以證明位置是「控制到位」而非甩上去的；1×10 是居家運動處方的預設「一組」。皆為慣例，未找到特定文獻；確切的 5 秒與 3 秒為合理判斷值。依設計，即使只完成少數幾次（如 3 次乾淨動作）也是有效的紀錄，介面不會將其判為失敗。',
        summaryEn:
          'A brief top hold proves the position was controlled, not thrown into; 1×10 is the default "one set" of home-program convention. Both are convention with no specific source; the exact 5 s and 3 s are judgment values. By design, completing only a few reps (e.g. 3 clean reps) is still a valid record — the interface never scores it as a failure.',
        citations: [],
      },
    ],
  },
  {
    id: 'external-rotation',
    titleZh: '肩外旋',
    titleEn: 'External rotation',
    claims: [
      {
        id: 'ER-TARGET',
        titleZh: '45° 外旋、手肘夾於身側',
        titleEn: '45° external rotation, elbow at the side',
        appValueZh: '45°；手肘屈曲 90° 貼身',
        appValueEn: '45°; elbow flexed 90° at the side',
        label: 'clinical-convention',
        summaryZh:
          '手肘夾於身側的外旋以隔離棘下肌與小圓肌、45° 屬中等（次最大）的早期目標，皆為標準慣例，未找到明確標定「45°」的對應族群文獻。安全提醒：末端外旋會拉扯前側關節囊，是前側穩定（Bankart）／肩胛下肌修補後限制最嚴的動作之一——45° 僅為安全預設，須維持為臨床可調整值，且不可與高舉外展合併（避免恐懼姿勢）。',
        summaryEn:
          'Elbow-at-side external rotation isolates infraspinatus and teres minor, and 45° is a moderate (sub-maximal) early target — standard convention, with no matched-population source pinning "45°." Safety note: end-range ER stresses the anterior capsule and is among the most tightly restricted motions after anterior stabilization (Bankart) / subscapularis repair — 45° is a safe default only as a clinician-tunable input, and must never be combined with abduction at height (the apprehension position).',
        citations: [],
      },
    ],
  },
  {
    id: 'recovery-phases',
    titleZh: '復健階段與進程判定',
    titleEn: 'Recovery phases & progression',
    claims: [
      {
        id: 'PHASE-IMPINGEMENT',
        titleZh: '「90° 是次發性夾擠的高發轉折點」此敘述',
        titleEn: 'The "90° = secondary impingement turning point" wording',
        appValueZh: '第 2 階段臨床說明中的敘述',
        appValueEn: 'A note in the Stage 2 clinical text',
        label: 'literature-adjacent',
        summaryZh:
          '文獻描述的是一個「範圍」而非單一點：約 60–120° 的疼痛弧為肩峰下結構最受壓迫之處，90° 位於此弧的中段，並非獨立的「轉折點」。此外正確用語為「肩峰下（原發性）夾擠」，「次發性夾擠」是另一個概念（因不穩定／肩胛功能不良而續發）。此敘述作為一般生物力學說明尚可，但用字不夠精確，建議改寫為「約 60–120° 是肩峰下結構最受壓迫的區間」。',
        summaryEn:
          'The literature describes a range, not a single point: the ~60–120° painful arc is where subacromial structures are most compressed, and 90° is the middle of that arc, not a distinct "turning point." The correct term is subacromial (primary) impingement; "secondary impingement" is a different concept (secondary to instability / scapular dysfunction). Acceptable as a general biomechanical note, but imprecise as written — better phrased as "the ~60–120° arc is where subacromial structures are most compressed."',
        citations: [
          {
            source: 'Painful arc (60–120°) · clinical test reference',
            url: 'https://orthofixar.com/special-test/shoulder-painful-arc-test/',
            populationZh: '臨床檢查參考資料（非特定族群研究）',
            populationEn: 'Clinical-test reference (not a matched-population study)',
          },
        ],
      },
      {
        id: 'PHASE2-GATE',
        titleZh: '進階判定：20 組 + 平均 90° + 標準率 ≥ 80%',
        titleEn: 'Progression gate: 20 sets + avg 90° + ≥80% clean',
        appValueZh: '20 組、平均角度達 90°、動作標準率 ≥ 80%',
        appValueEn: '20 sets, average angle at 90°, clean-movement rate ≥ 80%',
        label: 'judgment-call',
        summaryZh:
          '「以表現（而非僅時間）決定進階」的原則本身合理，但 20 組與 80% 這兩個門檻是本產品內部指標，無外部文獻依據。重要界線：App 計算出的「可進階」不等於臨床許可——真正的術後進階取決於組織癒合時間與臨床醫師評估。應將其呈現為「練習里程碑（請與臨床醫師討論進階）」，而非授權或預後判斷。',
        summaryEn:
          'Progressing on demonstrated competence (not time alone) is a sound principle, but the 20-sets and 80% thresholds are internal app metrics with no external source. Key boundary: an app-computed "ready to advance" is not clinical clearance — real post-op progression depends on tissue-healing time and a clinician\'s assessment. It should read as a practice milestone ("discuss progression with your clinician"), never as authorization or a prognosis.',
        citations: [],
      },
      {
        id: 'PHASE4-SYMMETRY',
        titleZh: '返回功能標準：雙側肌力對稱度 ≥ 90%',
        titleEn: 'Return-to-function criterion: ≥90% bilateral symmetry',
        appValueZh: '第 4 階段：對稱度 ≥ 90% 且全範圍無痛',
        appValueEn: 'Stage 4: ≥90% symmetry and pain-free full ROM',
        label: 'literature-adjacent',
        summaryZh:
          '「90% 肢體對稱指數」源自下肢／前十字韌帶重返運動的文獻，主要用於重返運動／不穩定情境；有作者認為門檻應更接近 96%，且慣用手會使上肢對稱度更複雜。族群不符（運動員重返運動，非一般居家術後），且 Rehabibi 為單臂動作教練、根本無法量測雙側肌力——因此此標準僅為衛教／參考，App 不會、也不應宣稱能驗證它。',
        summaryEn:
          'The 90% limb-symmetry index originates in lower-limb / ACL return-to-sport literature and is used mainly in return-to-sport / instability contexts; some authors argue thresholds nearer 96%, and hand dominance complicates upper-limb symmetry. Population mismatch (athletes returning to sport, not general at-home post-op), and Rehabibi is a single-arm form coach that cannot measure bilateral strength at all — so this is informational only, and the app neither verifies nor should claim to verify it.',
        citations: [
          {
            source: 'Upper-extremity return-to-sport symmetry · JOSPT commentary',
            url: 'https://www.jospt.org/do/10.2519/jospt.blog.20250714/full/',
            populationZh: '重返運動／上肢族群，非一般居家術後復健',
            populationEn: 'Return-to-sport / upper-extremity, not general at-home post-op rehab',
          },
        ],
      },
      {
        id: 'PHASE-STRUCTURE',
        titleZh: '四階段結構與活動度分段',
        titleEn: 'Four-stage structure & ROM bands',
        appValueZh: '0–45° / 0–90° / 90–150° / 150–180°',
        appValueEn: '0–45° / 0–90° / 90–150° / 150–180°',
        label: 'clinical-convention',
        summaryZh:
          '「保護 → 主動活動 → 強化 → 功能返回」的分階段結構是術後肩關節復健的標準骨架（慣例）；但確切的角度分段為未驗證的判斷值。真實的復健通常同時依「術後週數」與里程碑決定，且不同手術（旋轉肌袖修補、減壓、Bankart、五十肩）時程不同——故此分段應視為示意、且可由臨床醫師覆寫，而非固定時間表。',
        summaryEn:
          'A protection → active motion → strengthening → functional-return structure is the standard skeleton of post-op shoulder rehab (convention); the exact ROM band cutoffs are unvalidated judgment values. Real rehab is gated by weeks-post-surgery plus milestones, and different procedures (RCR, decompression, Bankart, adhesive capsulitis) have different timelines — so these bands are illustrative and clinician-overridable, not a schedule.',
        citations: [],
      },
    ],
  },
  {
    id: 'compensations',
    titleZh: '代償偵測（動作提示）',
    titleEn: 'Compensations (form cues)',
    claims: [
      {
        id: 'FLAG-CORE',
        titleZh: '聳肩、軀幹借力、手肘彎曲、動作過快',
        titleEn: 'Shoulder hike, torso lean, elbow bend, rushing',
        appValueZh: '皆為即時動作提示（非評分）',
        appValueEn: 'Live form cues (never a verdict)',
        label: 'clinical-convention',
        summaryZh:
          '上斜方肌代償（聳肩）是肩關節復健最重要的代償，也是本產品的核心觀察；軀幹借力、手肘彎曲縮短力臂、以動量甩動（尤其下放）都是公認的代償。這些「動作是否為代償」屬教科書慣例；實際觸發的門檻值屬量測工程範疇，另列為暫定值。提示措辭一律描述「可觀察的動作」，而非指責使用者。',
        summaryEn:
          'Upper-trapezius substitution (shrugging) is the most important compensation in shoulder rehab and this product\'s headline observable; trunk lean, elbow bend that shortens the lever, and momentum (especially dropping the lowering phase) are all recognized cheats. That these are genuine compensations is textbook convention; the trigger threshold values are a measurement-engineering matter, listed separately as placeholders. Every cue names the observable action, never blames the user.',
        citations: [],
      },
      {
        id: 'FLAG-PACING-SLOW',
        titleZh: '「動作過慢」作為缺失',
        titleEn: '"Too slow" treated as a fault',
        appValueZh: '目前會提示「稍微加快」',
        appValueEn: 'Currently cues "a little faster"',
        label: 'judgment-call',
        summaryZh:
          '對本族群而言，比目標慢通常是保護性的，僵硬或疼痛（五十肩、早期術後）的肩膀甚至「需要」放慢。將「過慢」視為缺失，可能促使謹慎的使用者加快到不安全的速度，臨床上並無依據——建議將其降為中性／資訊性提示。',
        summaryEn:
          'For this population, slower than target is usually protective, and a stiff or painful shoulder (adhesive capsulitis, early post-op) may need to move slowly. Treating "too slow" as a fault risks nudging a cautious user to speed up unsafely, and has no clinical basis — recommended for demotion to a neutral/informational cue.',
        citations: [],
      },
      {
        id: 'FLAG-THRESHOLDS',
        titleZh: '代償偵測的門檻值',
        titleEn: 'Compensation detection thresholds',
        appValueZh: '聳肩／軀幹／手肘比例等（如 0.18、16°）',
        appValueEn: 'Shrug / lean / elbow ratios (e.g. 0.18, 16°)',
        label: 'placeholder',
        summaryZh:
          '目前的門檻值皆為作者單人（n=1）調校，且刻意偏向「寧可漏報」。對無人監督的使用者而言，「漏掉的聳肩」會被練成習慣，是代價更高的錯誤。這些值需以實際影像資料建立驗證資料集後校正，屬暫定值而非文獻問題。',
        summaryEn:
          'The current thresholds are all single-author (n=1) tuned and deliberately biased toward false negatives. For an unsupervised user, a missed shrug gets practiced into the motor pattern — the more expensive error. These need tuning against a real footage corpus, so they are placeholders, not a literature question.',
        citations: [],
      },
    ],
  },
  {
    id: 'safety-gate',
    titleZh: '安全把關：主動抬升的時機',
    titleEn: 'Safety gate: timing of active elevation',
    claims: [
      {
        id: 'SF-1',
        titleZh: '旋轉肌袖修補後，主動抬升需延後並經臨床許可',
        titleEn: 'After rotator-cuff repair, active elevation is deferred and needs clearance',
        appValueZh: '目前僅側臥支撐有「須經臨床許可」的提示；其餘主動抬升動作沒有',
        appValueEn: 'Only the side-lying hold carries a clinician-clearance line; the active-elevation exercises do not',
        label: 'literature-supported',
        summaryZh:
          '這是本文件中證據最直接、且族群相符的發現：旋轉肌袖修補後，主動抬升通常延後至約術後 4–6 週，以保護修補處。這不是「數字錯了」，而是「少了一道把關」——六個動作中有四個是主動抬升／旋轉，卻沒有像側臥支撐那樣提醒使用者先取得臨床許可。這是對無人監督的術後使用者最值得補上的一項（屬文字／把關，非參數變更）。',
        summaryEn:
          'This is the most direct, population-matched finding in the record: after rotator-cuff repair, active elevation is typically deferred to ~4–6 weeks post-surgery to protect the repair. This is not a wrong number — it is a missing gate: four of six exercises are active elevation/rotation yet, unlike the side-lying hold, none tell the user to obtain clinician clearance first. It is the single most worthwhile addition for an unsupervised post-op user (a copy/gating matter, not a parameter change).',
        citations: [
          {
            source: 'Rotator-cuff repair rehabilitation review · PMC12537514',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12537514/',
            populationZh: '旋轉肌袖修補術後族群（與本產品相符）',
            populationEn: 'Post-rotator-cuff-repair population (matches this product)',
          },
        ],
      },
    ],
  },
] as const
