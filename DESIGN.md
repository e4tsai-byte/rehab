# Design

Visual system for VeloCare Tier 1. Strategy lives in `PRODUCT.md`; hard invariants live in
`CLAUDE.md`. Where this file and those conflict, they win.

## Theme

**Single theme, positive polarity: dark ink on a cream ground. No toggle.**

Scene sentence that produced it: *a surveyor's field notebook on a bench under fluorescent light —
warm ruled paper, dense dark ink, one blue pencil used only where something must be marked, and
nothing on the page that is not a measurement or a label.*

This replaces the earlier dark theme. The reversal is an **acuity decision, not a mood one**, and
that distinction governs how the values are picked:

1. **The field is the brightest surface.** A bright field constricts the pupil, increasing depth of
   field and reducing the visual cost of aberration and lens opacity for a 75–90 year old eye. The
   whole justification rests on luminance, so luminance is what the cream is chosen for.
2. **Cream, not white.** `oklch(0.955 0.014 88)`. Pure white under overhead fluorescent light
   produces veiling glare that gives back what the pupil constriction won. Chroma stays under 0.02:
   enough to read as warm paper, little enough that it never reads as a colour.
3. **The hero readout stays achromatic.** Near-black ink, not the accent hue. Cataracts scatter
   light and flatten contrast sensitivity; chroma on a 192px numeral costs real luminance contrast
   at 3 m. This rule is independent of polarity and survived the flip unchanged.
4. **The rail is still a different material.** It is now *darker* than the field where it used to be
   lighter. The zone law never depended on which direction that difference ran, only that it exist.

What did **not** change: the 7:1 participant floor, the ban on colour carrying meaning alone, the
2rem participant floor, tabular figures, and the tap-target floor.

The printed sheet is a separate surface and is **strictly black on white** — verified, not assumed.
The cream must never reach `print.css`.

## Color

OKLCH throughout. Strategy: **Restrained** — the floor for product register, and correct here.
Accent carries state only, never decoration.

The chromatic range is a **light-to-dark blue ramp**. Blue rather than the old olive seed because
on a warm cream ground a cool hue separates cleanly at every lightness, and because the ramp has to
carry both a near-black ink and a mid-tone accent without either reading as a different family.
Components never use a ramp step directly; they go through a semantic token, so the mapping lives
in one place.

```css
/* Blue ramp — the primary chromatic range */
--blue-50:  oklch(0.968 0.016 250);   --blue-500: oklch(0.560 0.148 250);
--blue-100: oklch(0.928 0.034 250);   --blue-600: oklch(0.492 0.152 250);
--blue-200: oklch(0.868 0.058 250);   --blue-700: oklch(0.424 0.140 250);
--blue-300: oklch(0.782 0.088 250);   --blue-800: oklch(0.340 0.108 250);
--blue-400: oklch(0.676 0.118 250);   --blue-900: oklch(0.262 0.070 250);

/* Surfaces — cream, chroma under 0.02. The FIELD is the brightest. */
--bg:              oklch(0.955 0.014 88);   /* room-facing field                */
--surface:         oklch(0.911 0.018 88);   /* facilitator rail — darker         */
--surface-raised:  oklch(0.981 0.008 88);   /* controls, rows — sit up           */
--line:            oklch(0.848 0.021 88);   /* hairlines                         */
--line-strong:     oklch(0.560 0.070 250);  /* focus ring, active borders        */

/* Ink — near-black with a slight blue cast, so text belongs to the ramp's
   family rather than reading as a neutral pasted on top. */
--ink:             oklch(0.250 0.028 255);  /* hero readout, participant text    */
--ink-secondary:   oklch(0.397 0.032 255);  /* participant-safe secondary        */
--ink-muted:       oklch(0.468 0.028 255);  /* facilitator-read text only        */

/* State — the machine. functional only */
--accent:          var(--blue-700);         /* tracking live                    */
--alert:           oklch(0.451 0.185 27);   /* tracking LOST — the only alarm   */

/* Status channel — a PERSON'S outcome. Facilitator surfaces only. */
--st-measured:     oklch(0.403 0.145 250); /* 已量測    · blue                  */
--st-partial:      oklch(0.390 0.095 195); /* 未完成五次 · teal                  */
--st-protocol:     oklch(0.410 0.105 65);  /* 手部支撐  · amber                 */
--st-unable:       oklch(0.416 0.135 310); /* 無法進行  · violet                */
--st-discarded:    var(--ink-muted);       /* 已作廢 — an absence, not a hue    */
```

