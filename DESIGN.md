# Design

Visual system for VeloCare Tier 1. Strategy lives in `PRODUCT.md`; hard invariants live in
`CLAUDE.md`. Where this file and those conflict, they win.

## Theme

**Single dark theme. No toggle.**

Scene sentence that produced it: *an analogue laboratory instrument under fluorescent light — a
beam balance or a Tektronix scope, where the only colour on the whole device is the illuminated
readout and everything else is machined neutral grey.*

That sentence forces three decisions:

1. **Surfaces are chroma 0.** Machined grey, not tinted. No warm neutral, no cool neutral. A
   tinted surface would read as designed; this should read as manufactured.
2. **The hero readout is near-white, not the accent hue.** Cataracts scatter light and flatten
   contrast sensitivity. Chroma on a 12rem number costs real luminance contrast at 3 m, so the
   number is achromatic and the seed colour is demoted to functional signalling only.
3. **Near-black, not pure black.** `oklch(0.17 0 0)` rather than `0`. Pure black behind a
   near-white 192px numeral produces halation on an LCD in a fluorescent room, which is worse for
   an ageing eye than a slightly raised floor. Contrast is still 13:1.

The printed sheet is a separate light surface. It shares the type family and nothing else.

## Color

OKLCH throughout. Strategy: **Restrained** — the floor for product register, and correct here.
Accent carries state only, never decoration. Total chromatic area on screen at any moment is a
single 16px indicator.

```css
/* Surfaces — chroma exactly 0 */
--bg:              oklch(0.170 0 0);   /* room-facing field                     */
--surface:         oklch(0.225 0 0);   /* facilitator rail                      */
--surface-raised:  oklch(0.280 0 0);   /* controls, rows                        */
--line:            oklch(0.340 0 0);   /* hairlines                             */
--line-strong:     oklch(0.460 0 0);   /* focus ring, active borders            */

/* Ink */
--ink:             oklch(0.970 0 0);   /* hero readout, participant text        */
--ink-secondary:   oklch(0.800 0 0);   /* participant-safe secondary            */
--ink-muted:       oklch(0.680 0 0);   /* facilitator-read text only            */

/* State — functional only */
--accent:          oklch(0.800 0.130 110);  /* tracking live (seed hue 110)     */
--alert:           oklch(0.700 0.170 30);   /* tracking LOST — the only alarm   */
```

### Contrast — measured, not calculated

Every number below was read back in the browser by painting the token to a canvas and computing
WCAG relative luminance. **Two earlier revisions of this file carried hand-computed ratios that
were wrong in both directions**, including a claimed 3.5:1 failure that measures 5.04:1. OKLCH
lightness is not a proxy for contrast ratio; re-measure after any token change.

| Token | `--bg` | `--surface` | `--surface-raised` |
|---|---|---|---|
| `--ink` | **17.58** | 15.63 | 13.34 |
| `--ink-secondary` | **10.29** | 9.15 | 7.81 |
| `--ink-muted` | **6.64** | 5.91 | 5.04 |
| `--accent` | **10.46** | 9.30 | 7.94 |
| `--alert` | **6.67** | 5.93 | 5.06 |

All three ink tokens clear 4.5:1 on all three surfaces. Only `--ink` and `--ink-secondary` clear
the **7:1 participant floor**, so `--ink-muted` is confined to facilitator-read text.

**The scoped guarantee.** `--ink-muted` never appears inside **`.field--locked`** — the trial
screen while a trial is live — and that is verified rather than asserted: every text node in the
locked field measures 10.29:1 or better. The looser claim, that it never appears in `.field` at
all, is **false**: the roster occupies the full field between trials and uses `--ink-muted` for
row ids and metadata, at 6.64:1. That is correct, because the roster is read by the facilitator,
not by someone mid-effort at 3 m. The floor applies to participant-facing surfaces, and the
relaxed zone is not one.

`--accent-quiet` existed in an earlier draft and has been removed: nothing used it, and at
4.05:1 on `--surface` it could not have carried text anyway.

### Colour never carries meaning alone

Every state pairs **colour + word + distinct shape**. The shapes are non-negotiable, because a
participant with colour-vision deficiency and a facilitator glancing sideways both read shape
faster than hue.

Shapes are **SVG, not Unicode geometric characters** (`src/components/Shape.tsx`). Noto Sans TC
does not cover `▮ ▯ ◇ ⊘`, and a missing-glyph box is not a shape. If a state's legibility depends
on font coverage it is not guaranteed, which is the same argument as the `Digits` primitive.

