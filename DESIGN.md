# Rehabibi — Design System & Visual Specification

> Plain Markdown, not KaTeX. Use the literal ° and → characters; no `$…$` math
> delimiters. A previous version of this file shipped tab-corrupted LaTeX for
> months because nobody re-read it rendered.

---

## 1. Design Philosophy: Apple materials, light

Rehabibi uses Apple's system-material language: near-white grounds, translucent
glass chrome and cards, SF typography, and motion that decelerates rather than
bounces.

This replaced a dark "neon precision" theme on 2026-08-21.

### Why light, and it is not an aesthetic argument

**The screen is a fill light.** The user stands one to two metres from a laptop
with the webcam pointed at them, often in a dim bedroom early in the morning. A
light interface throws real illumination onto their face and torso, and
MediaPipe's landmark confidence rises with subject exposure. A dark UI in a dark
room hands the pose tracker an underlit subject, and every downstream number —
angle, cadence, compensation flag — degrades with it.

The secondary reason is that glass reads as glass only when there is luminance
behind it to refract. A dark theme can carry translucency, but a light one gives
the material something to do.

### The scene this is designed for

Someone recovering from orthopedic surgery or managing musculoskeletal rehabilitation (shoulder, knee, spine, hip, elbow, ankle), in their room or at their desk at 7am in
grey light, laptop on a table, on the third of ten reps.
Calm, legible from two metres, nothing shouting, nothing grading them.

---

## 2. Design Tokens

`src/styles/tokens.css` is the only place any of these is defined, and this
document changes with it. A raw hex or px value in a component is a defect.

**Every value below was verified numerically, in a live browser, against its
real composite backdrop.** Not against the token the design intends — against
what the pixel actually is once material, wash, and ambient field have composited.
That distinction caught two failures a by-eye pass would have shipped.

### Grounds

| Token | Value | Role |
|---|---|---|
| `--rehab-ground` | `#f3f5f7` | Page ground. Solid — the base of the material stack. |
| `--rehab-ground-sunk` | `#eaedf1` | Track fills, inset wells |
| `--rehab-surface` | `#ffffff` | Solid cards inside glass surfaces |

Cool near-white, deliberately **not** cream, sand, bone, or parchment. The
warm-neutral band is the saturated default of the moment and reads as a
template; the whisper of blue chroma ties the neutrals to the accent hue rather
than tinting warm by reflex.

### Ink

| Token | Value | On ground |
|---|---|---|
| `--rehab-ink` | `#1a1d23` | 15.40:1 |
| `--rehab-ink-secondary` | `#595e66` | 5.96:1 |
| `--rehab-ink-tertiary` | `#6c7078` | 4.52:1 |

`--rehab-ink-tertiary` sits barely above the body-text floor because it was
darkened twice — at its first two values it measured 3.32 and 4.24 and failed.
**Do not lighten it for elegance.** Light grey body text on a tinted near-white
is the single most common reason an interface is hard to read.

### Semantic accents — two tiers, and the distinction is load-bearing

Blue = live tracking. Green = target reached, clean reps. Orange = hold and rest
intervals. Red = form alert. A language, not a palette: never use one
decoratively, never add a fifth without retiring one.

| Role | Plain (graphical only) | Deep (text, and fills carrying white text) |
|---|---|---|
| Blue | `#0b79ed` | `#005fc6` |
| Green | `#299d50` | `#0a7e3a` |
| Orange | `#d87400` | `#bb5d00` · on wash `#ae5000` |
| Red | `#df2f36` | `#c01d27` |

The **plain** tier is for arcs, rings, bars, and fills — graphical objects,
verified ≥3:1. The **deep** tier is for anything that is text. This is not
stylistic: white on plain blue measures 4.23 and white on plain green 3.15, both
below the floor. Using a plain tier for text fails contrast.

`--rehab-orange-on-wash` exists because `#bb5d00` clears 4.5 on **white** but
measured **3.93** on its own orange wash once that wash sat over glass. The
composite backdrop is lighter than the token the design intends. A live audit
caught it; static palette maths had passed it.

### Materials

Apple's tiers. Material weight encodes hierarchy — thicker sits higher and
separates more.

| Token | Alpha | Blur | Used for |
|---|---|---|---|
| `--mat-thin` | 0.52 | 24px / sat 200% | Segmented control, small chips |
| `--mat-regular` | 0.68 | 34px / sat 210% | Cards, panels |
| `--mat-thick` | 0.78 | 44px / sat 210% | Header, bottom rail, sheets |

Three things make a surface read as a material rather than a white box at
reduced opacity, and all three are required:

1. **The ambient field** (`body::before`) — four wide, faint radial washes in
   blue, green, and orange. Not decoration: over a perfectly flat fill,
   `backdrop-filter` has nothing to sample and every surface collapses flat.
   The first build of this redesign looked flat for exactly this reason.
2. **The specular sheen** (`--mat-sheen`) — a 160° gradient from 62% white at
   the top-left falling to zero by half. Real glass catches light along one edge.
3. **The bright top edge** (`--shadow-inset-edge`) plus a two-part shadow: a
   tight contact shadow and a wide ambient one. A single large blur reads as fog.

### The stacking rule

**Never stack a light translucent surface on another.** The page ground is solid,
cards are glass over it, chrome is glass over cards. Solid cards *inside* glass
are fine and are how the spec pills, setting rows, and pacer are built. Glass
inside glass is a defect: the blur has nothing true to sample and legibility
collapses.

This is enforced, not just documented — `audit.mjs` walks the DOM for a glass
element with a glass ancestor and reports it as a violation.

### Over-video material — dark, on purpose

Everything painted over the camera feed uses `--mat-over-video`
(`rgba(19,22,27,0.72)`) and is **dark in an otherwise light interface.**

Measured against a blown-out white video frame, every accent fails: blue 4.23,
green 3.15, orange 2.79. A light glass chip over live video becomes illegible
the moment the user stands near a window. At 0.72 alpha the dark scrim gives
white text **7.21:1 over a white frame and 19.06:1 over a black one** — the only
tier tested that passes at both extremes. 0.55 alpha fails the white extreme at
4.02.

### Type

`--rehab-font` leads with `-apple-system` / SF, then falls to `Noto Sans TC`,
`PingFang TC`, `Heiti TC`, `Microsoft JhengHei` for CJK. Latin faces precede the
CJK faces so digits and Latin labels take SF while Chinese falls through. **The
CJK entries are not optional** — the interface is zh-TW.

System font first is deliberate: SF already ships optical sizing, tracking
tables, and legibility tuning no loaded web font would beat, and it costs zero
bytes.

Fixed rem scale, not `clamp()`. Product UI is read at consistent DPI, and a
fluid heading that shrinks inside a panel looks worse rather than better.

`--t-hero` 4.25rem · `--t-display` 2.75rem · `--t-title` 1.75rem · `--t-lg`
1.25rem · `--t-md` 1.0625rem · `--t-sm` 0.9375rem · `--t-xs` 0.8125rem

**Tracking is size-specific.** A single letter-spacing value is wrong somewhere:
large text reads too loose as it grows, small text too tight. `--track-hero`
-0.03em through `--track-caption` +0.01em.

**Telemetry numerals are always tabular.** `base.css` sets
`font-variant-numeric: tabular-nums` on `body`, and the `Digits` primitive gives
each character a fixed 1ch cell as a second belt that survives a font fallback.

### Motion

`--dur-fast` 160ms · `--dur` 220ms · `--dur-slow` 320ms · `--dur-sheet` 420ms,
all on `--ease-out` / `--ease-out-expo` (exponential deceleration).

**There is no overshoot curve in this system, deliberately.** An earlier draft
had one for the settings sheet. Overshoot belongs only to motion a gesture
actually threw — a flick, a drag release — and this sheet opens from a button
press. Nothing in this interface is draggable, so nothing bounces.

Every animated rule routes its timing through these tokens, which is what lets
`prefers-reduced-motion` reach all of it at once. A hardcoded duration is a
defect precisely because it escapes that block.

---

## 3. Accessibility Floor

Acceptance criteria, not aspirations. All five surfaces pass; `audit.mjs` runs
the first three checks against a live browser.

* **Contrast** — WCAG AA against the real composite backdrop. Body text 4.5:1,
  graphical objects and large text 3:1. Over-video content measured at both
  frame extremes.
* **Targets** — every interactive element at least 44×44 (`--tap-min`). The
  settings button was 38px and the segmented items 40px before this pass. The
  sound switch is 52×44 with a 52×32 visible track, using vertical padding plus
  `background-clip: content-box` so the hit area exceeds the graphic without a
  wrapper or a transform.
* **Material stacking** — no glass inside glass.
* **Focus** — `:focus-visible` draws a 3px blue ring at 2px offset. There are no
  hover-only affordances anywhere, so focus-visible is the primary state.
* **Motion** — `prefers-reduced-motion: reduce` collapses every duration token to
  1ms and clamps animation globally.
