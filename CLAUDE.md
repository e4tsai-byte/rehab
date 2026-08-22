# Rehabibi — System Invariants & Developer Guide

Non-negotiable engineering rules and system architecture for **Rehabibi**, a
private, in-browser computer-vision coach for at-home shoulder rehabilitation.

This document is a **contract, not a description**. If the code and this file
disagree, one of them is a bug — decide which, then fix that one.

> **This repo ships one product.** Until 2026-08-21 it also carried *velocare*,
> a supervised 5x sit-to-stand assessment instrument for Taiwanese elder-care
> centres. That product was deleted. Its full history is on the
> `velocare-archive` branch and the `velocare-final-state` tag. See §7.

---

## 1. Non-Negotiable Invariants

Each invariant names the agent who enforces it (see `AGENTS.md`). An invariant
with no enforcer is negotiable by default, which defeats the point.

### 1. 100% Privacy by Design — *enforced by privacy-auditor (blocking)*

* Camera frames must NEVER be stored, logged to disk, uploaded, or retained.
* All pose estimation and kinematic computation runs strictly client-side via
  in-browser `@mediapipe/tasks-vision` (WebAssembly + WebGL).
* **What does persist:** rep records and user settings, in `localStorage`, on
  the user's own device (`src/data/rehabStore.ts`). Nothing else. No landmark
  arrays, no frames, no derived imagery, no identity fields of any kind.
* There is no backend. The app must remain fully functional with the network
  disconnected. A remote request from a rehab surface is a defect.

### 2. Deterministic Kinematic Computation — *enforced by kinematicist*

* All angles and compensation triggers are computed with transparent vector
  mathematics in `src/pose/shoulderKinematics.ts`.
* No probabilistic or generative estimation of joint angles or rep counts.
* Every angle function carries a written definition above it: which two vectors,
  in which frame, and what 0° and 90° mean on a human body.
* Degeneracies (zero-norm vectors, occluded hips, missing landmarks) are handled
  explicitly. A silently wrong number is the worst failure this product has,
  because the user will train into it.

### 3. Deterministic Rep/Hold State Machines — *enforced by measurement-engineer*

* Rehabibi has **exactly two** session models, each a deterministic,
  explicitly-named state machine. An exercise selects one via its
  `trackingModel` catalog field. **No third model without amending this
  invariant in writing.** (This invariant was widened from a single machine on
  2026-08-21 to admit the isometric-hold model — see §9.)

  1. **Paced elevation** — `trackingModel: 'pacedElevation'` (forward flexion,
     lateral abduction, scaption). One machine:
     `RESTING → ASCENDING → HOLDING → DESCENDING → RESTING`, with cadence-graded
     concentric and eccentric phases. Enforces a post-rep rest interval
     (`CONFIG.REST_BETWEEN_REPS_S`) and a descent-settle trigger. Implemented by
     `ClientShoulderFlexionTracker`. Higher elevation up to a max is *good*.

  2. **Isometric hold** — `trackingModel: 'isometricHold'` (low-load timed
     holds, e.g. side-lying supraspinatus). One machine: `READY → HOLDING →
     READY`. There is no cadence phase: the movement is not raise-hold-lower, it
     is settle-into-band-and-hold. One completed hold is one *set*. Enforces a
     post-hold rest interval from `CONFIG` and a band-settle trigger that must be
     satisfied before the hold timer accumulates. The target elevation is a
     **ceiling**: rising above the band is a form fault (`OVER_ELEVATION`), the
     inverse of model 1.

* **Every state in BOTH machines must be provably unstickable.** For each state,
  name both the condition that exits it and the timeout that exits it anyway.
* Thresholds live in `CONFIG` and nowhere else. Do not restate a threshold's
  value in prose — this document pins *structure*, `CONFIG` pins *values*.
* Both machines emit `RehabRepRecord`, so no storage-schema change is required.
  The isometric model writes `concentricDuration = eccentricDuration = 0` and
  reuses `peakElevation` to carry the peak abduction reached during the hold —
  which, for a ceilinged hold, is a **fault** signal, not an achievement. Any
  surface that reads `peakElevation` or `avgElevationDeg` as "higher is better"
  is wrong for this model, so isometric-hold sessions must never be pooled into
  the elevation/recovery stats. This is **enforced** in `recoveryMilestones.ts`:
  `isIsometricSession()` filters them out of `calculateRecoveryProgress` (the
  Phase-2 track), and they are surfaced separately via `calculateHoldAdherence`.
  Any new elevation-averaging surface must apply the same guard.