### Contrast — measured, not calculated

Every number below was read back in the browser by painting the token to a canvas and computing
WCAG relative luminance. **Three revisions of this file have now carried hand-computed ratios that
were wrong in both directions**, most recently the first draft of the cream palette, whose
estimates were off by up to 1.2 ratio points and would have shipped `--ink-muted` at 3.80:1. OKLCH
lightness is not a proxy for contrast ratio; re-measure after any token change.

| Token | `--bg` | `--surface` | `--surface-raised` |
|---|---|---|---|
| `--ink` | **14.10** | 12.29 | 15.24 |
| `--ink-secondary` | **8.19** | 7.14 | 8.85 |
| `--ink-muted` | **6.06** | 5.28 | 6.55 |
| `--accent` | **7.21** | 6.29 | 7.80 |
| `--alert` | **7.14** | 6.22 | 7.72 |
| `--st-measured` | **7.88** | 6.87 | 8.52 |
| `--st-partial` | **7.69** | 6.70 | 8.31 |
| `--st-protocol` | **7.97** | 6.95 | 8.62 |
| `--st-unable` | **8.09** | 7.05 | 8.74 |
| `--st-discarded` | **6.06** | 5.28 | 6.55 |

All three ink tokens clear 4.5:1 on all three surfaces. `--ink` and `--ink-secondary` clear the
**7:1 participant floor** on `--bg`, which is the surface the participant field is painted in;
`--ink-muted` does not, and is confined to facilitator-read text.

**The scoped guarantee.** `--ink-muted` never appears inside **`.field--locked`** — the trial
screen while a trial is live — and that is verified rather than asserted: every text node in the
locked field measures **8.19:1 or better** against a 7:1 floor. The looser claim, that it never
appears in `.field` at all, is **false**: the roster occupies the full field between trials and
uses `--ink-muted` for row ids and metadata, at 6.06:1. That is correct, because the roster is read
by the facilitator, not by someone mid-effort at 3 m. The floor applies to participant-facing
surfaces, and the relaxed zone is not one.

Note the ordering is no longer monotonic across the three surfaces: `--surface-raised` is now
*lighter* than `--bg`, so ratios against it are the highest rather than the lowest. That is the
polarity flip showing up in the table, and it is why the whole table was re-measured rather than
rescaled.

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
| Complete | `--st-measured` | 已量測 | `bar-filled` |
| Incomplete | `--st-partial` | 未完成五次 | `bar-hollow` |
| Protocol invalid | `--st-protocol` | 手部支撐 | `triangle` |
| Unable to perform | `--st-unable` | 無法進行 | `diamond` |
| Aborted | `--st-discarded` | 已作廢 | `slash-circle` |
| Camera signal live | `--accent` | 鏡頭訊號正常 | `signal-full` |
| Camera signal stalled | `--alert` | 鏡頭訊號不穩 | `signal-weak` |
| Camera off | none (`--ink-secondary`) | 鏡頭已關閉 | `signal-none` |

Three disjoint shape families, so a facilitator glancing sideways never confuses them:

- **Tracking** — circles and a square. Is the machine watching?
- **Outcome** — bars, triangle, diamond, slash. Did the person finish?
- **Camera signal** — a stepped meter. Is the lens still delivering frames?

