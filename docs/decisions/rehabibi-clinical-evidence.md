> **This IS a Rehabibi document.** (Unlike `velocity-loss-decision-research.md`
> in this same folder, which is an archived *velocare* artifact whose numbers do
> not apply here — it is kept only as the worked example of the method.)
>
> **Purpose.** This is the definitive clinical-evidence provenance record for
> every clinical number and claim in Rehabibi, an in-browser **form coach** for
> adults rehabilitating a shoulder at home. It verifies each claim in the
> physiatrist's claim inventory against the actual literature and assigns each a
> final provenance label. It changes **no** code, prescription number, or CONFIG
> value — it records whether each existing value is defensible and what a change
> would require.
>
> **Form-coach boundary (invariant 7).** Rehabibi provides form feedback and
> adherence tracking for movements a clinician has already prescribed. It does
> not diagnose, prescribe, assess healing, or replace in-person therapy. Every
> catalog value below is a safe **default/bound**, not a prescription; range,
> reps, and frequency are clinician-set inputs.
>
> **The standing rule:** *no number in this product is unattributed, and no
> attribution is wrong.* Where matching-population support is absent, the claim
> is labeled convention / judgment / placeholder — **not** given a stretched
> citation. Many claims below land there. That honesty is the deliverable.
>
> **Population Rehabibi actually serves:** adults recovering from orthopedic
> shoulder surgery (rotator cuff repair [RCR], subacromial decompression, labral
> repair), plus adhesive capsulitis and chronic shoulder pain, exercising
> **unsupervised at home**. Every source below is read against that population,
> and the mismatch is stated in the same paragraph as the finding.

---

# Rehabibi — Clinical Evidence & Decision Record

**Prepared by:** evidence-analyst. **Date:** 2026-08-22.
**Inputs:** physiatrist claim inventory (2026-08-22); `src/domain/exerciseCatalog.ts`;
`src/domain/recoveryMilestones.ts`; `src/pose/shoulderKinematics.ts` CONFIG.
**Method:** every quoted sentence was read against the actual abstract/source
text (not a search-engine summary). Sources that would not render (PubMed cookie
wall, ScienceDirect/JOSPT 403, binary protocol PDFs) were reached through Europe
PMC's REST API or an alternate host, and are flagged where a verbatim pull was
not achievable.

---

## The question, stated plainly

Are the clinical numbers Rehabibi ships — target angles, hold durations,
tempos, rep/set/frequency doses, the side-lying supraspinatus band, the recovery
phases and their progression gates, and the compensation flags — supported by
literature in a *post-operative, at-home shoulder* population; and where they are
not, what is their true provenance?

## Short answer, qualifications up front

1. **The doses that map best to the literature are the isometric-hold doses.**
   20–30 s holds, ~5 reps, 2+/day sits squarely inside published isometric
   dosing for rotator-cuff *tendinopathy* — but that is a **tendinopathy**
   population, not post-op, so these land **literature-adjacent**, not
   literature-supported.
2. **The single strongest EMG finding cuts against one of our own cues.** "Full
   can" (thumb-up / external rotation) reliably produces *less deltoid* activity
   than "empty can" (thumb-down). Our **scaption** cue correctly says thumb-up;
   our **abduction** cue says "palm down," which is the *less* protective cue on
   the *more* provocative plane. That is a real internal inconsistency, verified.
3. **No literature pins the 15–18° deltoid/upper-trap "takeover" ceiling** that
   the side-lying hold is built around. The surrounding EMG literature is real
   but does not name that angle, and separately shows the supraspinatus is
   *never* truly isolated at any position. The band remains a **judgment call,
   unvalidated**.
4. **The biggest safety gap is not a wrong number — it is a missing gate.**
   Active elevation is deferred ~4–6 weeks after RCR in the literature; four of
   six catalog exercises are active elevation/rotation and carry **no**
   clinician-clearance line (only the hold does). This is a copy/gating gap, not
   a value error, and it is escalated (OQ-D / SF-1).
5. **Two recovery-phase strings are imprecise against the literature:** "90° is a
   common turning point for **secondary** impingement" (the arc is a *range*,
   60–120°, and the term is *subacromial*, not secondary), and "≥90% bilateral
   symmetry" (a criterion borrowed from lower-limb/ACL return-to-sport).
6. Most remaining numbers are honest **clinical convention** or **judgment
   calls** — reasonable, teachable, and unsourced. That is expected for a home
   form-coach and is stated plainly rather than dressed up.

---

## 1. Forward flexion & tempo (FF-*)

**App values.** `targetAngleDeg: 90`; `holdDurationS: 5`; concentric/eccentric
cadence 5 s each; `targetReps: 10`; `REST_BETWEEN_REPS_S 3.0`. Standing and
seated variants, upright trunk.