### 4. Dual-View Support — *enforced by kinematicist + physiatrist*

* `posture` is `'standing' | 'seated' | 'sideLying'`. Every exercise ships a
  catalog entry for each view it supports and declares unsupported views
  explicitly. (`sideLying` was added 2026-08-21 for the supraspinatus hold — §9.)
* **The `isSeated: boolean` convention is retired.** A boolean cannot express
  three orientations, and coercing `sideLying` onto the seated branch would
  silently select an upright-subject gravity fallback for a *horizontal* body —
  precisely the "silently wrong number the user trains into" that invariant 2
  forbids. Every kinematic function that consumes hip landmarks takes the
  `posture` value (or a reference-frame descriptor derived from it) and has a
  defined degenerate-hip fallback **per view**. A geometry function that ignores
  `posture` is a defect.
* Any threshold that differs between views is a named per-view set in `CONFIG`
  (`_STANDING` / `_SEATED` / `_SIDE_LYING` as applicable), never a single shared
  constant. A view an exercise does not support needs no constant for that view.
* **Behavior-preservation clause.** Widening `posture` and retiring `isSeated`
  must leave the `standing` and `seated` numeric outputs **byte-identical** —
  there is still no kinematic test corpus (§3, KNOWN GAP), so the standing/seated
  branches are re-labeled, not re-derived. `sideLying` is added as new branches
  only; a manual before/after run on the existing two views is the acceptance
  gate until the corpus exists.

### 5. One Product — *enforced by architect*

* This repo ships Rehabibi only. No file under `src/` may reference sit-to-stand
  assessment, participant rosters, trials, staff facilitators, or velocare.
* No second design system, no second data-source layer, no second *product*.
  (The bilingual `src/i18n/` layer added 2026-08-21 is Rehabibi's own single
  localization layer — see §4 — not a second string table in this sense.)

### 6. Copy Tone (zh-TW) — *enforced by zh-tw-copywriter*

Preserved verbatim from the deleted `src/i18n/strings.ts`, which was its only
home. It is a clinically-weighted design position, not a style preference.

* Dignified. No cheerfulness, no encouragement, no exclamation marks.
* A finished session reads 完成. Never 停止, never 加油, never 太棒了.
* **Someone who manages three reps has a valid recorded outcome, and the copy
  must not suggest they broke something.**
* Corrective copy names the observable action, not the person's failure:
  「肩膀放鬆下沉」, not 「你聳肩了」.

### 7. Form Coach, Not a Medical Device — *enforced by physiatrist*

* Rehabibi provides form feedback and adherence tracking for movements a
  clinician has already prescribed.
* It does not diagnose, does not prescribe, does not assess healing, and is not
  a substitute for in-person physical therapy.
* No screen, alert, score, or document may be worded so as to imply a clinical
  judgement.

---

## 2. Project Structure

**Anything not listed here does not exist. Adding a file to `src/` without
adding it here is a defect.** That sentence is what makes this a contract rather
than a snapshot, and its absence is why the previous version drifted so far.