Awaiting measurement keeps `circle-hollow` and stays achromatic on purpose: it is the majority
state at the start of a session, and colouring eight of twelve rows would destroy the contrast that
makes the measured ones scannable.

### Outcome colour — revised

The original rule was **"only two states carry colour, and both are about the machine; everything
describing a person's result is achromatic."** That was too strong, and the roster proved it: at
twelve rows, states separated only by a small grey glyph could not be scanned, and the facilitator
lost the one thing that surface exists to answer — who is left. Colour is now a **third redundant
channel** on outcome states, on facilitator surfaces only.

The part of the old rule that was actually load-bearing is kept intact:

1. **No outcome state is red.** `--alert` (hue 30) still means the MACHINE failed — tracking lost,
   void — and never that a person did badly. `PRODUCT.md`: "failure states are not failures." A
   participant who used their hands did not malfunction, and a red row would tell them they did.
2. **Hue is category, not quality.** The four chromatic outcome tones are tuned to equal *measured
   luminance* rather than to equal OKLCH lightness — not the same thing, which is why each hue
   carries a slightly different L. They land at **7.69–8.09:1** on `--bg`, a spread of 0.40 of a
   ratio point, so none of them pops as an alarm relative to the others. It reads as a patch panel,
   not a traffic light. This is measured, not asserted.
3. **Never inside `.field--locked`.** The participant field during a live trial renders no chip at
   all, so it stays exactly as austere as it was. The trial screenshot is unchanged.
4. **Colour is still never alone.** Every state keeps its word and its SVG shape. Delete every
   `--st-` token and the surface remains fully readable.

The printed sheet is deliberately excluded: it is black on white, and a mono office printer would
render these five hues as five indistinguishable greys. Paper keeps word plus shape.

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

/* Facilitator band — NOT the participant band. Read at ~0.6 m by
   a standing operator looking at the machine. Ordinary working-UI
   sizes; the 2rem floor does not apply and applying it was a bug. */
