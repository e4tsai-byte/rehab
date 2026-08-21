> **Archived 2026-08-21 — not a Rehabibi document.**
>
> This was written for *velocare*, the supervised 5x sit-to-stand assessment that
> used to share this repository and was deleted on 2026-08-21. Its subject matter
> (velocity-loss autoregulation in older adults) has no bearing on shoulder
> rehabilitation and none of its numbers apply to Rehabibi.
>
> It is kept for one reason: it is the worked example of the evidence standard
> this project holds itself to. It caught its own citation error — a 10% threshold
> that had been written up as 20%, traced to a search-engine summary nobody checked
> against the abstract — and it reports the population mismatch of its own sources
> rather than burying it. `.claude/agents/evidence-analyst.md` cites it as the
> format to follow. The full velocare history is on the `velocare-archive` branch
> and the `velocare-final-state` tag.

---

# Research Notes: Individualizing the Velocity-Loss Decision

**Question:** how do we design the velocity-loss autoregulation decision (fatigue-stop + progression) when participants vary hugely in age, sex, weight, and muscle-atrophy severity — without demographic profiling, calibration, or clinical categorization?

**Short answer:** the fatigue-stop decision is already individualized by construction (it's self-referential). The progression decision currently is not — it compares against a fixed "target zone" — and that's the piece that needs to change, by extending the same self-referential principle across sessions instead of within one. Two qualifications survived review and fact-checking: (1) the literature doesn't cleanly endorse "self-reference instead of demographics" — it's more nuanced than that, addressed honestly in Section 1; (2) a fully population-data-free design isn't achievable at cold-start (Section 2) — resolved there without reintroducing demographic profiling.

**Terminology:** a "band" is a discrete difficulty level (currently proposed as resistance-band color or dumbbell weight, per brief 4.4 — this mechanism is itself an open decision, see Open Questions). "Progression" means moving a participant to the next band up.

**Note on sourcing:** all four citations below were independently re-verified against their actual abstracts after a review pass caught a wrong number and a mischaracterized quote in an earlier draft (details in each section). Every claim here is now checked against the source text directly, not against a search engine's summary of it.

---

## 1. Fatigue-stop decision (within a set) — self-referential by construction; literature support is more nuanced than "pure self-reference wins"

`velocity_loss_pct = (1 − last3_mean_velocity / first3_mean_velocity) × 100` compares a person's own first-3 reps to their own last-3 reps, same session, same load. Nobody's sex, weight, or atrophy severity needs to be looked up or categorized — the reference point is that person's own body a few seconds earlier. That property is real and worth keeping regardless of what follows.

**Correcting the earlier draft's framing — the literature doesn't cleanly say "individualize via self-reference, not demographics."** [*One Velocity Loss Threshold Does Not Fit All* (PubMed 37668949)](https://pubmed.ncbi.nlm.nih.gov/37668949/), verbatim from the abstract: *"VL monitoring practices could be improved by considering sex, training status, history, and psychological traits of individuals due to their effects on the variability in responses to different VL thresholds."* That's a recommendation to account for demographic/experience factors, not an endorsement of pure self-referencing over them. Self-referencing is *our* proposed engineering response to the variability this paper documents — it's a reasonable one (it doesn't require collecting or categorizing any of those traits), but this specific paper doesn't itself argue against demographic-aware thresholds; it argues *for* considering them. Worth being honest about that rather than citing this paper as if it settles the question in favor of our approach.

**On the fatigue-stop threshold itself — the literature number is 10%, not the 20% the brief proposes, and that discrepancy matters.** [Velocity-Monitored Resistance Training in Older Adults (PubMed 34537803)](https://pubmed.ncbi.nlm.nih.gov/34537803/) — 42 older adults, mean age 79.7 — verbatim: *"The set ended when a velocity loss of 10% was reached."* An earlier draft of this document cited this study as validating a **20%** threshold; that was a factual error (traced to an inaccurate search-engine summary that was never checked against the actual abstract). The correct number is 10%, in a population close to this device's target demographic (mean age ~80). This is directly safety-relevant: **the literature-tested threshold in an elderly population is more conservative (stops sooner) than the brief's proposed 20% default.** This needs a decision, not a citation fix alone — see Open Questions.

**Sex-difference nuance, correctly attributed and hedged this time:** [acute neuromuscular/hormonal responses to 20% vs 40% velocity loss in males and females (PMC9542169)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9542169/) — verbatim: *"males appeared to be more susceptible to acute neuromuscular fatigue than females, and the difference in fatigability between 20 and 40% velocity loss was more pronounced in males."* On reps completed, the picture is mixed and threshold-dependent: males and females completed similar rep counts at 20% VL (~5.1 vs ~4.6, not flagged as statistically significant in the source), but at 40% VL females completed slightly more (~7.1 vs ~7.9) — so "females do more reps at a given VL threshold" is not a clean finding at the 20% threshold specifically, only trending that way at 40%.

**Population caveat on this sex-difference citation and 37668949 above — neither was conducted in older adults.** PMC9542169's sample was aged 20-35; 37668949's was resistance-trained adults aged 18-40. Both are healthy young trained lifters, not a frail or sarcopenic elderly cohort. This doesn't mean a sex effect on fatigability doesn't exist in older adults too — it means the *magnitude* of any such effect is unvalidated in this device's actual target population, unlike the 10% threshold finding above (34537803), which was conducted in adults with a mean age of ~80. Doesn't change the mechanism (still self-referential), but is worth revisiting if the 20%-vs-10% question above gets resolved by moving toward 40% VL protocols for any subgroup.

**Safety caveat — atrophy severity and the fatigue-stop threshold (the safety-relevant half of the original question; not resolved by self-referencing alone).** Self-referencing solves *efficacy* individualization (whether a given VL% is the right training stimulus for this person) but doesn't by itself prove *safety* individualization (whether that same VL% is a safe point to keep going to, rather than stop earlier, for someone with severe sarcopenia specifically). This remains open — see Open Questions — independent of which VL% is chosen below.

**Decision: keep 20% as the default, not 10%.** The 10%-vs-20% discrepancy above is real, but 20% is the better choice for this specific device, for reasons distinct from (and not overridden by) the elderly-population study finding 10%:

1. **Exercise modality and injury-severity profile differ materially.** 34537803 tested leg press and chest press at 40-65% 1RM on resistance machines — externally loaded, mechanically constrained movements where continuing too long into fatigue risks joint strain or loss of bar/carriage control. Bodyweight sit-to-stand is self-limiting by comparison: the realistic failure mode at high fatigue is sitting down harder or needing a supported stand, not a loaded-implement injury. A lower-injury-severity movement can defensibly tolerate a somewhat higher velocity-loss threshold before stopping.
2. **20% is not an unprecedented number — it's the more common threshold in the broader VBT literature.** Across general (non-elderly-specific) velocity-based training research, 20% vs. 40% is the standard comparison pair for "moderate" vs. "high" fatigue protocols; 20% is consistently the threshold associated with a good strength/fatigue tradeoff (see the PMC9542169 sex-difference study above, which itself uses 20%/40% as its two conditions). 10% is a narrower, single-study data point in one specific loaded-machine elderly protocol, not the field's general default.
3. **Measurement-noise floor makes 10% impractical for this specific device.** 34537803 almost certainly measured velocity via a machine-mounted transducer — high-precision, low-noise, mechanically constrained. This device derives velocity from 2D camera pose-landmark displacement, which is inherently noisier (landmark jitter, frame-rate limits — the entire reason this project's design already needs median filtering and hysteresis just for state classification, see the step-1 design doc). A 10% velocity-loss threshold sits close to that measurement noise floor: sets could trigger a false fatigue-stop from tracking noise alone, cutting training stimulus short without a real safety gain, and eroding facilitator/participant trust in the device ("it stopped me for no reason"). 20% gives real signal-to-noise margin for a camera-based measurement that a transducer-based study didn't need to account for.
4. **The velocity-loss threshold is not the only safety layer.** A staff facilitator supervises sessions live and can stop a participant at any time regardless of what the algorithm says; starting bands are conservative; per-rep form flags (trunk lean, ROM) exist independently of the velocity signal (brief 4.4). The VL threshold doesn't have to be the sole or most conservative possible safety backstop to be a safe design choice.

This is a judgment call, not a literature-mandated number — pilot testing (Open Questions) is still the way to confirm 20% is well-calibrated for this population and modality, same as every other threshold in this project.

---

## 2. Progression decision (between sessions) — the actual gap, specified concretely

Brief section 4.4 currently says: compare session speed at the current band to a **target zone**; faster → next band up. A fixed target zone *would* need to vary by demographic — this is the part of the design that doesn't yet inherit the self-referential principle used everywhere else.

**Recommended mechanism — per-participant rolling baseline, with concrete parameters (starting points, all tunable against pilot data like every other threshold in this project):**

- **"A session's speed" = that session's first-3-rep mean velocity** — same statistic and convention as the within-set fatigue-stop calculation (Section 1), so the two decisions stay consistent and nothing new needs defining.
- **Reference statistic:** median of the trailing 3 sessions at that band (not mean) — consistent with this project's existing choice of median-over-mean elsewhere (`pose_coach/smoothing.py`) for the same reason: robustness to one noisy/outlier session (illness, low motivation) not counting as a genuine baseline shift.
- **Promotion signal:** current session's first-3-rep mean velocity exceeds the trailing median by a set margin (placeholder: 10%, needs pilot tuning like every other threshold in this project) — **and persists for 2 consecutive sessions**, not a single session, to reduce false-positive promotions from one noisy session.
- **Regression signal:** not yet designed in the brief (brief 4.4 only names the outcome "slower → hold or reduce," not a trigger condition). **Interim default: never auto-regress until this is formalized** — stated explicitly here as a deliberate fail-safe choice, not a silent gap.
- **Cold start (first exposure to a band, no baseline yet):** **hold — no progression decision is possible or attempted** until 3 sessions exist to form a trailing median. This keeps the design fully self-referential (no population-wide starting value substituted in). **Minimum latency to a first possible promotion after any band change: 5 sessions** (3 to establish the baseline + 2 consecutive sessions exceeding it) — not "2-3" as an earlier draft miscounted. In a weekly-session community setting that's over a month of "hold" after every promotion; worth flagging as a participant-facing UX consideration (repeated "hold" could read as the system being stuck) even though it's the technically correct minimum for this design.
- **Baseline reliability check:** the same first-3-rep consistency check proposed for the intra-set case (Section 5) should also gate whether a session's speed is trustworthy enough to feed the rolling baseline at all.

---

## 3. Instrumentation variability vs. physiological variability — a distinct axis

"Weight" in the original question has two different effects on this system, and only one is addressed by self-referencing:

- **Physiological:** absorbed automatically into each person's own baseline — solved by Sections 1-2.
- **Instrumentation:** body habitus can affect pose-landmark tracking accuracy independent of physiology — occlusion, clothing, camera angle can all degrade tracking differently for different body types. Not solved by self-referencing at all; partially addressed at the tracking layer already (per-landmark `visibility` scores, side-selection fallback — see the step-1 design doc), named here so it isn't assumed covered by this document's argument.

**Age** gets the same two-sided treatment, less developed: physiologically it's absorbed into self-referencing like weight. Whether age has a distinct *tracking* failure mode (e.g. tremor or balance-related movement affecting landmark stability, independent of atrophy severity) isn't analyzed here and would need real footage across an age range to assess — noted as a gap, not answered.

---

## 4. Calibration-free tradeoff (context, not an action item)

A related study, [*Sit-to-Stand Power From 2D Pose Estimation as an Indicator of Muscle Strength in Older Adults* (PMC12834695)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12834695/), lends partial support to this project's overall approach — 2D-pose-derived sit-to-stand power moderately correlated with actual strength measures (knee extension r=0.64, handgrip r=0.64, ASMI r=0.70; roughly 40-50% of variance explained, not a tight validation). Their method normalizes using each participant's **height** for body-scale calibration.

Our design deliberately avoids any calibration step (brief 4.3, 4.6) — trading some absolute comparability for zero-setup deployability in a community-center setting. This is a reason to trust cross-person *absolute* comparisons even less than a calibrated system would, reinforcing why every decision in this system should stay self-referential rather than attempting cross-person comparison.

---

## 5. Edge case: unreliable baseline signal (within a set)

Someone with severe sarcopenia may have noisy, inconsistent reps even on their "baseline" first 3 reps — meaning the velocity_loss_pct ratio itself becomes unreliable before real fatigue even sets in (high variance in the denominator). Recommend a consistency check (e.g. coefficient of variation across the first-3 reps) before trusting `velocity_loss_pct` for that set, analogous to the existing `form_flags` pattern (brief 4.4) — flag low-consistency baselines rather than silently acting on a noisy ratio. (Extended to the cross-session baseline in Section 2.)

---

## 6. Summary — design principle to carry forward

**Default to self-referential decisions (this person, this session, or this person's own recent history) over population-normalized absolute thresholds, with two named exceptions rather than an absolute rule:** (1) cold-start is "hold," not a substituted population value (Section 2); (2) the fatigue-stop threshold itself is necessarily a population number, not a self-referential one — there's no session-zero self-reference to fall back on before a person's very first set. **Decided: 20%**, justified in Section 1 on modality/injury-severity, literature-precedent, and measurement-noise grounds specific to this device — not simply inherited from the 10%-threshold elderly study, which used a different (loaded-machine) exercise modality and a far lower-noise measurement method. Self-referencing solves individualization for everything *after* that first threshold is set; it doesn't remove the need to pick the threshold responsibly in the first place.

## Open questions for the next design pass

**Triage rule:** a question is *blocking* if implementation has no defensible default to proceed with (a genuine policy/safety decision is missing). It's *non-blocking* if a concrete placeholder value already exists in this document and implementation can proceed, with tuning deferred to real pilot data — same status as the angle/hysteresis constants in the step-1 design doc.

**Blocking — no default exists yet, needed before implementation:**
- **Does atrophy severity affect the safety of the 20% fatigue-stop threshold**, independent of self-referencing? Not addressed by anything in this document — still the single most consequential open item given this repo treats the autoregulation engine as safety-relevant.

**Resolved:**
- ~~10% vs. 20% fatigue-stop threshold~~ — **decided: 20%**, justified in Section 1 (modality/injury-severity, literature precedent, camera-measurement noise floor, and the presence of independent safety layers). Confirm against pilot data like any other threshold, but this is no longer a blocking design gap.

**Non-blocking — a placeholder default already exists, tune later against pilot data:**
- Section 2's progression parameters (median-of-3-sessions, 10% promotion margin, 2-session persistence).
- The first-3-rep and cross-session consistency-check thresholds (Sections 5, 2).
- Should a sustained *negative* trend (declining velocity over sessions) be surfaced as a possible health/deconditioning signal rather than only gating progression? Elder-care context makes this plausibly important (illness, fall risk) beyond pure training-progression logic.
- Does a participant's baseline transfer at all when they move between bands, or does the rolling baseline start genuinely cold every time (this document's current default)? If genuinely cold every time, is a ~5-session "hold" period after every single promotion acceptable UX, or does it need a shorter cold-start path?
- Age's distinct tracking-accuracy failure modes (Section 3) — needs real footage across an age range to assess, not resolvable from literature alone.