* **Transparency** — `prefers-reduced-transparency: reduce` makes every material
  fully solid rather than merely less blurred. The over-video tiers go *more*
  opaque, not less: the contrast problem they solve gets worse when translucency
  is reduced, not better.
* **Contrast preference** — `prefers-contrast: more` darkens the ink ramp and
  strengthens every hairline.
* **Colour is never alone** — every state colour is paired with a glyph, a
  shape, or a word.

---

## 4. Key Components

### 4.1 Angle HUD (`AngleGauge.tsx`) — on the camera feed

The joint-angle readout lives **on** the video, not beside it. A user watching
their own arm should not have to shift gaze to a side panel to learn what that
arm is doing. Only safe because the HUD is dark; see the over-video material above.

**The lit band is 80°–110°, read from `CONFIG` rather than hardcoded.** It is the
range the engine actually accepts (`TARGET_HOLD_ENTER` … `TARGET_HOLD_MAX`). The
previous gauge drew a fixed 85°–95° band, which was wrong in both directions: a
rep peaking at 84° was credited as clean while the gauge showed the user outside
the zone. An overlay that misreports system state during the one moment feedback
has to be trustworthy is worse than no overlay.

A single bright tick marks the 90° nominal, so a 30°-wide band does not imply
that 81° and 109° are equally good.

The arc shifts blue → green on entering the band.

### 4.2 Cadence Pacer (`CadencePacer.tsx`) — the panel's single numeral

One value at hero scale, chosen by phase: cadence seconds while moving, hold
countdown while holding, rest countdown while resting. Ring for the countdowns,
bar for cadence.

The pace verdict is **four characters at most** — 很好 / 快一點 / 慢一點 — each
with its own glyph so colour is not the only differentiator. It replaced an
emoji-prefixed string like 「速度過快（請放慢）」: nine characters including the
leading emoji, unreadable mid-rep by someone holding their arm up two metres
from the screen.

### 4.3 Skeleton overlay (`usePoseTracker.ts`)

Drawn imperatively to the canvas over a mirrored feed. This loop must not drive
a React re-render per frame.

### 4.4 Session Summary (`SessionSummary.tsx`)

The hero is a **count**, not a percentage: reps that reached the target band over
reps completed. It replaced a circular dial reading「% 完美動作率」— perfect-movement
rate — which grades a healing shoulder against perfection and hands the user a
number to carry around. When a session recorded nothing, the hero is suppressed
entirely: "0 / 0" is not information, and a zero at display scale reads as a
verdict on a session the person may have stopped for a good reason.

### 4.5 Anatomy Explorer (`BodyAnatomyDiagram.tsx`) — inline in the Dashboard, not a surface