--t-fac-xl: 1.75rem;   /* 28px · facilitator emphasis            */
--t-fac-lg: 1.25rem;   /* 20px · row primary, dialog titles      */
--t-fac:    1.0625rem; /* 17px · controls, body, labels          */
--t-fac-sm: 0.9375rem; /* 15px · metadata floor                  */
```

Ratio ≈1.25 in the participant band, ≈1.13–1.18 in the facilitator band per the product register
(1.125–1.2 is the product-UI norm; the ≥1.25 rule is a brand-surface rule). Line-height 1.1 on the
hero (a 192px numeral needs no leading), 1.5 on prose.

### The floor is scoped, and the scoping is mechanical

The accessibility floor — nothing under 2rem, ~12rem primary, 7:1 — is **participant-facing only**.
An earlier revision applied it to the roster, which is a facilitator surface, and the cost was
concrete: at 1280×800 only three of twelve rows were on screen. A roster you must scroll cannot
answer "who is left", which is the only question it exists to answer.

The separation is enforced by token vocabulary rather than by vigilance:

- `.field--locked` is built **exclusively** from `--t-hero` / `--t-display` / `--t-part`, every one
  of which is ≥2rem. No `--t-fac-*` token appears inside it.
- Therefore the facilitator band can be re-scaled freely without any possibility of breaching the
  participant floor. That is why the change above was safe.
- `.field--locked` also sets `font-size: var(--t-part)`, so `ch` and `em` measured inside the
  participant zone resolve against the participant size. Without this, lowering the facilitator
  scale silently narrowed `.cue` and re-broke 工作人員 across a line. Measure-widths in that zone
  depend on this rule.

**The 64px tap target is not part of the floor and does not move.** It is about a hurried standing
user, not about visual acuity, and it applies to every facilitator control at every type size. It
is also the binding constraint on the roster: twelve rows × 64px is 768px of rows alone, which does
not fit under an 800px viewport at any type size. That is why the roster is two columns.

### Surface classification

| Surface | Audience | Floor applies |
|---|---|---|
| Trial screen, `.field--locked` (cue, readout, 完成, void) | **Participant**, 2.5–3 m, mid-effort | **Yes** |
| Roster | Facilitator, standing at the machine | No |
| Result | Facilitator (participant may glance) | No |
| Correction / abort / unable dialogs | Facilitator | No |
| Facilitator rail, all surfaces | Facilitator | No |
| Framing preview | Facilitator | No |
| Demo banner, scenario switcher | Observer / demo only | No |
| Printed sheet | Site lead, on paper | Own pt scale |

The result surface keeps `--t-display` on the measured time. That is a hierarchy decision about the
surface's primary content, not the participant floor leaking back in.

## Layout — the zone law

This is the resolution of the central structural problem: **one machine, one monitor, two
audiences.**

```
┌────────────────────────────────────────────┐
│                                            │
│         PARTICIPANT FIELD  ~72vh           │   --bg
│                                            │
│   During an active trial this zone holds   │
│   ONE number, one pip row, and the         │
│   subordinate self-view. Nothing else.     │
│   ┌────┐                                   │
│   │self│  <- corner. never beside the      │
│   └────┘     number.                       │
├────────────────────────────────────────────┤   1px --line
│  FACILITATOR RAIL  ~28vh        --surface  │
│  All controls. All machine state.          │
└────────────────────────────────────────────┘
```

**Rules:**

- The rail is a **different surface lightness**, so it reads as a separate device panel rather
  than as part of the readout. This is the whole trick: the two audiences are separated by
  material, not by font size.
- **During an active trial the Participant Field is locked to one number, the pips, and the
  self-view.** No clock, no per-rep list, no name, no logo. `--ink-muted` is banned from this zone
  by contrast, which makes the rule mechanical.
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
| `DemoBanner` | Persistent honesty marker. Cannot be dismissed. One dense line. |
| `AppHeader` | Where you are, how to get back, which phase. One `<h1>` per surface. |
| `Logo` | Placeholder mark in a dashed slot. Obviously provisional. |
| `Icon` | Wayfinding and action glyphs. SVG, never a font glyph. |
| `CameraSelfView` | Mirrored participant self-view. `frame` and `pip` sizes. |
| `CameraControls` | Facilitator half: opt-in button, privacy text, unavailable paths. |

### The self-view and the framing preview

Functional, not decorative. A Tier 1 trial **cannot pause**: tracking loss voids it and forces a
restart from the cue with an older adult already out of the chair. Framing has to be right before
the start press, and the participant benefits from seeing themselves the way they would in a video
call.

It is split in two, because the two audiences want different things from the same stream:

| | Where | Audience |
|---|---|---|
| `CameraSelfView` | Participant field | The participant, adjusting their own position |
| `CameraControls` | Facilitator zone | The facilitator: opt-in button, privacy text, status |

**Mirrored.** `transform: scaleX(-1)`. A self-view is the one case where the mirrored image is
correct: the participant is adjusting their own body against it, and unmirrored, leaning left moves
your image right. An earlier revision had a second unmirrored feed for the facilitator on the
argument that mirroring makes "move them left" mean the wrong thing. That argument loses: the
facilitator is standing beside the person and can see them directly, and from the screen they only
need "is the whole person inside the box", which mirroring does not affect.

#### The gaze budget

The rep count must remain the largest element on screen, unambiguously. That is a measurable claim,
so it is measured, and it is held to the **weakest axis rather than the flattering one**:

| | Count | Self-view (pip) | Ratio |
|---|---|---|---|
| Width | 501px | 128px | **3.91x** |
| Height | 192px | 96px | **2.00x** |
| Area | 96,192px² | 12,288px² | **7.82x** |
| Centre-to-centre separation | | | **611px** |

An earlier size (208px) was 2.96x by area but only **1.23x by height**, which is not unambiguous.
Area is the flattering axis for a wide numeral against a 4:3 box; height is the binding one, and
128px is the size that puts the pip at 2.0x on it.

Placement is **bottom-left, diagonally opposite the centred readout** — deliberately not beside the
number, where the two would contest the same fixation. It is absolutely positioned so it cannot
displace or resize the readout by existing, and it is rendered at the running stage only: once the
trial settles the self-view has no function, so it goes rather than lingering as decoration.

At the cue stage the self-view is large (360px) and sits **beside** the cue text rather than above
it. Stacked, the two together overflowed an 800px viewport and clipped the video at the top and the
cue hint at the bottom. The screen is wide and short; spend the horizontal room.

#### The honest limitation

**Area is not salience.** A moving image attracts gaze pre-attentively in a way a static numeral
does not, and peripheral vision is *more* motion-sensitive, not less — which is exactly where a
corner pip sits. The size ratios above bound how much of the screen the video occupies; they do not
bound how much attention it takes. Nothing in this file should be read as evidence that the count
wins the gaze battle in a real room. That needs testing with real participants, and it is the
single highest-value thing to test about this surface.

#### Invariant 1 is untouched

`useCameraPreview.ts` obtains a `MediaStream` and binds it to a `<video>`. There is no canvas, no
`drawImage`, no `getImageData`, no `ImageCapture`, no `MediaRecorder`, no pose estimation, no
landmark extraction, no frame buffer, no upload, no storage. Verified in the browser: **zero
`<canvas>` elements exist in the DOM while the preview is live.**

Liveness comes from `MediaStreamTrack` events plus `requestVideoFrameCallback` *metadata*
(presented-frame counts and timestamps). Neither exposes pixels. It reports **鏡頭訊號** (camera
signal), not tracking confidence: this build runs no pose estimation, so a confidence figure would
be invented. What it can honestly report is whether frames are still arriving, which is also what
actually predicts the void this preview exists to prevent.

Every unavailable path — permission denied, no camera, insecure origin, no browser support — is
ordinary text at the same weight as the idle copy, because none of them is an error and none stops
the fixture demo working.

### Roster carries no times

A screen listing ten older adults with their times, in a small shared room, is a leaderboard. The
design doc names this as the most likely route to facilitator veto and a real dignity harm. The
roster shows **status only**: outstanding, done, protocol-invalid, unable. Numbers live on the
result surface (one participant at a time) and on the sheet (which the site lead reads alone).

## Icons

Icons exist for **wayfinding and status scanning**, which helps an older user base and adds a
channel alongside word and shape so colour is never carrying meaning alone.

Two components, and the split is the policy rather than an accident:

| | Answers | Used for |
|---|---|---|
| `Shape` | "what **state** is this in" | Outcome and tracking marks |
| `Icon` | "what **place** is this" / "what will this **do**" | Header surfaces, control verbs |

**Rules:**

- **Every icon answers one of those two questions.** An icon added to make a screen feel friendlier
  is the consumer-fitness failure the anti-references rule out, and does not ship. No celebration
  marks, no encouragement glyphs, no mascots, no progress ornaments.
- **SVG, never font glyphs.** Noto Sans TC has no coverage for arrows, cameras or document marks,
  and an uncovered codepoint renders as a tofu box — worse than no icon, because the user cannot
  tell it is missing rather than broken. Same argument as `Digits` and `Shape`.
- **Never the sole carrier of meaning.** Every icon is `aria-hidden` and sits beside a text label;
  `RailButton` has no icon-only variant, deliberately.
- **`currentColor` throughout**, so an icon inherits the contrast of the text beside it and cannot
  drift below the floor independently.

Three disjoint shape families exist so a facilitator glancing sideways never confuses them:
tracking is circles and a square, outcomes are bars and polygons, camera signal is a stepped meter.

## Navigation — hub and spoke

This product is a workflow, not a website, and a row of top-level tabs would misdescribe it. There
are four surfaces and only one is a place you dwell: **the roster is the hub**, and trial, result
and sheet are spokes entered for one participant or one task and returned from. A tab bar would
imply you can be "in" the trial surface without a participant, which is not a state that exists.

The header carries exactly three things:

1. **Where you are** — the current surface, named, with its icon. This is the page's `<h1>`, so
   every surface now has exactly one and the heading order is well-formed. Before this the trial
   screen had no heading at all.
2. **How to get back** — one control, one destination, one label, one position, on every spoke. A
   facilitator never has to learn a second way back or decide which back is the right one. This is
   why `回名單` was removed from the trial rail and `關閉` from the sheet toolbar: two controls to
   one destination is one too many.
3. **Which phase** — pre or post, **read-only**. Wayfinding, not a control. Switching phase is a
   facilitator action and lives in the rail, because a thing that changes what you are recording
   must not sit one pixel from a thing that only says where you are.

Everything else stays put. The rail keeps the primary forward action on each surface, which is what
a standing operator's thumb is already aimed at. **The header is for orientation; the rail is for
doing.**

A judge opening the demo URL cold reaches every surface from the roster without the scenario
switcher: `開始量測` on any outstanding row, `查看紀錄` on any measured row, `產生報表` in the rail.

## The logo slot

Deliberately provisional. There is no brand for this product yet and inventing one here would be a
claim the project cannot back, so the slot is filled with something that reads unmistakably as a
placeholder rather than as a weak logo: the mark sits in a **dashed outline**, the standard
convention for artwork-pending, and carries a 標誌暫定 label. Whoever designs the real identity
replaces `Logo.tsx`; nothing else needs to change.

## Spacing & radii

```css
--s-1: 0.25rem;  --s-2: 0.5rem;   --s-3: 0.75rem;  --s-4: 1rem;
--s-6: 1.5rem;   --s-8: 2rem;     --s-12: 3rem;    --s-16: 4rem;   --s-24: 6rem;

