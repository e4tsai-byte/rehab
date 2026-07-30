/* ─────────────────────────────────────────────────────────────────────────────
   Derived statistics for a single 5xSTS trial.

   EVERYTHING HERE IS ARITHMETIC ON MEASURED TIMES. Nothing is modelled,
   inferred, or estimated. Each function takes the per-rep durations the trial
   already recorded and returns a number in milliseconds or a plain ratio.

   WHAT IS DELIBERATELY ABSENT, and must stay absent while this build has no
   pose estimation:

   - **peak velocity, mean velocity, velocity loss.** There is no pose model in
     this build, so any velocity figure would be fabricated — the same reason
     the rail reports 鏡頭訊號 rather than a tracking-confidence number. They are
     also Tier 2, gated on the August experiment. `Tier2Panel` names them as
     PLANNED outputs and shows no values.
   - **any movement trace.** Same reason: there is no per-frame kinematic series
     to draw, and drawing a plausible-looking one would be inventing data.
   - **any threshold, band, percentile or norm.** Invariant 3. `slowdown` is the
     fatigue signal expressed in TIME, and it is reported as arithmetic — "0.7 s
     slower than rep 1" — never as a judgement about the person.

   The rep-to-rep slowdown is the honest Tier 1 stand-in for what Tier 2 would
   measure with velocity: if someone is fatiguing within the set, the later reps
   take longer, and that shows up in the durations without a pose model.
   ───────────────────────────────────────────────────────────────────────────── */

export interface RepStats {
  readonly reps: number
  /** Duration of the first rep, ms. */
  readonly firstMs: number
  /** Duration of the last rep, ms. */
  readonly lastMs: number
  /**
   * `lastMs - firstMs`. POSITIVE means the last rep took longer than the first,
   * which is what within-set fatigue looks like in the time domain. Negative is
   * perfectly ordinary and is not an error.
   */
  readonly slowdownMs: number
  readonly meanMs: number
  readonly fastestMs: number
  readonly slowestMs: number
  /** `slowestMs - fastestMs`. A consistency measure, not a quality measure. */
  readonly spreadMs: number
  /** 1-based indices, for labelling which rep was which. */
  readonly fastestRep: number
  readonly slowestRep: number
}

/**
 * `null` when there are fewer than two reps: a slowdown between a rep and
 * itself is not a quantity, and a mean of one number tells the reader nothing
 * they cannot already see. Returning null rather than a degenerate object keeps
 * the "not enough data" case at the call site instead of hiding it in a zero.
 */
export function repStats(repTimesMs: readonly number[]): RepStats | null {
  if (repTimesMs.length < 2) return null

  const first = repTimesMs[0]!
  const last = repTimesMs[repTimesMs.length - 1]!

  let fastestRep = 0
  let slowestRep = 0
  let total = 0
  repTimesMs.forEach((ms, i) => {
    total += ms
    if (ms < repTimesMs[fastestRep]!) fastestRep = i
    if (ms > repTimesMs[slowestRep]!) slowestRep = i
  })

  const fastest = repTimesMs[fastestRep]!
  const slowest = repTimesMs[slowestRep]!

  return {
    reps: repTimesMs.length,
    firstMs: first,
    lastMs: last,
    slowdownMs: last - first,
    meanMs: total / repTimesMs.length,
    fastestMs: fastest,
    slowestMs: slowest,
    spreadMs: slowest - fastest,
    fastestRep: fastestRep + 1,
    slowestRep: slowestRep + 1,
  }
}

/**
 * Shared scale for a pre/post split overlay.
 *
 * The maximum across BOTH trials, so the two are drawn against one axis and are
 * actually comparable. Still strictly internal to this participant's own two
 * measurements — no external scale and therefore no imported norm.
 */
export function sharedScaleMs(a: readonly number[], b: readonly number[]): number {
  return Math.max(1, ...a, ...b)
}