```
rehab/
├── index.html                     # Vite entry. Dark color-scheme; inline favicon.
├── AGENTS.md                      # The 12-agent roster and its boundaries
├── docs/decisions/                # Archived decision records (see §7)
├── src/
│   ├── main.tsx                   # React root, wrapped in LocaleProvider. Owns stylesheet load order (§5).
│   ├── App.tsx                    # State router: Dashboard → Training → Summary
│   ├── i18n/                      # The zh/en locale layer (see §4)
│   │   ├── locale.ts              # Locale type, browser detection, <html lang> map
│   │   ├── uiStrings.ts           # UI-chrome string table (zh + en), typed for completeness
│   │   ├── LocaleContext.tsx      # LocaleProvider + useT() hook (locale, setLocale, t)
│   │   └── datetime.ts            # Intl-based date/month/weekday formatting per locale
│   ├── domain/
│   │   ├── rehabTypes.ts          # Phases, FormFlags, RepRecords, UserSettings
│   │   ├── recoveryMilestones.ts  # Recovery phases (+localizePhase), calendar, recent stats
│   │   ├── exerciseCatalog.ts     # Exercise library, bilingual copy + localizeExercise (see §4)
│   │   ├── routineCatalog.ts      # Multi-exercise menus, bilingual copy + localizeRoutine
│   │   └── assets.ts              # assetUrl() — base-aware public asset paths (GitHub Pages subpath)
│   ├── pose/
│   │   ├── shoulderKinematics.ts  # 3D vector geometry, CONFIG, BOTH rep/hold state machines (§3)
│   │   └── __tests__/             # node:test corpus — geometry.test.ts, sideLyingHold.test.ts (§3)
│   ├── data/
│   │   └── rehabStore.ts          # localStorage only. Rep records + settings.
│   ├── hooks/
│   │   ├── usePoseTracker.ts      # MediaPipe PoseLandmarker vision loop
│   │   ├── useChime.ts            # Web Audio metronome and cues
│   │   └── useBodyScrollLock.ts   # Body scroll locking for modal overlays
│   ├── components/
│   │   ├── RehabHeader.tsx        # Header: tab navigation, streak badge, settings
│   │   ├── ExerciseCard.tsx       # Routine card and start CTA
│   │   ├── ExerciseVideoCard.tsx  # YouTube-style 16:9 exercise card
│   │   ├── RoutineVideoCard.tsx   # Multi-exercise routine playlist card
│   │   ├── ExerciseDetailModal.tsx # Exercise inspection sheet & motion diagram
│   │   ├── RoutineDetailModal.tsx # Routine inspection sheet & station sequence
│   │   ├── CustomRoutineBuilderModal.tsx # Doctor custom routine builder modal
│   │   ├── RecoveryRoadmap.tsx    # 4-stage clinical recovery milestone tracker
│   │   ├── ActivityCalendar.tsx   # Calendar tracking streaks & rest days
│   │   ├── RecentStatsGrid.tsx    # 7-day / 30-day clinical analytics grid
│   │   ├── SettingsModal.tsx      # Target angle, hold duration, reps
│   │   ├── AngleGauge.tsx         # Circular SVG goniometer with target band
│   │   ├── CadencePacer.tsx       # Cadence bar, hold countdown, rest ring
│   │   ├── RepPips.tsx            # One slot per prescribed rep
│   │   ├── Digits.tsx             # Fixed-cell numeric primitive
│   │   └── FormAlertBanner.tsx    # Live compensation warnings
│   ├── surfaces/
│   │   ├── RehabDashboard.tsx     # Overview, recovery roadmap, calendar, stats, history
│   │   ├── ExerciseLibrary.tsx    # YouTube-style visual exercise & routine library
│   │   ├── RehabTraining.tsx      # Fullscreen live coaching surface
│   │   └── SessionSummary.tsx     # Post-session form quality scorecard
│   └── styles/                    # See §5 — load order is significant
│       ├── tokens.css             # THE palette. Dark polarity.
│       ├── base.css               # Reset, focus, Digits primitive
│       ├── telemetry.css          # Gauge, pacer, form-alert, pips
│       └── rehab.css              # Everything else
└── package.json
```

---

## 3. Development Workflow

```bash
# Typecheck — the real gate. Catches every broken import.
npm run typecheck

# Unit tests — node:test runner over the pose corpus (§3)
npm test

# Local dev server
npm run dev

# Production bundle (runs typecheck first)
npm run build

# Proves invariant 1: no network, served under a deployed subpath.
# Aborts every non-local request, so one reintroduced CDN reference fails it.
node tools/offline-test.mjs
```

> **KNOWN GAP — the most important thing on this page.**
> `src/pose/shoulderKinematics.ts` now has a **partial** test suite, run with
> `npm test` (the native `node:test` runner over `src/pose/__tests__/`). It
> covers the geometry layer — `computeShoulderFlexion3D` across all three
> postures plus its degeneracy fallbacks — and the isometric-hold state machine
> (`ClientSideLyingHoldTracker`) end to end, including settle-gate, over-
> elevation, incomplete-hold, and pose-lost-timeout sequences.
>
> **What is still uncovered:** the paced-elevation rep machine
> (`ClientShoulderFlexionTracker`) has no sequence tests — no ascending/holding/
> descending/rest walk-through asserting rep counts and cadence flags. Until
> that exists, **no `CONFIG` constant the paced machine depends on may change
> without a manual before/after run recorded in the PR**, stating which reps
> changed classification. Extending the corpus to the paced machine is
> qa-engineer's standing first task. (The velocare Python suite in `pose/tests/`
> was deleted with that product and never touched this code.)

---

## 4. Copy and Localization

**Rehabibi is bilingual: Traditional Chinese (`zh`, zh-TW) and English (`en`.)**
Added 2026-08-21 — the second locale is the moment the earlier single-locale
version said an i18n layer should be *designed*, not inherited. There are two
homes for copy, and the split is deliberate:

* **UI chrome** (labels, buttons, headings, live cues) lives in
  `src/i18n/uiStrings.ts` as a keyed table with a `zh` and `en` entry for every
  key. The English table is typed against the Chinese keys, so a missing
  translation is a **compile error**, not a silent fall-through. Read it with
  `useT()` → `t('some.key', { vars })`; `{token}` placeholders interpolate.
* **Domain copy** (what a specific exercise / routine / recovery stage says)
  still lives beside its data in `domain/` — now as paired fields (`descriptionZh`
  / `descriptionEn`, `tipsZh` / `tipsEn`, …). Components never branch on locale
  themselves: they call the one selector per catalog — `localizeExercise`,
  `localizeRoutine`, `localizePhase` — and read plain `.name` / `.description`.

The chosen locale is detected from the browser on first visit (en-* → English,
zh-* or anything else → Chinese) and persisted in `localStorage` through
`rehabStore.loadLocale` / `saveLocale` — localStorage access stays centralised
there (invariant 1). `LocaleProvider` (in `main.tsx`) also keeps `<html lang>`
in sync. The switch is in the header (中 / EN) and in Settings.

**Invariant 1.6 governs the tone of every string in both languages** — the
English is written to the same clinical, dignified register as the Chinese
(no cheerfulness, no exclamation marks, name the observable action not the
person's failure). The `flag.*` keys in `uiStrings.ts` are where the old
`FormAlertBanner` FLAG_MESSAGES moved to; they remain instruction, not verdict.

Custom doctor routines are authored once, in one language, through the builder;
their typed text is written to both `*Zh` and `*En` slots, and `localizeRoutine`
falls back to the author's text when an English field is absent (older stored
routines). Recorded sessions still store only `exerciseNameZh`; the display name
is re-resolved from the catalog by id via `resolveExerciseName`, so no storage
migration was needed.

The 713-line `src/i18n/strings.ts` that used to exist belonged entirely to
velocare — no Rehabibi surface ever imported it — and went with it. The current
`src/i18n/` is a fresh, Rehabibi-only layer and shares nothing with it.

---

## 5. Styling Ownership

Load order is set in `main.tsx` and **must not be reordered casually**:

```
tokens.css → base.css → telemetry.css → rehab.css
```

* **`tokens.css`** is the ONLY place design tokens are defined, and its polarity
  is **LIGHT** — Apple system materials on a cool near-white ground. A token
  defined anywhere else is a defect. The light choice is load-bearing rather
  than aesthetic: the screen acts as a fill light for the webcam, and MediaPipe's
  landmark confidence rises with subject exposure. A dark UI in a dark room hands
  the tracker an underlit subject. See `DESIGN.md` section 1.
* **`base.css`** — reset, the ambient field, focus, glass primitives, buttons,
  and the Digits primitive. Consumes tokens, defines none.
* **`telemetry.css`** — angle HUD, cadence pacer, form alert, rep pips.
* **`rehab.css`** — everything else, including every breakpoint.

**The three material rules that carry the design:**

1. **Never stack a light translucent surface on another.** Ground is solid, cards
   are glass over it, chrome is glass over cards. Solid cards *inside* glass are
   correct and are how spec pills, setting rows, and the pacer are built. Glass
   inside glass is a defect: the blur has nothing true to sample.
2. **Everything over the camera feed is dark.** Every light accent fails contrast
   against a blown-out video frame — blue 4.23, green 3.15, orange 2.79. The dark
   scrim at 0.72 alpha is the only tier that passes at both frame extremes.
3. **Accents have two tiers.** Plain (`--rehab-blue`) for graphical objects only;
   `-deep` for anything that is text or carries white text. White on plain blue
   measures 4.23 and fails.

**Verify with the harness, not by eye:**

```bash
npm run build && npx vite preview --port 4173 &
node tools/audit.mjs
```

It walks every surface in a live browser and reports contrast **against the real
composite backdrop**, tap targets under 44px, and nested-glass violations. Static
palette maths is not sufficient — it passed `--rehab-orange-deep` at 4.50 on
white, and the live audit then measured it at 3.93 on its own wash over glass.

`node tools/shoot.mjs <label>` captures every surface at three viewports with a
fake camera device.

## 6. Deployment

GitHub Pages, via `.github/workflows/pages.yml`, on push to `main`.

The trigger previously pointed at a branch named `UI/UX` which does not exist,
so no deploy had ever run. Fixed 2026-08-21; `workflow_dispatch` added so it can
be run by hand.

