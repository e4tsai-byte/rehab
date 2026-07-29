# Research Notes: Individualizing the Velocity-Loss Decision

**Question:** how do we design the velocity-loss autoregulation decision (fatigue-stop + progression) when participants vary hugely in age, sex, weight, and muscle-atrophy severity — without demographic profiling, calibration, or clinical categorization?

**Short answer:** the fatigue-stop decision is already individualized by construction (it's self-referential). The progression decision currently is not — it compares against a fixed "target zone" — and that's the one piece that needs to change. The fix is the same self-referential principle, just extended across sessions instead of within one.

---

## 1. Fatigue-stop decision (within a set) — already correct

`velocity_loss_pct = (1 − last3_mean_velocity / first3_mean_velocity) × 100` compares a person's own first-3 reps to their own last-3 reps, same session, same load. Nobody's sex, weight, or atrophy severity needs to be looked up or categorized — the reference point is that person's own body a few seconds earlier.

This matches how the field actually handles individual variability. A 2023 review, [*One Velocity Loss Threshold Does Not Fit All* (PubMed 37668949)](https://pubmed.ncbi.nlm.nih.gov/37668949/), confirms large individual variability by sex, training status, and history — but does **not** offer a formula to adjust thresholds by demographic category:

> "The present study could not determine variability in metabolic, neuromuscular, and biomechanical responses to different VL thresholds."

The field's actual practice — per [VBT autoregulation methodology](https://www.outputsports.com/blog/autoregulation-with-velocity-based-training) — is to profile each individual and reference *their own* velocity, never a demographic lookup table. Our design already does this for the stop decision.

**The 20% threshold itself is validated in the target population.** [Velocity-Monitored Resistance Training in Older Adults (PubMed 34537803)](https://pubmed.ncbi.nlm.nih.gov/34537803/) found a 20% velocity-loss threshold improved strength outcomes specifically in older adults — this isn't an arbitrary import from powerlifting, it's literature-backed for this exact population.

**Sex-difference nuance (not yet actioned, noted for later):** [acute neuromuscular/hormonal responses to 20% vs 40% velocity loss in males and females (PMC9542169)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9542169/) found males more susceptible to acute fatigue at a given VL threshold than females, and females complete more reps across VL thresholds at a given load. This doesn't change the *mechanism* (still self-referential), but is worth revisiting if the 20% default threshold shows a sex-skewed pattern in real pilot data — a two-line config change, not a redesign.

---

## 2. Progression decision (between sessions) — the actual gap

Brief section 4.4 currently says: compare session speed at the current band to a **target zone**; faster → next band up. A fixed target zone *would* need to vary by demographic — this is the part of the design that doesn't yet inherit the self-referential principle used everywhere else.

**Recommended fix — replace the fixed target zone with a per-participant rolling baseline:**

- First 1-2 sessions at a given band establish that person's own reference speed at that band (their **individual baseline**, not a population value).
- Later sessions compare against their own trailing average at that band, not a global constant.
- "Faster than the zone" becomes **"faster than their own recent sessions at this band."** No gender/weight/health category is ever looked up — the reference point is always that specific person's own history, which already encodes whatever their muscle mass, sex, and atrophy severity are.

This mirrors standard VBT autoregulation practice: individualize progression using each person's own **first-rep-velocity (FRV) profile**, established from their own early sessions, then track whether they're getting faster or slower relative to *their own history* — not a population target. It also matches what the brief already says for longitudinal tracking ("speed at a fixed band rising = strength gain") — this just makes that the *decision mechanism* for progression, not only a reporting metric.

---

## 3. Calibration-free tradeoff (context, not an action item)

A directly relevant 2025 study, [*Sit-to-Stand Power From 2D Pose Estimation as an Indicator of Muscle Strength in Older Adults* (PMC12834695)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12834695/), validates this project's overall approach — 2D-pose-derived sit-to-stand power correlated well with actual strength measures (knee extension r=0.64, handgrip r=0.64, ASMI r=0.70). But their method normalizes using each participant's **height** for body-scale calibration.

Our design deliberately avoids any calibration step (brief 4.3, 4.6) — trading a bit of academic-grade absolute comparability for zero-setup deployability in a community-center setting. Worth remembering as a reason to trust cross-person *absolute* comparisons even less than a calibrated system would — reinforces why every decision in this system should stay self-referential rather than attempting cross-person comparison.

---

## 4. Edge case to design for: unreliable baseline signal

Someone with severe sarcopenia may have noisy, inconsistent reps even on their "baseline" first 3 reps — meaning the velocity_loss_pct ratio itself becomes unreliable before real fatigue even sets in (high variance in the denominator). Recommend adding a consistency check (e.g. coefficient of variation across the first-3 reps) before trusting `velocity_loss_pct` for that set, analogous to the existing `form_flags` pattern (brief 4.4) — flag low-consistency baselines rather than silently acting on a noisy ratio.

---

## 5. Summary — design principle to carry forward

**Every decision in this system should be self-referential (this person, this session, or this person's own history) — never a population-normalized absolute threshold.** The fatigue-stop decision already follows this. The fix for progression is to make it follow the same rule. No demographic categorization (age, sex, weight, atrophy severity) needs to enter the decision logic anywhere, by design — those factors are automatically absorbed into each person's own baseline.

## Open questions for the next design pass

- How many sessions are needed before a per-participant baseline at a given band is trustworthy enough to drive a progression decision? (Cold-start problem — first band, first session, no baseline yet.)
- What's the fallback decision when there's no baseline yet (first time at a band)? Hold, or use a conservative population-wide starting default just for the very first exposure?
- Threshold for the first-3-rep consistency check (section 4) — needs real pilot data to tune, same as the other thresholds already flagged as placeholders in the step-1 design doc.