--r-xs: 3px;   /* status marks, chips, hairline insets   */
--r-sm: 6px;   /* inputs, small controls, badges         */
--r:    10px;  /* buttons, roster rows, form options     */
--r-lg: 14px;  /* panels, dialogs, video surfaces        */
--r-xl: 20px;  /* large containers only                  */
```

Rhythm is varied deliberately: the rail is dense (`--s-3`/`--s-4`), the participant field is
extremely sparse (`--s-16`/`--s-24`). The contrast in density is itself the signal that the two
zones belong to different readers.

### The radius scale

The original 2 / 4 / 6px read as machined metal, which suited the dark instrument theme. At twelve
roster rows it also read as twelve hard rectangles stacked, and hard rectangles are tiring to scan.
The scale above is softer without becoming an app.

Rules, so this stays a scale rather than a habit:

- **Every radius comes from the scale.** No ad-hoc values anywhere. If something needs a radius the
  scale does not have, the scale is wrong and gets changed here first.
- **Pick by size of thing, not by feel.** A 20px radius on a 64px control looks inflated; a 6px
  radius on a dialog looks unfinished. The step tracks the element's size.
- **The ceiling is 20px and it is for large containers only.** Nothing is pill-shaped. A fully
  rounded control reads as a consumer app badge, which the anti-references rule out.
- **One exception, and it is geometric rather than stylistic:** the rep pip is `border-radius: 50%`
  because a pip is a circle. It is the only 50% radius in the product.

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

- Participant-facing: nothing below `2rem`; hero ~`12rem`; contrast ≥7:1 (achieved: 8.19–14.10:1
  on the cream ground, measured through a canvas).
- Colour never alone — colour + word + shape, always.
- Facilitator tap targets ≥64px; no hover-only affordances.
- `prefers-reduced-motion` honoured on all four animations.
- Tabular figures enforced twice (feature setting plus fixed cells).
- Full zh-TW coverage, bundled, no network dependency.
