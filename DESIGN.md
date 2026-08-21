# Rehabibi — Design System & Visual Specification

> This document is read as plain Markdown, not KaTeX. Use the literal ° and →
> characters. No `$…$` math delimiters — they render as visible `$` signs in
> every viewer in this toolchain, and a previous version of this file shipped
> corrupted, tab-eaten LaTeX for months.

---

## 1. Design Philosophy: "Sleek Dark Mode & Neon Precision"

Modern sports-science telemetry: dark, focused, high-contrast, distraction-free.

This is a positioning bet, not a mood board. Clinical rehab software is sterile and faintly humiliating; Rehabibi's wager is that daily physical therapy performed alone at home feels better when it looks like **training** rather than **treatment**.

**Polarity is DARK** — light text on `#070a13`. Until 2026-08-21 this file coexisted with a `tokens.css` inherited from velocare that declared the exact opposite ("dark ink on a cream ground"), and both loaded simultaneously, so the shipped polarity was decided by stylesheet import order rather than by design. That file is gone; `tokens.css` now holds the dark palette below and is the single source of token truth.

---

## 2. Design Tokens

`src/styles/tokens.css` is the only place any of these is defined. A raw hex or px value in a component is a bug. This table and that file change together.

### Ground & surfaces

| Token | Value | Role |
|---|---|---|
| `--rehab-bg` | `#070a13` | Deep void. Makes the camera overlay pop; minimizes eye strain. |
| `--rehab-surface` | `#0f172a` | Primary card and modal ground |
| `--rehab-surface-raised` | `#182238` | Raised card, control chrome |
| `--rehab-surface-hover` | `#1e293b` | Hover state |
| `--rehab-surface-glass` | `rgba(15, 23, 42, 0.7)` | Floating header and overlay panels |
| `--rehab-scrim` | `rgba(2, 6, 23, 0.72)` | Behind anything painted over live video |
| `--rehab-border` | `rgba(255, 255, 255, 0.08)` | Standard hairline |
| `--rehab-border-light` | `rgba(255, 255, 255, 0.15)` | Emphasis hairline |

### Semantic accents

These are a **language**, not a palette. Never use one decoratively; never add a fifth without retiring one.

| Token | Value | Meaning |
|---|---|---|
| `--rehab-cyan` | `#38bdf8` | Live tracking — skeleton overlay, goniometer arc in motion |
| `--rehab-emerald` | `#10b981` | Target reached, clean rep, correct tempo |
| `--rehab-amber` | `#f59e0b` | Hold countdown, inter-rep rest, streak |
| `--rehab-rose` | `#f43f5e` | Form alert |
| `--rehab-rose-soft` | `#fb7185` | Secondary alert text |

Each has a matching `-glow` at 0.25 alpha.

**On rose.** velocare's inherited rule was that red must never describe a person's outcome — correct for an instrument read by a facilitator in front of a room of participants. Rehabibi has one user and no observer, and rose describes the user's own movement to themselves. The divergence is deliberate.

**Contrast floor.** Overlay text and telemetry must clear 4.5:1 against the **worst-case video pixel**, not against `--rehab-bg`. They do not on their own: measured against a blown-out white frame, cyan is 2.14:1, amber 2.15:1, emerald 2.54:1. Against `#070a13` cyan is 9.8:1 — which is exactly why testing against the flat swatch hides the problem. Every element painted over `.training-camera` therefore sits on `--rehab-scrim` or carries a dark halo. Re-measure on a real frame after any accent change.

### Type

`--rehab-font` = `'Inter'`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `'Noto Sans TC'`, `'PingFang TC'`, `'Heiti TC'`, `'Microsoft JhengHei'`, sans-serif.

Latin faces precede the CJK faces so digits and Latin labels take Inter while Chinese falls through to the TC faces. **The CJK entries are not optional** — the interface is zh-TW, and an earlier `--rehab-font` omitted them entirely, sending every Chinese glyph to an OS default. Noto Sans TC is bundled via `@fontsource` and loaded in `main.tsx`; nothing is fetched from a CDN, because invariant 1 forbids a remote request from a rehab surface.

Scale: `--t-display` 5rem · `--t-lead` 3rem · `--t-fac-xl` 1.75rem · `--t-fac-lg` 1.25rem · `--t-fac` 1.0625rem · `--t-fac-sm` 0.9375rem.

**Telemetry numerals are always tabular.** `base.css` sets `font-variant-numeric: tabular-nums` on `body`, and the `Digits` primitive gives each character a fixed 1ch cell as a second belt that survives a font fallback. A proportional figure in a readout that updates many times a second makes the whole panel jitter.

### Motion

