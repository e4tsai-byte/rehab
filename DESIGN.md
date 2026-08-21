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

Someone six weeks post rotator-cuff repair, standing in their bedroom at 7am in
grey light, laptop on a dresser, arm already aching, on the third of ten reps.
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
| `--mat-thin` | 0.44 | 22px / sat 200% | Segmented control, small chips |
| `--mat-regular` | 0.58 | 34px / sat 210% | Cards, panels |
| `--mat-thick` | 0.72 | 44px / sat 200% | Header, bottom rail, sheets |

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
with its own glyph so colour is not the only differentiator. It replaced strings
like 「⚠️ 速度過快（請放慢）」: nine characters, unreadable mid-rep by someone
holding their arm up two metres from the screen.

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