| State | Colour | Word | Shape (`ShapeKind`) |
|---|---|---|---|
| Tracking live | `--accent` | 追蹤中 | `circle-filled` |
| Tracking idle | none (`--ink-secondary`) | 待機 | `circle-hollow` |
| Tracking lost | `--alert` | 追蹤中斷 | `square-filled` |
| Awaiting measurement | none (`--ink-secondary`) | 待量測 | `circle-hollow` |
| Complete | none (`--ink-secondary`) | 已量測 | `bar-filled` |
| Incomplete | none (`--ink-secondary`) | 未完成五次 | `bar-hollow` |
| Protocol invalid | none (`--ink-secondary`) | 手部支撐 | `triangle` |
| Unable to perform | none (`--ink-secondary`) | 無法進行 | `diamond` |
| Aborted | none (`--ink-secondary`) | 已作廢 | `slash-circle` |

Tracking shapes (circles, square) are deliberately disjoint from outcome shapes (bars, triangle,
diamond) so a facilitator never confuses "the machine is fine" with "the person finished".

**Only two states carry colour, and both are about the machine.** Everything describing a
*person's* result is achromatic. `PRODUCT.md`: "failure states are not failures." A participant
who used their hands did not malfunction, and a red row would tell them they did.

## Typography

**One family: Noto Sans TC.** Bundled locally via `@fontsource/noto-sans-tc`, never a CDN, because
the appliance has no network. Weights 400 / 500 / 700 only.

Chinese is the interface, not a fallback. There is no Latin display face. When English arrives it
will be Noto Sans (Latin), which is metrically designed alongside Noto Sans TC and therefore
matches weight and x-height without optical patching.

### Digits are the primary content

Two mechanisms, belt and braces, because a digit that changes width as it changes value is
disqualifying on an instrument:

1. `font-variant-numeric: tabular-nums` plus `font-feature-settings: "tnum" 1`.
2. **A `<Digits>` primitive that renders each character in a fixed `1ch` inline-block cell.** This
   is font-independent and survives a fallback face, which `tnum` alone does not. All hero numbers
   and all elapsed times route through it.

### Scale — fixed rem, not fluid

Fluid type is wrong here. The monitor is a known fixed device at a known fixed distance; a
`clamp()` that shrinks the readout on a narrower viewport would shrink the one thing that must
never shrink.

```css
/* Participant field — 2rem floor per invariant 4 */
--t-hero:    12rem;    /* 192px · rep count                     */
--t-display:  5rem;    /*  80px · elapsed time, result surface   */
--t-lead:     3rem;    /*  48px · 完成, state words              */
--t-part:     2rem;    /*  32px · participant floor              */

/* Facilitator rail — no 2rem floor, but a standing part-time
   worker reads this, so the floor is 1.25rem not 1rem */
--t-fac-lg: 1.75rem;   /* 28px · row primary                     */
--t-fac:    1.375rem;  /* 22px · controls, labels                */
--t-fac-sm: 1.25rem;   /* 20px · metadata floor                  */
```

Ratio ≈1.25 in the participant band, tighter in the rail per product register. Line-height 1.1 on
the hero (a 192px numeral needs no leading), 1.5 on prose.

## Layout — the zone law

This is the resolution of the central structural problem: **one machine, one monitor, two
audiences.**

```
┌────────────────────────────────────────────┐
│                                            │
│         PARTICIPANT FIELD  ~72vh           │   --bg
│                                            │
│   During an active trial this zone         │
│   contains EXACTLY ONE number and one      │
│   pip row. Nothing else may enter it.      │
│                                            │
├────────────────────────────────────────────┤   1px --line
│  FACILITATOR RAIL  ~28vh        --surface  │
│  All controls. All machine state.          │
└────────────────────────────────────────────┘
```

**Rules:**

- The rail is a **different surface lightness**, so it reads as a separate device panel rather
  than as part of the readout. This is the whole trick: the two audiences are separated by
  material, not by font size.
- **During an active trial the Participant Field is locked to one number plus pips.** No clock, no
  per-rep list, no name, no logo. `--ink-muted` is banned from this zone by contrast, which makes
  the rule mechanical.
- **Between trials the zone law relaxes.** Roster and result may occupy the full field, because
  nobody is mid-effort and the facilitator is the only reader.
- Facilitator controls: **≥64px tap targets**, ≥16px gaps so a hurried thumb cannot hit two.
- No hover-only affordances anywhere. Every state reachable by focus and touch.

### Deviation from the original build brief, recorded deliberately

The brief asked for "rep count, running total time, per-rep times as they land" during a trial.
**The live clock and the per-rep column are not built.** `PRODUCT.md` defines the participant as
reading "at most four characters at a time," which a count plus a clock plus an accumulating
column violates. Elapsed time is captured throughout and appears on the result surface and the
sheet. Nobody acts on it mid-trial: the participant needs reps-remaining, the facilitator needs
to know tracking is alive so they can catch a void early. The rail therefore carries a
tracking-health indicator where the clock would have been.

