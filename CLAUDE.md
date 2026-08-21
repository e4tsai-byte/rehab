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

### 3. Deterministic Rep State Machine — *enforced by measurement-engineer*

* One state machine: `RESTING → ASCENDING → HOLDING → DESCENDING → RESTING`.
* Must enforce a post-rep rest interval (`CONFIG.REST_BETWEEN_REPS_S`) and a
  descent-settle trigger.
* **Every state must be provably unstickable.** For each state, name both the
  condition that exits it and the timeout that exits it anyway.
* Thresholds live in `CONFIG` and nowhere else. Do not restate a threshold's
  value in prose — this document pins *structure*, `CONFIG` pins *values*.

### 4. Dual-View Support — *enforced by kinematicist + physiatrist*

* Every exercise ships a `posture: 'standing' | 'seated'` catalog entry for each
  view it supports, and declares unsupported views explicitly.
* Every kinematic function that consumes hip landmarks takes `isSeated` and has
  a defined degenerate-hip fallback. A geometry function that ignores `isSeated`
  is a defect.
* Any threshold that differs between views is a named STANDING/SEATED pair in
  `CONFIG`, never a single shared constant.

### 5. One Product — *enforced by architect*

* This repo ships Rehabibi only. No file under `src/` may reference sit-to-stand
  assessment, participant rosters, trials, staff facilitators, or velocare.
* No second design system, no second string table, no second data-source layer.

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
│   ├── main.tsx                   # React root. Owns the stylesheet load order (§5).
│   ├── App.tsx                    # State router: Dashboard → Training → Summary
│   ├── domain/
│   │   ├── rehabTypes.ts          # Phases, FormFlags, RepRecords, UserSettings
│   │   └── exerciseCatalog.ts     # Exercise library + ALL zh-TW copy (see §4)
│   ├── pose/
│   │   └── shoulderKinematics.ts  # 3D vector geometry, CONFIG, rep state machine
│   ├── data/
│   │   └── rehabStore.ts          # localStorage only. Rep records + settings.
│   ├── hooks/
│   │   ├── usePoseTracker.ts      # MediaPipe PoseLandmarker vision loop
│   │   └── useChime.ts            # Web Audio metronome and cues
│   ├── components/
│   │   ├── RehabHeader.tsx        # Header: streak badge, settings
│   │   ├── ExerciseCard.tsx       # Routine card and start CTA
│   │   ├── SettingsModal.tsx      # Target angle, hold duration, reps
│   │   ├── AngleGauge.tsx         # Circular SVG goniometer with target band
│   │   ├── CadencePacer.tsx       # Cadence bar, hold countdown, rest ring
│   │   ├── RepPips.tsx            # One slot per prescribed rep
│   │   ├── Digits.tsx             # Fixed-cell numeric primitive
│   │   └── FormAlertBanner.tsx    # Live compensation warnings
│   ├── surfaces/
│   │   ├── RehabDashboard.tsx     # Home, exercise switcher, streak, history
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

# Local dev server
npm run dev

# Production bundle (runs typecheck first)
npm run build
```

> **KNOWN GAP — the most important thing on this page.**
> `src/pose/shoulderKinematics.ts` has **no test suite**. There is no test
> runner in `package.json` and no fixture corpus. The Python suite that used to
> exist (`pose/tests/`) covered velocare's sit-to-stand pipeline and never
> touched this code.
>
> Until a corpus exists, **no constant in `CONFIG` may change without a manual
> before/after run recorded in the PR**, stating which reps changed
> classification. Building the corpus — static fixtures, sequence tests,
> degeneracy tests — is qa-engineer's standing first task.

---

## 4. Copy and Localization

**Rehabibi has no i18n abstraction, deliberately.** zh-TW copy lives beside the
exercise it describes, in `domain/exerciseCatalog.ts` (`nameZh`, `descriptionZh`,
`framingHintZh`, `tipsZh`, `commonErrorsZh`).

The 713-line `src/i18n/strings.ts` that used to exist belonged entirely to
velocare — no Rehabibi surface ever imported it — and went with it.

Do not reintroduce a string table for a single-locale product. If a second
locale is ever added, that is the moment to extract one, and it should be
designed then rather than inherited now. Invariant 1.6 governs the tone of
everything written here.

---

## 5. Styling Ownership

Load order is set in `main.tsx` and **must not be reordered casually**:

```
tokens.css → base.css → telemetry.css → rehab.css
```

* **`tokens.css`** is the ONLY place design tokens are defined, and its polarity
  is **DARK** — light text on `#070a13`, per `DESIGN.md`. A token defined
  anywhere else, or a light-polarity token block, is a defect.
* **`base.css`** is reset, focus, and the Digits primitive. Consumes tokens,
  defines none.
* **`telemetry.css`** holds the goniometer, pacer, form-alert, and pip rules.
  Extracted verbatim from velocare's `app.css` during the deletion, because
  those rules were live dependencies of shipping components. It still consumes
  the legacy unprefixed token names (`--ink`, `--surface`, `--s-4` …), kept
  alive as a **dark alias layer** at the bottom of `tokens.css`.
* **`rehab.css`** is everything else.

**Two standing defects, owned by brand-designer:**

1. Migrate `telemetry.css` to `--rehab-*` and delete the alias layer. One
   change, with a visual diff of the training surface — not opportunistically.
2. `rehab.css` still contains raw hex and `rgba()` literals. Every one should
   become a `var(--rehab-*)`. A hardcoded colour in a component is a bug.

---

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