**FF-TARGET — 90° forward flexion.** 90° is a standard functional milestone and
the boundary of the mid-range force-couple work. I found **no** source that
pins "90°" as a specific sourced *target* for the sub-acute active phase — it is
taught convention. What the literature does establish is the *timing* around it:
a rotator-cuff-repair literature review states patients can achieve *"early
passive mobilization and active range of motion at four to six weeks without
compromise of tendon repair integrity"*
([PMC12537514](https://pmc.ncbi.nlm.nih.gov/articles/PMC12537514/), literature
review; population = post-RCR, matches Rehabibi). So a 90° *active* flexion
target is only phase-appropriate once a clinician has cleared active elevation —
the number is convention, the gating is the real issue (SF-1 / OQ-D). Note also
that 90° sits *inside* the painful arc (§6), not above it, so "stopping at 90°
keeps the arm out of the impingement arc" is not strictly correct; "stopping at
90° avoids the *higher* arc" is.
**Label: clinical convention, uncited.**

**FF-HOLD — 5 s end-range hold.** No source found for a 5 s end-range pause in
paced cuff reps. It is a "pause to prove control" convention; the specific 5 s is
a clean teachable number. **Label: clinical convention, uncited** (the 5 s value
itself: judgment call, unvalidated).

**FF-TEMPO — 5-5-5 cadence.** Controlled/eccentric-biased tempo is
evidence-*adjacent*: eccentric and motor-control exercise is repeatedly reported
effective in rotator-cuff-related shoulder pain and subacromial impingement
(e.g. eccentric-training and motor-control literature surfaced in review, but in
tendinopathy/impingement, not post-op cohorts). I did **not** find a source
showing a specific *5 s concentric + 5 s eccentric* tempo reduces compensation.
The principle (slow, controlled, eccentric-aware) is convention with adjacent
support; the exact 5-5-5 symmetry is invented-but-reasonable.
**Label: judgment call, unvalidated** (5-5-5 split); the "slow and controlled"
principle behind it is clinical convention with literature-adjacent eccentric
support.

**FF-REPS — 10 reps / 3 s inter-rep rest.** 1×10 is the default "one set" of
home-program convention; no specific source. The 3 s inter-rep rest is an
internal pacing value. **Label: clinical convention, uncited** (10 reps);
**judgment call, unvalidated** (3 s rest). Note invariant 1.6: the summary must
never score a short session (e.g. 3 clean reps) as failure.

**FF-POSTURE — seated variant, upright trunk.** Standard accessibility
substitution; upright trunk prevents the TORSO_LEAN substitution. No specific
source; uncontroversial. **Label: clinical convention, uncited.**

**Decision.** All FF-* values are defensible as safe home-coach defaults and
should stand as *clinician-tunable inputs*. The evidence does **not** independently
justify the specific 90°/5-5-5/10-rep numbers as sourced prescriptions — they
are convention, and the document says so. The one substantive gap is not a value
but the absence of a phase/clearance gate on this active-elevation exercise
(SF-1 / OQ-D): a change here means adding clearance copy, not moving a number.

---

## 2. Lateral abduction & full-can/empty-can (ABD-*)

**App values.** `targetAngleDeg: 90`, coronal plane, `posture: standing`,
`status: upcoming`; tip: *"Keep the palm down or slightly forward; avoid
thumb-down internal rotation."* Category: middle deltoid & supraspinatus.

**ABD-TARGET — 90° coronal abduction.** That coronal abduction recruits middle
deltoid + supraspinatus is textbook convention. That it is *provocative* is
literature-supported at the level of general biomechanics: the painful arc falls
*"in the 60–120-degree range (Where the supraspinatus tendon becomes impinged
between the greater tubercle of the humerus and the acromion … subacromial
impingement)"*
([orthofixar, Painful Arc Test](https://orthofixar.com/special-test/shoulder-painful-arc-test/),
a clinical-test reference, not a matched-population study). So 90° coronal
abduction places the arm at the *top of the painful arc* — appropriate that this
entry is `status: upcoming` and gated. **Label: clinical convention, uncited**
(the 90° target); the painful-arc provocation is a literature-supported general
fact. **Clinical steer:** prefer scaption (§3) before coronal abduction in early
phases.

**ABD-PALM — "palm down" cue.** This is where the evidence is sharpest and where
it diverges from our cue. In a controlled EMG lab study of full-can vs empty-can
vs prone-full-can — **n = 22 asymptomatic subjects, 15 men / 7 women, age
26.7 ± 7 yr, "No subject reported a history of shoulder pain, injury, or
instability"** — the supraspinatus was activated similarly in all three
(*"No statistical difference existed among the exercises for the supraspinatus"*),
but the deltoid differed: *"The middle deltoid showed significantly greater
activity during the empty-can exercise (77 ± 44% MVIC) and prone full-can
exercise (63 ± 31% MVIC) than during the full-can exercise (52 ± 27% MVIC),"*
and the authors concluded *"The full-can exercise produced significantly less
activity of the deltoid muscles and may be the optimal position to recruit the
supraspinatus muscle"*
([Reinold et al. 2007, PMC2140071](https://pmc.ncbi.nlm.nih.gov/articles/PMC2140071/)).
**Population mismatch:** healthy young adults, mean age ~27, no shoulder
pathology — not post-op shoulders. The finding tells us *thumb-up (full can)*
minimizes deltoid substitution; "palm down" is nearer neutral/mild internal
rotation and is the *less* protective option — on the plane that is *most*
provocative. That is the inconsistency the physiatrist flagged, and it is real.

**Contradicting/qualifying evidence, in the same breath.** Even "full can" does
not *isolate* supraspinatus. Verbatim from **Boettcher, Ginn & Cathers 2009**
(**n = 15 normal subjects, 13 muscles recorded**): *"Results showed that during
the EC and FC muscle tests nine and eight other shoulder muscles, respectively,
were equally highly activated as supraspinatus. It was concluded from these
results that the EC and FC tests do not primarily activate supraspinatus with
minimal activation from other shoulder muscles … They may, however, be
beneficial during shoulder muscle strengthening programs"*
([JSAMS 2009, via Europe PMC EXT_ID 19054712](https://europepmc.org/abstract/MED/19054712)).
Population: 15 normal subjects — again not post-op. So the honest reading is:
thumb-up *reduces deltoid takeover* (good reason to prefer it) but *no* forearm
rotation achieves true supraspinatus isolation.
**Label: literature-adjacent** (verified EMG source; healthy-young population,
not post-op).

**ABD-REPS/TEMPO/HOLD.** Identical to FF-* — same labels.

**Decision.** ABD-TARGET may stand as a gated (`upcoming`) default. **ABD-PALM
diverges from the evidence and should be reconciled:** the verified EMG data
favor thumb-up/full-can to minimize deltoid, so the current "palm down" cue on
the more-provocative coronal plane is the weakest cue in the catalog. Changing it
is a **copy** decision (OQ-E) owned by physiatrist + zh-tw-copywriter, not a
CONFIG change — this document only records that the current cue is not the
evidence-preferred one. A defensible alternative is to keep palm-down *only* if
the intent is deliberate middle-deltoid emphasis (then say so), or switch to
thumb-up to match scaption and the impingement literature.

---

## 3. Scaption (SCAP-*)

**App values.** `targetAngleDeg: 90`, scapular plane "~30° forward of the side,"
thumb-up; category "Supraspinatus isolation & capsular decompression";
`status: upcoming`.

**SCAP-PLANE — ~30° anterior to coronal.** The scapular plane is conventionally
described as roughly **30–45°** anterior to the coronal plane, and elevation in
it is lower-stress: reviewed shoulder-kinematics sources describe less anterior
capsular tension and the smallest glenohumeral excursion in scaption relative to
other elevation planes (Ludewig & Reed review and plane-of-elevation kinematics,
surfaced via
[PMC2857390](https://pmc.ncbi.nlm.nih.gov/articles/PMC2857390/) and the
plane-of-elevation kinematics literature). I verified the ~30–45° definition and
the "lower capsular stress / preferred early plane" characterization at the
review/summary level; I did **not** obtain a single verbatim matched-population
(post-op) sentence pinning exactly "30°." Populations in this literature are
asymptomatic or impingement cohorts, not post-op. The "~30°" in the catalog is
therefore at the conservative edge of the conventional 30–45° range — reasonable.
**Label: literature-adjacent** (well-described biomechanics; population = healthy/
impingement, not post-op; exact "30°" is a conservative convention within 30–45°).

**SCAP-THUMB — thumb-up "to prevent impingement."** Directly supported by the
same Reinold 2007 data quoted in §2: full-can (thumb-up) minimizes deltoid
activity, the mechanism behind the "clears the greater tuberosity" rationale.
The Boettcher 2009 caveat applies equally — thumb-up reduces deltoid takeover but
does not *isolate* supraspinatus. **Label: literature-adjacent.** This cue is the
evidence-preferred one, and is the reference against which ABD-PALM (§2) should be
reconciled.

**"Capsular decompression" / "minimal capsular pressure" (category & description).**
Defensible as a general biomechanical mechanism claim (scapular-plane elevation
imposes less capsular tension), not a diagnosis or healing grade — stays within
form-coach bounds. It describes an intended effect of the plane, supported at the
review level above.

**Decision.** Scaption's plane and thumb-up cue are the best-supported movement
choices in the catalog and should be **preferred/sequenced before coronal
abduction** in early phases (clinical steer, not a code change). Values stand.

---

## 4. External rotation (ER-*)

**App values.** `targetAngleDeg: 45`, elbow bent 90° at side, `posture: seated`;
category infraspinatus & teres minor; `status: upcoming`.

**ER-TARGET — 45°.** Elbow-at-side ER isolating the posterior cuff, and 45° as a
sub-maximal early target, is standard convention. I did **not** find a
matched-population source pinning "45°"; it is a moderate, teachable default.
**Safety caveat, in the same breath (SF-3):** end-range ER loads the anterior
capsule and is among the most tightly phase-restricted motions after anterior
stabilization / Bankart / subscapularis repair — some early protocols restrict ER
to 0–30° or neutral. 45° is a safe *default* only as a clinician-tunable input,
and ER must never be combined with abduction at height (the apprehension
position, SF-4). **Label: clinical convention, uncited.**

**ER-ELBOW — elbow tucked at side.** The isolation standard; keeping the elbow
adducted prevents abduction substitution. EMG literature on ER exercises exists
(e.g. Reinold et al. 2004 reported side-lying ER as a high infraspinatus/teres
minor activator), but I did **not** verify that source verbatim in this pass, so
I do not attach its numbers here. The straight clinical convention stands on its
own. A small (~10–15°) abduction towel roll is a common clinical variant (cuff
perfusion/comfort) not represented in the app — noted, not required.
**Label: clinical convention, uncited.**

**ER-REPS/TEMPO/HOLD.** Identical to FF-* — same labels.

**Decision.** ER values are defensible defaults. The load-bearing action item is
the **population caveat and clearance gate** (SF-3 / OQ-D), a copy matter, plus
keeping 45° a clinician input. No value change recommended.

---

## 5. Side-lying supraspinatus isometric hold (HOLD-*)

**App values (CONFIG side-lying block).** `HOLD_TARGET_ANGLE_DEG 12`, good band
`10–15°`; `HOLD_TARGET_S 20`, stretch goal `30`, min valid `3 s`;
`targetReps 5`; `dailySessionTarget 2`; `HOLD_ELBOW_MIN_DEG 160`;
over-elevation cue `>15°`, invalidate `>18°` sustained `2 s`; floor `5°`
(exit `7°`), abandon `4 s`, inter-set rest `5 s`. Left-side-lying, right (top)
arm, palm to thigh (neutral).

**HOLD-BAND — 10–15° / 12° ceiling — the priority question.** The *concept* —
that low-angle abduction favors supraspinatus with minimal deltoid, and that
side-lying makes gravity a short-moment-arm load — is a real, studied area. But
the specific claim the app is built on ("above ~15° the deltoid/upper-trap take
over") **is not pinned by any source I could verify.** The two EMG studies I did
verify verbatim actually *complicate* the isolation story: Reinold 2007 found the
supraspinatus was activated *no differently* across full/empty/prone-can
positions (§2), and Boettcher 2009 found *"nine and eight other shoulder muscles
… were equally highly activated as supraspinatus"* and that these positions *"do
not primarily activate supraspinatus with minimal activation from other shoulder
muscles"* (§2). Both are healthy young/normal subjects, not post-op. Neither
studies the *side-lying low-abduction hold* specifically, and neither names an
angle at which deltoid/trap "takes over." So: the de-loaded side-lying position
is a sound early-activation *choice* (convention), but the exact **10–15° band,
12° target, and the premise that 15° is where isolation breaks down is a judgment
call, unvalidated** — the CONFIG's own "n=1, no fixture corpus" admission is
accurate. **Label: judgment call, unvalidated** (the surrounding low-angle EMG
literature is adjacent but does **not** establish the 15° ceiling; do not cite it
as if it does).

**HOLD-DURATION — 20 s (stretch 30 s).** This is the best-supported dose in the
product, *for the wrong population*. Verified isometric dosing for rotator-cuff
**tendinopathy**: a registered RCT protocol prescribes *"three sets, sustained for
32 s, at 70% of maximal voluntary isometric contraction (MVIC)"* in adults 18–60
with imaging-confirmed supraspinatus/infraspinatus tendinopathy, ≥3 months of pain
([PLOS ONE protocol, pone.0293457](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0293457));
tendinopathy clinical-practice guidance surfaced in the same search cites ~5 reps
of 45–60 s, 2–3×/day, and 10–20 s holds ×3–5 series. 20–30 s sits inside that
band. **Population mismatch:** rotator-cuff *tendinopathy*, not post-op repair,
and those loaded protocols run at 40–70% MVIC while our 12° hold is far lower
load. **Label: literature-adjacent.** The stretch goal (30 s, display-only, gates
nothing) is correctly non-punitive per invariant 1.6.

**HOLD-SETS — 5 holds.** The tendinopathy dosing above repeatedly uses ~5 reps
("5 repetitions of 45–60 s"; "three sets"). 5 holds is squarely conventional.
**Label: literature-adjacent** (borderline convention; tendinopathy population).

**HOLD-FREQ — 2+/day.** The same tendinopathy guidance cites *2–3 times per day*
for isometric holds; little-and-often is the standard early-activation cadence.
**Label: literature-adjacent** (tendinopathy population).

**HOLD-POSITION — side-lying, top arm, neutral rotation.** Side-lying top-arm low
abduction as a gravity-resisted supraspinatus position, and neutral rotation
(palm to thigh) to avoid the thumb-down impingement position, are standard
convention. **Population caveat:** the exercise assumes the RIGHT shoulder is
operative; a user whose operative shoulder is the *down* (left) side would
compress it lying on it and should clear the position with a clinician (copy
should note this). **Label: clinical convention, uncited.**

**HOLD-ELBOW — 160° (straight-arm).** The straight-arm requirement is
convention (fixes the moment arm so 12° means a known load); the specific 160°
"straight enough" cutoff is a measurement default. **Label: judgment call,
unvalidated** (co-owned with measurement-engineer).

**HOLD-OVERELEV — 15° cue / 18° + 2 s invalidate.** Same underlying question as
HOLD-BAND: no source pins the deltoid/trap takeover angle. The soft-cue-then-
invalidate *gradient* is clinically appropriate (a 2° overshoot should be coached,
not punished); the *angles* are unvalidated. **Label: judgment call,
unvalidated.**

**HOLD-SETTLE / FLOOR / inter-set rest.** Mostly measurement-engineer debounce
(settle 0.7 s, floor 5°/exit 7°, abandon 4 s). The one clinically-checkable value
is the **5 s inter-set rest**: the loaded tendinopathy protocols above use much
longer rests (e.g. 80 s between 70%-MVIC sets, per the PLOS protocol). Our 5 s is
far shorter — **defensible** only because the 12° hold is a *very* low-load
activation dose, not a 70%-MVIC strength effort, so fatigue recovery demands are
correspondingly lower. **Label: judgment call, unvalidated** (5 s inter-set rest
is shorter than loaded-protocol rests; defensible on load-intensity grounds,
unvalidated for this exercise).

**Decision.** The side-lying hold's *doses* (20–30 s, 5 reps, 2+/day) are the
most literature-consistent numbers in the product and should stand as a **fixed
prescription** (OQ-H) — they are the whole point of a specific low-load
activation stimulus and should not ride the global Settings sliders. The **band
and ceiling angles (10–15° / 15° / 18°) are the least-supported clinically-
load-bearing numbers in the product** and must be treated as `placeholder/
judgment` pending a real footage corpus (OQ-J): a change requires pilot EMG or
kinematic validation, not another literature search — the literature does not
resolve the ceiling angle.

---

## 6. Recovery phases, impingement, symmetry & progression (PHASE-*)

**PHASE-STRUCTURE — 4 phases, ROM bands 0–45 / 0–90 / 90–150 / 150–180.** A
staged protection → active motion → strengthening → functional-return structure
is the standard shape of post-op shoulder protocols (convention). The **exact ROM
band cutoffs** are not sourced. More importantly, real protocols are
**time-and-criterion** based (weeks post-op *plus* milestones), not ROM-band-only
— presenting phases as ROM bands alone omits the time-since-surgery axis that
actually gates safety, and the bands are procedure-specific (RCR ≠ decompression ≠
Bankart ≠ adhesive capsulitis; OQ-C). **Label: clinical convention, uncited**
(structure); **judgment call, unvalidated** (exact band cutoffs).

**PHASE-IMPINGEMENT — "90° is a common turning point for secondary shoulder
impingement."** Two wording problems, both verifiable. (1) The literature
describes a **range**, not a single point: pain occurs *"in the 60–120-degree
range"* where the supraspinatus is compressed under the acromion
([orthofixar](https://orthofixar.com/special-test/shoulder-painful-arc-test/));
higher-arc pain (≈140–180°) points to the AC joint instead. 90° is the *middle*
of that arc, not a distinct "turning point." (2) The correct entity is
**subacromial (primary) impingement**; "secondary impingement" is a *different*
concept (impingement secondary to instability/scapular dysfunction) and is not
what a mid-arc compression describes. So the string is defensible as a general
mechanism but is **imprecise** as written. **Label: literature-adjacent** (the
painful-arc mechanism is a verified general fact; the "single 90° point" and
"secondary" wording diverge). **Form-coach note:** it stays acceptable only as a
general biomechanical statement, never as a prediction about the user's shoulder;
recommend rewording toward "the 60–120° arc is where subacromial structures are
most compressed."

**PHASE2-GATE — 20 sets + avg 90° + ≥80% clean; `isReadyForNextPhase`.**
Criterion-based progression (advance on demonstrated competence, not time alone)
is sound in principle. The specific **20 sets** and **80% clean** thresholds are
internal app metrics with **no external source** — reasonable but invented.
**Label: judgment call, unvalidated.** **Boundary risk (loudest in the
codebase):** `isReadyForNextPhase` is an app-computed boolean that reads as "you
may advance your rehab" — clearance/prognosis-adjacent (invariant 7). Phase 3→4
correctly requires *"a physical therapist's assessment"*; Phase 2→3 should read
the same way. A movement-quality gate is a defensible *supplementary* signal, but
never a substitute for clinician clearance or healing time (OQ-A).

**PHASE4-SYMMETRY — ≥90% bilateral strength symmetry + pain-free full ROM.** The
90% limb-symmetry-index (LSI) threshold originates in **lower-limb / ACL
return-to-sport** literature and is *applied* to the shoulder mainly in
return-to-sport / instability contexts (e.g. isokinetic passing scores set at 90%
of the non-operative shoulder), with some authors arguing thresholds nearer 96%
better predict success and that hand dominance complicates upper-limb LSI
([JOSPT upper-extremity RTS commentary](https://www.jospt.org/do/10.2519/jospt.blog.20250714/full/),
403 on direct fetch; characterization corroborated across the RTS literature).
**Population mismatch:** athletes returning to sport, not general at-home post-op
rehab — and Rehabibi is a single-arm form coach that **cannot measure bilateral
strength at all**, so this criterion is informational/aspirational only and must
never read as something the app verifies. **Label: literature-adjacent** (verified
origin in lower-limb/RTS literature; population and even measurability mismatch).

**PHASE-MISC — scapulohumeral rhythm ~2:1; protect tissue early; posture.** The
2:1 glenohumeral:scapulothoracic ratio above ~30° of elevation is the textbook
convention from Inman, Saunders & Abbott (1944): ~120° GH + ~60° scapulothoracic
across full elevation — with the important modern caveat that later studies show
substantial individual variability and challenge a single constant ratio
([Physiopedia / kinematics literature](https://www.physio-pedia.com/Scapulohumeral_Rhythm)).
The Phase-1 "avoid over-stretching the healing tissue" note does **not** conflict
with early-PROM protocols — protect ≠ immobilize; the RCR review above endorses
*early passive* motion, and "over-stretching" refers to aggressive end-range, not
gentle PROM. **Label: clinical convention, uncited** (2:1 is textbook with noted
modern variability).

**Decision.** The phase *structure* is a reasonable educational scaffold and may
stand **if** reframed as illustrative and clinician-overridable (OQ-C) rather than
a schedule. Two strings should be reworded on evidence grounds (not deleted):
PHASE-IMPINGEMENT (range not point; "subacromial" not "secondary") and any UI that
renders `isReadyForNextPhase` as authorization (make it a practice-milestone,
require clinician assessment for 2→3). PHASE4-SYMMETRY should be explicitly framed
as clinician-measured, not app-measured. These are copy/UX decisions escalated in
Open Questions; no CONFIG value changes.

---

## 7. Compensations / FormFlags (FLAG-*)

The detection math is the kinematicist's and the thresholds are the
measurement-engineer's; this section assays only whether each flag names a
*genuine, recognized compensation*.

- **FLAG-HIKE (SHOULDER_HIKE)** — upper-trapezius substitution / scapular
  elevation is the textbook primary compensation in cuff and deltoid rehab and is
  this product's headline observable. **Label: clinical convention, uncited.**
  (Threshold 0.18/0.22 = measurement-engineer, not assayed here; see §9.)
- **FLAG-LEAN (TORSO_LEAN)** — trunk lean/lateral flexion to substitute for
  glenohumeral elevation is a recognized cheat. **Label: clinical convention,
  uncited.**
- **FLAG-ELBOW (ELBOW_BENT)** — shortening the lever to offload the target muscle
  is a recognized way to cheat elevation/hold load; two thresholds (paced 115°,
  hold 160°) correctly reflect two different exercises. **Label: clinical
  convention, uncited.**
- **FLAG-RUSHED_CONCENTRIC / RUSHED_ECCENTRIC** — using momentum, especially
  "dropping" the eccentric, to avoid continuous cuff/scapular control is a
  recognized fault; eccentric-control literature is adjacent (§1, FF-TEMPO).
  **Label: clinical convention, uncited** (eccentric emphasis: literature-adjacent,
  tendinopathy population).
- **FLAG-INCOMPLETE_HOLD** — not a "compensation" but an incomplete effort;
  clinically often *fatigue or inability*, not cheating, so copy must stay
  non-punitive (a ≥3 s hold is still a valid recorded effort, invariant 1.6).
  **Label: clinical convention, uncited.**
- **FLAG-PACING_TOO_FAST** — overlaps the real momentum concern.
  **Label: clinical convention, uncited.**
- **FLAG-PACING_TOO_SLOW** — **not** a genuine fault for this population. Slower
  than target is generally protective, and a stiff/painful (adhesive capsulitis,
  early post-op) shoulder may *need* to move slowly; flagging "too slow" risks
  nudging a cautious user to move faster than is safe. No clinical basis for
  treating it as an error here. **Label: judgment call, unvalidated** — recommend
  demotion to neutral/informational (OQ-F).
- **FLAG-OVER_ELEVATION** — a genuinely new observable for the hold (exceeding the
  low ceiling recruits deltoid/upper trap and defeats the low-angle intent);
  dead-but-typed on the paced entries. Its *reality as a compensation* is sound,
  but the *angle* at which it fires is the unvalidated 15/18° question of §5.
  **Label: judgment call, unvalidated** (concept literature-adjacent; ceiling
  angle unvalidated).

**Decision.** The compensation *set* is clinically genuine and well-chosen.
PACING_TOO_SLOW is the one flag whose *existence as a fault* is not defensible for
this population and should be demoted (OQ-F). All threshold *values* are
measurement-engineer property and are addressed as placeholders in §9.

---

## 8. Model separation & the active-elevation-timing safety question

**SEP-MODEL / SEP-PHASE1.** Modeling the low-ceiling hold as its own state
machine (target = ceiling, "higher peak = fault") rather than degenerately
reusing the paced machine (target = floor, "higher = better") is a correct
clinical-reasoning call, enforced in code by `isIsometricSession()` filtering
holds out of the Phase-2 elevation aggregates. That low-load pain-free isometric
activation belongs to an **early/acute-protection phase** (Phase 1) rather than a
mid-range active phase is standard staging — RCR protocols place isometrics early
and defer active elevation (see below), and tendinopathy guidance starts with
isometric holds. **Label: judgment call, unvalidated** (SEP-MODEL, a design
decision); **clinical convention, uncited** (SEP-PHASE1 staging).

**The active-elevation-timing safety question (SF-1) — the most important
finding in this document.** After rotator cuff repair, active elevation is
deferred: the RCR literature review states patients achieve *"early passive
mobilization and active range of motion at four to six weeks without compromise
of tendon repair integrity"*
([PMC12537514](https://pmc.ncbi.nlm.nih.gov/articles/PMC12537514/), review;
post-RCR population — matches Rehabibi), with accelerated protocols introducing
PROM at 2–4 weeks and active/active-assisted ROM by 4–6 weeks. **Label:
literature-supported** (matching post-RCR population) — active elevation is
phase-gated in the literature. Four of six catalog exercises are active
elevation/rotation and carry **no** clinician-clearance line (only the side-lying
hold does). This is not a wrong *number* — it is a missing *gate*, and it is the
single change most worth making for an unsupervised post-op user (OQ-D). A
movement-quality gate (clean-rep rate) is a defensible *supplementary* progression
signal but must never override time-since-surgery or clinician clearance
(OQ-A/OQ-C).

---

## 9. Cross-cutting numeric defaults (paced state-machine internals)

Measurement-engineer-owned, listed so nothing is unattributed:

- **`ASCENDING_TIMEOUT_S 7.0` (5 s + 2 s arrival window).** No literature; CONFIG
  self-labels n=1 (author's own shoulder). Clinical concern (physiatrist): a
  stiff/frozen or early post-op shoulder may not arrive within 2 s and would have
  its rep discarded — biasing against exactly the slowest, most cautious users.
  **Label: judgment call, unvalidated** — re-check against a stiffer, non-author
  shoulder.
- **`TARGET_HOLD_MAX 115.0`.** The paced "still counts as a hold" ceiling; must be
  bounded by the clinician's phase-appropriate ROM, not geometry (SF-6). **Label:
  judgment call, unvalidated.**
- **Compensation thresholds** (`SHOULDER_HIKE_RATIO 0.18/0.22`,
  `TORSO_LEAN_DEG 16.0`, `ELBOW_MIN_DEG 115`, `ELBOW_REACH_RATIO 0.78`, and the
  entire side-lying block). All n=1, author-tuned, loosened toward false
  negatives per CONFIG comment. For an *unsupervised* user a *missed* shrug is
  practiced into the motor pattern — the more expensive error — and a 0.18 ratio
  catches a pronounced shrug, not the smaller clinically-meaningful trap
  substitution. Nothing to cite; this needs a validation corpus, not literature.
  **Label: placeholder, pending pilot data** (flag to measurement-engineer /
  qa-engineer).

---

## Provenance label table (final)

| Claim ID | Claim (short) | App value | Final label |
|---|---|---|---|
| FF-TARGET | 90° forward flexion target | 90° | clinical convention, uncited |
| FF-HOLD | end-range hold | 5 s | clinical convention, uncited (5 s value: judgment call) |
| FF-TEMPO | 5-5-5 cadence | 5/5/5 s | judgment call, unvalidated (eccentric principle: lit-adjacent) |
| FF-REPS | reps / inter-rep rest | 10 / 3 s | clinical convention (10); judgment call (3 s rest) |
| FF-POSTURE | seated upright variant | seated | clinical convention, uncited |
| ABD-TARGET | 90° coronal abduction | 90° | clinical convention, uncited (painful-arc provocation: lit-supported) |
| ABD-PALM | palm-down cue | palm down | literature-adjacent (evidence favors thumb-up; healthy-young pop.) |
| SCAP-PLANE | scapular plane ~30° | 30° | literature-adjacent (healthy/impingement pop.; 30–45° convention) |
| SCAP-THUMB | thumb-up full-can | thumb up | literature-adjacent (healthy-young pop.) |
| ER-TARGET | 45° external rotation | 45° | clinical convention, uncited |
| ER-ELBOW | elbow tucked at side | elbow 90° at side | clinical convention, uncited |
| HOLD-BAND | 10–15° band / 12° ceiling | 12°, 10–15° | judgment call, unvalidated (EMG lit adjacent, does not pin 15°) |
| HOLD-DURATION | 20 s hold / 30 s stretch | 20 / 30 s | literature-adjacent (tendinopathy pop., not post-op) |
| HOLD-SETS | holds per session | 5 | literature-adjacent (tendinopathy pop.) |
| HOLD-FREQ | sessions per day | 2+ | literature-adjacent (tendinopathy pop.) |
| HOLD-POSITION | side-lying, top arm, neutral | — | clinical convention, uncited |
| HOLD-ELBOW | straight-arm cutoff | 160° | judgment call, unvalidated |
| HOLD-OVERELEV | over-elevation cue/invalidate | 15° / 18° / 2 s | judgment call, unvalidated |
| HOLD-SETTLE/FLOOR | settle/floor/rest debounce | 0.7 / 5 / 7 / 4 / 5 s | judgment call, unvalidated (5 s inter-set rest defensible on load) |
| PHASE-STRUCTURE | 4 phases, ROM bands | 0–45/0–90/90–150/150–180 | clinical convention (structure); judgment call (band cutoffs) |
| PHASE-IMPINGEMENT | "90° secondary impingement" | Phase 2 note | literature-adjacent (arc is a range; "subacromial" not "secondary") |
| PHASE2-GATE | 20 sets + 80% clean gate | 20 / 80% | judgment call, unvalidated |
| PHASE4-SYMMETRY | ≥90% bilateral symmetry | 90% LSI | literature-adjacent (lower-limb/ACL origin; app can't measure) |
| PHASE-MISC | scapulohumeral rhythm etc. | ~2:1 | clinical convention, uncited (2:1 textbook; modern variability) |
| FLAG-HIKE | shoulder hike | — | clinical convention, uncited |
| FLAG-LEAN | torso lean | — | clinical convention, uncited |
| FLAG-ELBOW | elbow bent | — | clinical convention, uncited |
| FLAG-RUSHED_* | rushed concentric/eccentric | — | clinical convention, uncited (eccentric: lit-adjacent) |
| FLAG-INCOMPLETE_HOLD | incomplete hold | — | clinical convention, uncited |
| FLAG-PACING_TOO_FAST | tempo too fast | — | clinical convention, uncited |
| FLAG-PACING_TOO_SLOW | tempo too slow (as fault) | — | judgment call, unvalidated (recommend demotion) |
| FLAG-OVER_ELEVATION | over-elevation fault | — | judgment call, unvalidated (concept lit-adjacent; angle unvalidated) |
| SEP-MODEL | two tracking models | — | judgment call, unvalidated (design) |
| SEP-PHASE1 | hold = Phase-1 item | — | clinical convention, uncited |
| SF-1 / active-elevation timing | active elevation deferred ~4–6 wk post-RCR | (no app gate) | literature-supported (post-RCR pop.) — gate is MISSING |
| ASCENDING_TIMEOUT_S | arrival window | 7.0 s (5+2) | judgment call, unvalidated |
| TARGET_HOLD_MAX | paced hold ceiling | 115° | judgment call, unvalidated |
| COMPENSATION thresholds | shrug/lean/elbow ratios | 0.18/0.22/16°/115°/0.78 | placeholder, pending pilot data |

**Tally by bucket:**
- **literature-supported:** 1 (SF-1 active-elevation timing, the *fact*; the app's
  missing gate is the gap).
- **literature-adjacent:** 9 (ABD-PALM, SCAP-PLANE, SCAP-THUMB, HOLD-DURATION,
  HOLD-SETS, HOLD-FREQ, PHASE-IMPINGEMENT, PHASE4-SYMMETRY, + the eccentric
  principle behind FF-TEMPO/FLAG-RUSHED).
- **clinical convention, uncited:** 15 (FF-TARGET, FF-HOLD, FF-POSTURE,
  FF-REPS[10], ABD-TARGET, ER-TARGET, ER-ELBOW, HOLD-POSITION, PHASE-STRUCTURE
  [structure], PHASE-MISC, SEP-PHASE1, FLAG-HIKE, FLAG-LEAN, FLAG-ELBOW,
  FLAG-INCOMPLETE_HOLD/FLAG-PACING_TOO_FAST).
- **judgment call, unvalidated:** 13 (FF-TEMPO[5-5-5], FF-REPS[3 s rest],
  HOLD-BAND, HOLD-ELBOW, HOLD-OVERELEV, HOLD-SETTLE/FLOOR, PHASE-STRUCTURE
  [band cutoffs], PHASE2-GATE, SEP-MODEL, FLAG-PACING_TOO_SLOW,
  FLAG-OVER_ELEVATION, ASCENDING_TIMEOUT_S, TARGET_HOLD_MAX).
- **placeholder, pending pilot data:** 1 cluster (all CONFIG compensation
  thresholds + the CONFIG-admitted n=1 side-lying block).

(Several claims carry a split label — the primary bucket is counted above; the
secondary qualifier is stated in the table row.)

---

## Open Questions

Carried forward verbatim in intent from the physiatrist inventory (OQ-A..OQ-J),
plus what the literature could not resolve.

- **OQ-A — Does `isReadyForNextPhase` / a shown "recovery phase" cross the
  form-coach line?** An app-computed "you may advance" boolean is
  clearance/prognosis-adjacent (invariant 7). Reframe all phase/readiness UI as
  practice-milestone tracking; make Phase 2→3 require clinician assessment as
  Phase 3→4 already does. **Needs product + physiatrist + legal.**
- **OQ-B — Where does the Phase-1 hold live on a dashboard hardcoded to Phase 2?**
  Correctly excluded from Phase-2 stats but has no phase home; surface it under a
  Phase-1/activation adherence view (`calculateHoldAdherence`). **Needs product +
  physiatrist.**
- **OQ-C — Single-timeline phase model vs multi-procedure population.** RCR,
  decompression, labral/Bankart repair, and adhesive capsulitis do not share one
  ROM/timeline. Procedure-tag the phases or label them explicitly
  illustrative-and-clinician-overridable. **Needs product + clinician.**
- **OQ-D — Active-elevation exercises lack the clearance gate the hold has
  (SF-1).** Literature-supported that active elevation is deferred ~4–6 weeks
  post-RCR; add an equivalent clearance line + procedure caveat to FF/ABD/SCAP/ER.
  **Needs physiatrist (clinical meaning) → zh-tw-copywriter (wording) + product.**
- **OQ-E — Abduction vs scaption cue conflict (palm-down vs thumb-up).** Verified:
  the evidence favors thumb-up/full-can to minimize deltoid; the more-provocative
  coronal plane currently carries the less-protective cue. Reconcile the ABD cue
  (keep palm-down only if deliberate middle-deltoid emphasis is intended and
  stated; otherwise switch to thumb-up). **Copy decision, physiatrist +
  copywriter.**
- **OQ-F — PACING_TOO_SLOW as a fault.** Too-slow is protective for a stiff/post-op
  population; recommend demotion to neutral/informational. **Needs product.**
- **OQ-G — `peakElevation` overloaded (achievement vs fault).** Data-model, not
  clinical; any new elevation-averaging surface must apply the `isIsometricSession`
  guard. **Confirm acceptable vs a dedicated isometric record type.**
- **OQ-H — Fixed vs tunable hold dose.** Recommend the 20–30 s / 5-hold dose stay
  a **fixed** prescription (the doses are the best-supported numbers in the
  product; that is the whole point of a specific activation stimulus), not driven
  by global Settings sliders. **Confirm with product.**
- **OQ-I — Side-lying framing assumes an upright, camera-facing subject.** A
  horizontal subject on a mat is a real measurement + UX concern; a mismeasured
  angle on a healing shoulder is the "silently wrong number the user trains into."
  **Flag to ux-designer + measurement-engineer.**
- **OQ-J — Ceiling hardness / band angles.** The soft-cue-then-invalidate gradient
  is clinically appropriate, but **the literature does not resolve the 10–15° band
  or the 15/18° takeover angle** — these need a pilot EMG/kinematic corpus, not
  another literature search. Treat as unvalidated until then. **Needs
  measurement-engineer + physiatrist + pilot data.**

### What the literature could not resolve (do not re-search — validate instead)
- The abduction angle at which deltoid/upper-trapezius contribution "takes over"
  from supraspinatus (HOLD-BAND / HOLD-OVERELEV / FLAG-OVER_ELEVATION). Verified
  EMG studies (Reinold 2007; Boettcher 2009, both healthy young/normal) show the
  supraspinatus is *not* selectively isolated at any tested position and name no
  takeover angle. This is a pilot-data question.
- Any matched-population (post-op RCR, at-home) source for the specific dose
  numbers (90°, 5-5-5, 10 reps, 20–30 s, 5 holds, 2×/day). All matching evidence
  is either general convention or drawn from *tendinopathy* cohorts. The doses are
  defensible; they are not post-op-validated.
- The 20-sets / 80%-clean progression thresholds and the ROM band cutoffs — purely
  internal, unsourced by design.

---

*All sources above were verified against the actual abstract or source text.
Where a host blocked direct fetch (PubMed cookie wall; ScienceDirect/JOSPT 403;
binary protocol PDFs), the quote was obtained through Europe PMC's REST API or an
alternate host and is marked as such; where only a summary-level characterization
was obtainable, the claim is described as characterized, not quoted, and labeled
accordingly. No study, guideline, or number has been attributed to a source not
read.*