---

## 7. The velocare Removal (2026-08-21)

This repo previously contained two products fused together. velocare — a
supervised 5x sit-to-stand assessment instrument for Taiwanese community
elder-care centres, with a staff facilitator, participant roster, printed
result sheet, and a Python pose pipeline — was deleted.

* **Recovery:** branch `velocare-archive`, tag `velocare-final-state`.
* **Preserved:** `docs/decisions/velocity-loss-decision-research.md`, carrying a
  provenance banner. Not a Rehabibi document; kept because it is the worked
  example of the evidence standard in `.claude/agents/evidence-analyst.md` — it
  caught its own citation error and reported its own sources' population
  mismatch.
* **What the deletion required first:** extracting the telemetry rules out of
  `app.css` (§5) and lifting the zh-TW tone invariant out of `i18n/strings.ts`
  (invariant 1.6). Both files were load-bearing for the live product in ways
  their names did not suggest.

---

## 8. Tooling Note

`.claude/settings.json` installs a `PreToolUse` hook that **denies every `Skill`
invocation** unless `gstack` is present at `~/.claude/skills/gstack`. Subagents
are unaffected. If this is not intentional, remove the hook — a repo-wide tool
block should not survive on inertia.

---

## 9. Decision Record — Side-lying supraspinatus isometric hold (2026-08-21)

Architect decision for the first exercise that does not fit the paced-elevation
model. This section **renegotiates invariants 3 and 4 in writing** (the only way
they may change) and is the spec the downstream chain builds against. The
exercise: user lies on the LEFT side, lifts the RIGHT (top) arm to a **10–15°
abduction band**, palm to thigh (neutral rotation), and **holds isometrically
20–30 s**. Rising above the band is a fault. 5 holds = one session; daily goal
2+ sessions. Right arm only (consistent with the whole pipeline).

**D1 — Posture is a three-value union; `isSeated` is retired.** `posture`
becomes `'standing' | 'seated' | 'sideLying'`. Side-lying is a distinct body
orientation, not a seated variant: the trunk is horizontal, so the gravity /
nose-based vertical fallbacks that `isSeated` selects are geometrically wrong for
it. A boolean cannot carry three states, so kinematic functions take `posture`
(or a reference-frame descriptor derived from it). See invariant 4, including its
**behavior-preservation clause**: standing/seated outputs stay byte-identical
(no test corpus yet), side-lying is additive branches. *Abduction from the
torso long axis (shoulder→hip vector) is the same primary computation
`computeShoulderFlexion3D` already uses when hips are visible — side-lying needs
that branch and must be barred from the upright fallback. Final geometry is
kinematicist's.*

**D2 — A second, explicitly named state machine (invariant 3 amended).** The
paced machine cannot be degenerately reconfigured for this: its ASCENDING ramps
5 s to ~78°, HOLDING accumulates only above ~68°, aborts below ~52°, and its
target is a floor. This exercise has no cadence and its target is a **ceiling**.
Reusing it would smear the meaning of every `CONFIG` constant and invert the
hold logic. So invariant 3 now admits two models, selected by a new catalog
field `trackingModel: 'pacedElevation' | 'isometricHold'`. The isometric machine
is `READY → HOLDING → READY`, both states provably unstickable (band-settle +
accumulated-hold exit; wall-clock timeout in HOLDING; post-hold rest interval in
READY). It lives as a **new tracker class in the existing
`shoulderKinematics.ts`** — CONFIG and the geometry helpers are already there, so
no new file (D5). measurement-engineer owns the states, thresholds, and
unstickability proof; the exact rest-interval constant (reuse
`REST_BETWEEN_REPS_S` or add `REST_BETWEEN_HOLDS_S`) is theirs.

**D3 — One new `FormFlag`: `OVER_ELEVATION`.** The headline fault here — arm
lifted above the prescribed low ceiling (deltoid/trap takeover) — is a genuinely
new observable no existing flag expresses. `SHOULDER_HIKE` and `INCOMPLETE_HOLD`
are reused as-is (you can over-elevate without hiking and vice-versa, so both
stay independently flaggable); `RUSHED_*` and `PACING_*` simply never fire in
the isometric machine. Adding to the `FormFlag` union makes
`commonErrorsZh/En: Record<FormFlag, string>` require an `OVER_ELEVATION` line on
**every** catalog entry (a compile error otherwise) — that completeness is a
feature, not a burden; zh-tw-copywriter supplies the line for all entries and a
`flag.overElevation` pair in `uiStrings.ts`. The paced exercises carry the line
dead-but-typed. physiatrist owns the clinical observable and its landmark
signature; measurement-engineer owns the ceiling value and debounce.