## Components

Custom. No Material, no Carbon, no shadcn vocabulary — none of them has a primitive for "one
number legible at three metres" or for a government funding report.

| Component | Notes |
|---|---|
| `Digits` | Fixed-cell numeral renderer. Every number on screen goes through it. |
| `RepPips` | Five slots, filled / hollow. Shape-first so it reads without colour. |
| `StateChip` | Colour + word + shape triad from the table above. Never colour alone. |
| `RailButton` | 64px min, three sizes, full state set: default / hover / focus-visible / active / disabled. |
| `ParticipantRow` | Roster row. Status by shape and word. **Carries no time.** |
| `TrialField` | The locked participant zone. Refuses children other than readout + pips. |
| `FacilitatorRail` | Persistent bottom panel. |
| `Sheet` | The A4 print surface. Light theme, separate scale in pt/mm. |
| `ScenarioSwitcher` | Overlay, keypress-reachable, absent from print. |
| `DemoBanner` | Persistent honesty marker. Cannot be dismissed. |

Every interactive component ships default / hover / focus-visible / active / disabled. Focus ring
is `--line-strong`, 3px, offset 2px — visible on both surface lightnesses.

### Roster carries no times

A screen listing ten older adults with their times, in a small shared room, is a leaderboard. The
design doc names this as the most likely route to facilitator veto and a real dignity harm. The
roster shows **status only**: outstanding, done, protocol-invalid, unable. Numbers live on the
result surface (one participant at a time) and on the sheet (which the site lead reads alone).

## Spacing & radii

```css
--s-1: 0.25rem;  --s-2: 0.5rem;   --s-3: 0.75rem;  --s-4: 1rem;
--s-6: 1.5rem;   --s-8: 2rem;     --s-12: 3rem;    --s-16: 4rem;   --s-24: 6rem;

--r-sm: 2px;  --r: 4px;  --r-lg: 6px;   /* instrument, not app. no pills. */
```

Rhythm is varied deliberately: the rail is dense (`--s-3`/`--s-4`), the participant field is
extremely sparse (`--s-16`/`--s-24`). The contrast in density is itself the signal that the two
zones belong to different readers.

## z-index scale

```css
--z-base: 0;  --z-rail: 10;  --z-overlay: 20;  --z-scenario: 30;
```

Semantic, never arbitrary. No 999.

## Motion

Functional only. Nothing decorative, per invariant 4 and the product bans.

```css
--dur-fast: 120ms;  --dur: 180ms;  --dur-slow: 260ms;
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);   /* ease-out-quint. no bounce. */
```

Exactly four animations exist, each conveying state:

1. **Pip fill** on rep detection — 120ms. The only feedback the participant gets besides the
   number, and it is what makes the chime legible to a deaf participant.
2. **Number increment** — no transition. A counter that eases is harder to read, not softer.
3. **Zone state change** (idle → live → complete) — 180ms crossfade on the rail only.
4. **Void** — single 260ms flash of the rail, once, not a loop. A looping alarm in a room of ten
   older adults is a dignity problem.

`@media (prefers-reduced-motion: reduce)` collapses all four to instant state swaps. The reveal is
never gated on a transition, so content is visible if animation never fires.

## The print sheet

A first-class surface, not an export. Light theme, own scale.

- **A4 portrait, exactly one page.** Overflow is a bug, and "does it print correctly" is an
  acceptance criterion.
- `@page { size: A4; margin: 14mm; }`
- Type in pt: title 18pt / row primary 13pt / numbers 15pt bold tabular / body 10.5pt / footnote 9pt.
- Black on white. No screen colour survives; no state hue is load-bearing because every state
  already carries a word and a shape.
- Structure: 期 header (site, block, pre/post, date) → per-participant rows with pre, post, and
  change → roster summary → a footer stating what the instrument measured and, honestly, what it
  does not conclude.
- **The footer is a regulatory surface**, not boilerplate. Per the invariant 3 amendment the sheet
  reports a measured time to a human; it never applies the 14-second threshold or states a
  determination. Wording is fixed in the strings module and should not be edited casually.

## Accessibility floor

Restating, because it applies before every rule above:

- Participant-facing: nothing below `2rem`; hero ~`12rem`; contrast ≥7:1 (achieved: 8.5–13.3:1).
- Colour never alone — colour + word + shape, always.
- Facilitator tap targets ≥64px; no hover-only affordances.
- `prefers-reduced-motion` honoured on all four animations.
- Tabular figures enforced twice (feature setting plus fixed cells).
- Full zh-TW coverage, bundled, no network dependency.