This is an interactive region selector embedded inside `RehabDashboard`, not a
top-level surface — selecting a joint opens `RegionDetailModal` as a modal
drill-down, not a navigation change (see `ux-designer`'s Flow section). It lives
in the calm, seated, "nothing running" context that `RehabTraining`'s
four-character constraint explicitly does not reach.

**Interactive, not a static list, because the question it answers is spatial.**
Choosing "which of six regions is mine" is faster by pointing at where it hurts
on a body than by reading six proper nouns in a list. The posterior/anterior
toggle exists for the same reason: rotator-cuff work reads clearer from behind,
quad and hip-flexor work reads clearer from the front — the two views are not
decorative, they answer different questions depending on which region a user is
looking for.

The SVG diagram and the companion `region-card` grid beside it are not
redundant with each other. The diagram carries spatial orientation; the cards
carry what the diagram cannot — exact prescribed/upcoming counts, keyboard
focus, and screen-reader labels. Clicking either the joint or its card opens the
same modal, so the diagram is a second way to reach the same destination, not a
gate in front of it.

Five of six regions render with an **upcoming**, not active, status pill and a
lighter treatment. This is an honest-roadmap decision: clinically-authored
content is shoulder-only today (`physiatrist`'s stated scope), so the other
five joints stay visible with their own two-letter code badge (`[SP]`, `[EL]`,
`[HP]`, `[KN]`, `[AK]`) rather than being hidden — the product doesn't overstate
its clinical coverage, but doesn't erase the six-region architecture it was
built for either. `anatomy-visual-card` sits at `--r-2xl` (Outer Container,
§8), the `region-card` grid items nested inside it step down to `--r-xl`
(Component Tile) — the tier ordering §8 describes, not a coincidence of
naming.

### 4.6 Region Detail Modal (`RegionDetailModal.tsx`) — a region's own dashboard

A modal launched from the Anatomy Explorer (`selectedRegion` is local
`RehabDashboard` state, never an `App.tsx` view), not a route — closing it
returns to the same dashboard scroll position rather than navigating back.

It separates **Available** (prescribed, quick-startable today) from
**Upcoming** for the same honesty reason as the region status pill one level up:
an exercise the user can start this second must not sit in the same grid as a
placeholder for a future release, or "quick start" stops being a reliable
promise. A third section, **Routines**, renders only when the region has any,
and sits between the two — a routine is a bigger commitment than one exercise,
so it belongs after "can I do one thing right now" and before "here's what's
coming."

The available-exercise and routine cards inside this modal render at `--r-lg`
(§8's Interactive Control tier), one step down from the `--r-xl` region cards
that led here — inside the modal these cards are the clickable choice list, and
the modal sheet itself is already the component tile, so the cards it contains
sit a tier below it, not level with it.

The footer's "Explore All →" hands off to `ExerciseLibrary` rather than
reimplementing its filtering inside the modal. This region view is a curated
lens on one catalog, not a second data source (Invariant 5, One Product) — the
full library is one click further for anyone who wants to browse past the
region they arrived from.

### 4.7 Prescription Planner (`PrescriptionPlanner.tsx`) — the third top-level surface

A peer to Dashboard and Exercise Library, not a step inside the training flow —
`App.tsx`'s `activeTab` carries `'prescriptions'` alongside `'dashboard'` and
`'exercises'` as sibling values. Reached by the header tab or the dashboard's
"today's prescription" action banner; either way it lands on the same surface,
never a variant of it.

**Three literal tracks — Active, Queued, Completed — rather than one sortable
list**, because a prescription plan is staged over time by design: shoulder
work now, hip work deferred six weeks out. Rendering that as three physically
separate tracks makes the stage spatial information the user absorbs by
position, rather than a status column they have to read per card. `rx-track`
renders at `--r-2xl`, the same Outer Container tier as the hero cards and the
anatomy explorer (§8) — three peer containers of equal visual weight, not a
list with a taller header.

The card density inside each track — thumbnail, week-progress bar, a
clinician's note rendered as a blockquote, spec tags — is licensed by the same
calm, seated context as `SessionSummary` and the Region Detail Modal
(`ux-designer`): nothing on this surface is ever read mid-rep.

The metric strip at the top (Active / Queued / Days / Completed as four bare
numerals) borrows the One-Number Rule's instinct for legibility but repurposes
it for orientation rather than live feedback — four counts read at a glance
give the shape of the whole plan before the user reads a single card.

### 4.8 Prescription Timeline Visualizer (`PrescriptionTimelineVisualizer.tsx`) — sequential, not flat

A week-indexed swimlane, not a flat list, because the question this surface
answers is inherently sequential: not "what am I doing" but "what am I doing,
for how long, and what starts after it." A flat list only answers the first
question; a timeline is what it takes to answer the second, and that question
only exists once a plan has queued stages waiting behind the active ones.

Each row's two-letter region code (`SH` / `KN` / `HP` / `EL` / `SP` / `AK`)
reuses the exact abbreviation the Anatomy Explorer's joint tags already carry
(`[SH] Shoulder`, etc.) — one visual vocabulary spans both surfaces, so a code
a user learned by pointing at a joint on the Dashboard is legible again here
without re-teaching.

A single vertical "current week" marker crosses every lane, rather than a
highlighted cell per row — "where am I now" stays one landmark to find once,
not N cells to individually scan across every track.

Rendered as its own `--r-2xl` outer container, sitting above the three tracks
it summarizes, ahead of them in reading order — its visual weight matches its
role as the plan's single overview, meant to be read first.

### 4.9 Prescription Editor Modal (`PrescriptionEditorModal.tsx`) — chips, not sliders

Duration (1–12 weeks), daily sets (1–4), and weekly days (3–7) are each a row
of discrete chip buttons (`--r-full`) rather than a number input or a slider.
The valid range in each case is small and clinically bounded — nobody needs a
12-week exercise to run for 47 — so presenting the actual option set removes an
entire class of invalid input at entry time rather than validating it after
the fact.

The exercise picker is a native `<select>` grouped by region code, not a card
grid. This is the one moment the editor needs to scan a long list quickly while
filling in a form — exactly what a native select is built for. The richer card
treatment stays on the browsing surfaces (the Library, the Region modal); a
data-entry form is not one of them.

The Active/Queued schedule-mode toggle is two equal buttons, not a checkbox,
because which track a new prescription lands in is the one decision this form
makes about sequencing — it earns the same visual weight as picking the
exercise itself, not a secondary checkbox beneath it.

The sheet renders at `--r-2xl`, one tier above the default `.sheet`'s `--r-xl`
(§8) — its wider two-column parameter grid reads as a small outer container of
its own, not a single-column dialog wearing extra width.

---

## 5. The One-Number Rule

During a rep the user is holding their arm at 90° with a healing shoulder, one to
two metres from a laptop, in pain, counting seconds. They can read about four
characters at a glance.

**Exactly one numeral is at hero scale per region:**

| Region | Its single number |
|---|---|
| Camera | Joint angle |
| Telemetry panel | Cadence seconds / hold countdown / rest countdown, by phase |

Everything else drops to secondary scale and is read peripherally — fill level,
arc sweep, colour — without focusing. Feedback the user cannot act on within the
current rep is a scorecard item, not a live banner.

---

## 6. Responsive

Structural, not fluid — breakpoints, not clamped type.

| Width | Behaviour |
|---|---|
| ≥1024px | Training splits camera / telemetry side by side |
| <1024px | Training stacks: camera on top at 48dvh, telemetry beneath |
| <760px | Grids collapse; history and rep tables become labelled stacks |
| <480px | Compact phone: nav subtitle and streak label drop, HUD shrinks |

The history and rep logs become **labelled card stacks** on phones rather than
scrolling tables. A horizontally scrolling five-column table is worse than a
stack, because the user cannot see the row label and its value at the same time.

Until this pass `rehab.css` contained **zero** `@media` queries, so the stacked
mobile layout this document described had never existed and the camera feed
rendered as a half-width sliver on a phone.

---

## 7. Invariant: Zero Emojis Across UI Chrome

**Emojis are strictly prohibited anywhere in Rehabibi's UI chrome, catalogs, strings, modals, telemetry, tags, and scorecards.**

- **Rationale**: Emojis introduce visual noise, render inconsistently across OS platforms, and violate the calm, dignified, non-grading medical coaching ethos defined in Invariant 1.6.
- **Alternatives to Emojis**:
  - Semantic typographic badges (e.g. `[STAND]`, `[SEAT]`, `[SIDE]`, `ACTIVE`, `ROADMAP`).
  - Strict SVGs using system stroke/fill tokens (`--rehab-ink`, `--rehab-blue-deep`, `--rehab-green-deep`).
  - Clear, unadorned clinical labels and metrics.

---

## 8. Container & Card Hierarchy (Apple Materials)

Outer containers, inner tiles, and interactive controls step down through three
corner-radius tiers, each roughly three-quarters the radius of the one above it —
concentric clearance, not an arbitrary scale.

| Tier | Radius Token | Value | Typical Uses | Padding |
|---|---|---|---|---|
| **Outer Container** | `--r-2xl` | 36px | Action banners, hero cards, prescription tracks, activity calendars, anatomy explorer, exercise cards | `var(--s-6)` – `var(--s-7)` (24–28px) |
| **Component Tile** | `--r-xl` | 28px | Nested stat cards, calendar tiles, region cards, video cards, note blocks | `var(--s-4)` – `var(--s-5)` (16–20px) |
| **Interactive Control** | `--r-lg` / `--r-full` | 20px / 9999px | `.glass` cards, dialog inputs, spec pills, region exercise/routine cards inside `RegionDetailModal` (`--r-lg`); buttons, segmented controls, streak/track badges, progress-bar fills (`--r-full`) | `var(--s-2)` – `var(--s-4)` |

Verified against `src/styles/tokens.css`, not assumed: `--r-lg` is **20px**, not
18px — a mismatch a previous draft of this table carried, and `--r-pill` was
never a real token; the pill radius is `--r-full` (9999px). Two components with
the word "pill" in their name aren't proof of which token they use — `.spec-pill`
in fact renders at `--r-lg` (a rounded rectangle, not a true pill), while
`.segmented` and `.btn` render at `--r-full`. Read the CSS, don't infer from the
class name.

Below these three sits a fourth, **micro** tier — `--r-xs` (6px), `--r-sm`
(10px), `--r-md` (14px) — for elements too small to carry a 20px corner without
looking like a lozenge rather than a rounded rectangle: flag tags, muscle chips,
badges, and the nav logo mark. It's real and in active use (`.flag-tag`,
`.muscle-chip`, `.spec-tag`, `.region-card__code-badge`) but doesn't get its own
row here because none of it is a container — it's inline micro-typography
treatment, not part of the card-nesting hierarchy this section documents.

This hierarchy ensures that nested cards maintain concentric visual clearance and generous breathing room on high-density displays.