**D4 — Dosage: reuse one field, add one optional field, compute the rest.**
- *"5 holds = 1 session"* → `exercise.targetReps = 5`. No new field.
  **Latent bug to fix first:** `RehabTraining` counts to `settings.targetReps`
  (a global user setting), **not** `exercise.targetReps` — the per-exercise field
  is ignored today (`RehabTraining.tsx:55,109,119`). The isometric path must
  honor the exercise's own fixed dose. frontend-engineer owns the fix; keep it
  scoped so existing paced exercises are unchanged.
- *"2+ sessions/day"* → **one new OPTIONAL catalog field
  `dailySessionTarget?: number`** in `ExerciseDefinition` (pure domain data;
  absent = today's behavior, so the other five entries are untouched). Adherence
  is **computed** from existing `CompletedSession` history (already carries
  `exerciseId` + `timestamp`) in `recoveryMilestones.ts`, grouped by local day.
  **No new persisted state, no storage migration — invariant 1 intact.** Do NOT
  put daily frequency in `UserSettings` or a new store key (second source of
  truth). Display is a dashboard concern (ux/frontend).

**D5 — No new files.** Everything lands in existing files: `rehabTypes.ts`
(`FormFlag`), `exerciseCatalog.ts` (`posture` union, `trackingModel`,
`dailySessionTarget?`, the new entry, `OVER_ELEVATION` copy),
`shoulderKinematics.ts` (posture-aware geometry, second tracker class, new CONFIG
per-view sets), `recoveryMilestones.ts` (daily-adherence calc),
`usePoseTracker.ts` + `RehabTraining.tsx` + the posture-branching components
(`ExerciseVideoCard`, `ExerciseLibrary`, `CustomRoutineBuilderModal`), and
`uiStrings.ts` (`posture.sideLying*`, `flag.overElevation`). The sideLying work
itself added no new files. (`assets.ts` and `pose/__tests__/` were later added
to the §2 tree by the 2026-08-22 health-review reconciliation, which also
deleted two orphaned components — `ExerciseLauncherCard`, `ExercisePickerModal`
— that this list originally named but that were never wired into any surface.)

**Open questions escalated to the user (do not build past these):**
1. **Recovery-phase attribution.** The dashboard recovery model is hardcoded to
   Phase 2 (active flexion to 90°, "20 sets", avg elevation → 90° = better).
   This isometric hold belongs to **Phase 1 (Acute Protection & Isometric
   Activation)**, which already names "pain-free isometric holds." It should
   almost certainly NOT feed the Phase-2 progress bar or the elevation stats.
   Needs a product + physiatrist decision before it can appear on the dashboard.
2. **`peakElevation` reinterpretation.** Reusing `RehabRepRecord` (peak = fault
   signal) avoids a storage migration but overloads the field's meaning. Confirm
   that is acceptable versus a dedicated isometric record type.
3. **Fixed vs tunable dose.** Confirm 5 holds and 20–30 s are a fixed
   prescription for this exercise (recommended) rather than driven by the global
   Settings sliders.
4. **Side-lying framing.** The light-UI/webcam rationale (§5) and all framing
   copy assume an upright subject facing the camera. A horizontal subject on a
   mat/bed with a side-placed camera is a real UX + measurement concern
   (ux-designer + measurement-engineer) — flagged, not yet solved.
5. **Ceiling hardness.** Confirm 10–15° is the band and >15° is a hard fault
   (vs a soft nudge) — measurement-engineer/physiatrist.

## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
_GS=""
for _D in "${GSTACK_ROOT:-}" "$HOME/.claude/skills/gstack" "$HOME/.codex/skills/gstack" "$HOME/.factory/skills/gstack" "$HOME/.kiro/skills/gstack" "$HOME/.config/opencode/skills/gstack" "$HOME/.slate/skills/gstack" "$HOME/.cursor/skills/gstack" "$HOME/.openclaw/skills/gstack" "$HOME/.hermes/skills/gstack" "$HOME/.gbrain/skills/gstack" "$HOME/.gstack/repos/gstack"; do
  [ -z "$_GS" ] && [ -n "$_D" ] && [ -d "$_D/bin" ] && _GS="$_D"
done
[ -n "$_GS" ] && echo "GSTACK_OK: $_GS" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use the resolved install path above for gstack file paths
(default: ~/.claude/skills/gstack).