`--dur-fast` 120ms · `--dur` 180ms · `--dur-slow` 260ms · `--ease-out` `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint, no bounce).

Every animated rule routes its timing through these tokens so that `prefers-reduced-motion` actually reaches it. A hardcoded `transition: 0.2s` is a defect precisely because it escapes that block.

---

## 3. Accessibility Floor

Participant-facing surfaces. Not aspirational — these are acceptance criteria.

* **Contrast** — WCAG AA, measured against the live video frame per §2, not the background swatch.
* **Targets** — every interactive element at least `--rehab-tap-min` (44px). The settings button was 38px until 2026-08-21.
* **Focus** — `:focus-visible` draws a 3px cyan outline at 2px offset. There are no hover-only affordances anywhere, so focus-visible is the primary state, not an afterthought.
* **Motion** — `prefers-reduced-motion: reduce` collapses all duration tokens to 1ms and clamps animation globally.
* **Colour is never alone** — every state colour is paired with a shape, a position, or a word.

### Known gaps

* `rehab.css` contains **zero `@media` queries**. Section 6's responsive behavior is specified but not implemented. 🗓️
* Raw hex and `rgba()` literals remain throughout `rehab.css` and should all become `var(--rehab-*)`. 🗓️
* `telemetry.css` still consumes legacy unprefixed token names through an alias layer in `tokens.css`. See `CLAUDE.md` section 5. 🗓️

---

## 4. Key UI Components

### 4.1 Goniometer Angle Gauge (`AngleGauge.tsx`)

Circular SVG dial with a high-contrast degree readout.

**The accepted hold band is 80°–110°**, and the arc illuminates across it. This document previously said 85°–95°, which was wrong in both directions — the engine's `TARGET_HOLD_ENTER` is 80.0 and `TARGET_HOLD_MAX` is 110.0, so a rep peaking at 84° was being credited while the gauge showed the user outside the zone. The overlay must not lie about system state during the one moment feedback has to be trustworthy.

A single high-contrast nominal tick sits at 90° (`TARGET_ANGLE_NOMINAL`) so the band does not imply that 81° and 109° are equally good.

**Hysteresis is visible behaviour, not an implementation detail.** Descent releases the hold below 72° (`TARGET_HOLD_EXIT`), not at 80°. The gauge must render the band as still-lit through 72°–80° on the way down, or the 8° deadband reads as a bug.

The arc shifts from cyan to emerald on entering the band.

### 4.2 Cadence Metronome & Hold Ring (`CadencePacer.tsx`)

* **Ascent / descent pacer** — a 5.0 s animated fill bar, 0.0 s → 5.0 s.
* **Pace badge** — the hero numeral carries the state; a short verdict sits beneath it at secondary scale. Keep the hero string within roughly four characters: 很好 / 快一點 / 慢一點. A nine-character sentence is unreadable at three metres mid-rep, and colour alone must not distinguish the three states — each needs its own glyph.
* **Hold ring** — circular isometric countdown, counter-clockwise stroke depletion.
* **Rest ring** — amber countdown across the 3.0 s post-rep interval.

### 4.3 Real-Time Skeleton Overlay (`usePoseTracker.ts`)

Glowing cyan lines drawn over the mirrored video feed, with the shoulder, elbow, and wrist highlighted. Drawn imperatively to the canvas — this loop must not drive a React re-render per frame.

### 4.4 Post-Session Scorecard (`SessionSummary.tsx`)

Lead with a **count**, not a purity percentage: 達標次數 8/10. Quality detail belongs in the breakdown beneath, unscored. A "% 完美動作率" grades a healing shoulder against perfection and hands the user a number to carry around; that is the punitive framing invariant 1.6 exists to prevent.

Summary cards: completed reps, average hold duration, peak angle. Then a rep-by-rep table: concentric tempo, hold duration, eccentric tempo, and the specific form flags raised.

---

## 5. The One-Number Rule

During a rep the user is holding their arm at 90° with a healing shoulder, three to six feet from a laptop, possibly in pain. They can read about four characters at a glance.

**Exactly one numeral is at hero scale in the telemetry panel at any moment**, chosen by phase:

| Phase | Hero numeral |
|---|---|
| ASCENDING / DESCENDING | Cadence seconds elapsed |
| HOLDING | Hold countdown |
| RESTING | Rest countdown |

The gauge's degree readout is the camera region's single number. Everything else drops to secondary scale. Feedback the user cannot act on within the current rep is a scorecard item, not a live banner.

---

## 6. Responsive Behavior

**Specified, not yet implemented** — see section 3 Known gaps. 🗓️

* **Desktop / laptop** — two-column split. Left: mirrored camera feed. Right: goniometer, cadence bar, alerts.
* **Mobile / tablet** — stacked vertical. Top: camera feed. Bottom: telemetry panel. Currently `.training-body` is an unconditional `1fr 1fr` grid, so on a phone the camera feed is a half-width sliver.
