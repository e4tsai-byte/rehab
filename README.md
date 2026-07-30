# VeloCare — Tier 1 UI

Frontend for the Tier 1 measurement surface: an automated **five-times sit-to-stand** assessment
for community elder-care centres in Taiwan, and the one-page sheet a site files with its funding
report.

**This build is fixtures only. Every rep count and every time is simulated — there is no pose
estimation and no measurement.** The one real camera code path is an opt-in framing preview and
participant self-view: it binds a `MediaStream` to a `<video>` and does nothing else. No canvas, no
capture, no analysis, no retention.

Read `PRODUCT.md` for who this is for and `DESIGN.md` for the visual system. Both outrank this
file, and `CLAUDE.md`'s hard invariants outrank all three.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # tsc --noEmit && vite build  →  dist/
npm run preview    # serve the built bundle
npm run typecheck
```

Node 22+. Built and verified on Node 26 / npm 11.

## What you are looking at

Four surfaces plus a print artifact, under a header that renders **the path to where you are**:

```
場次設定 ──► 本期名單 ──┬──► 王阿姨・量測 ──► 王阿姨・本次量測 ──► 王阿姨・紀錄
                       ├──► 王阿姨・紀錄
                       └──► 報表
```

Every segment of that path is a 64px button. Home is always the first segment; back is always the
one before the current, which is one level *up* rather than a visit history. The header answers
where you are; the rail carries the forward action.

The theme is **positive polarity — dark ink on a cream ground**. That is an acuity decision: a
bright field constricts the pupil, which increases depth of field for a 75–90 year old reader. The
printed sheet stays strictly black on white.

| Surface | What it is |
|---|---|
| **Setup** | 據點, 期, phase, today's attendance, camera framing check. Where a session is configured. |
| **Roster** | A 期 in progress, marked 前測 or 後測. Status per participant. Deliberately carries **no times**. |
| **Trial** | The 5×STS itself. Mirrored self-view on the left half, one number and five pips on the right. |
| **Result** | Straight after a trial: the time, any flag, and the next participant's name. Deliberately carries **no attempt history** — the participant is still sitting in front of the screen. |
| **Detail** | One participant, both phases, per-rep splits, 差值, and the full append-only attempt history. |
| **Sheet** | A4, one page, printable. **This is the product.** |

### Press `S` for the scenario switcher

The deployed demo keeps it reachable on purpose, so anyone can walk every state without a camera:
each trial script (typical, slow, three-reps-only, hand contact, tracking loss and restart), each
recorded outcome, and the sheet with mixed results. It never prints.

## The seam — where October plugs in

Everything the UI knows about data goes through one interface:

```
src/data/SessionDataSource.ts     ← the contract
src/data/fixtures.ts              ← this build (simulated)
src/data/context.tsx              ← useDataSource(); the only way components reach data
src/main.tsx                      ← the ONE line that names a concrete source
```

In October, `main.tsx` becomes:

```ts
const source = new LocalhostDataSource('http://127.0.0.1:8765')
```

and nothing else changes. The Python capture-and-decision process serves that same interface over
localhost HTTP/WebSocket on the appliance; the web UI runs full-screen in a kiosk browser on the
same machine. There is a local server. There is no remote backend, no cloud, no account, and no
network dependency.

`TrialEvent` in `src/domain/types.ts` is the wire shape the pose pipeline must emit:
`tracking` · `rep` · `hand_contact` · `void` · `settled`. The fixture source emits exactly these.

**If a component ever imports `data/fixtures` directly, that is a bug.**

## What is simulated

- **Everything numeric.** Rep detection, timings, seat height, tracking state. All scripted in
  `src/data/fixtures.ts`.
- **The 期.** A fictional 據點, 12 pseudonymous participants (`P-0041`…`P-0052`) with staff-style
  display labels. No real person is represented; there are no identity fields anywhere in the
  type system, by invariant.
- **The record log.** Pre-populated append-only, deliberately mid-flight: 前測 complete for all 12,
  後測 partway through with one of every edge case already recorded, including a tracking-loss void
  followed by a successful restart and a correction stacked on a completed trial.

## What is real

- The three surfaces, all interaction, and every state transition.
- **The print sheet**, including its regulatory footer.
- The append-only record model with corrections-as-records (`src/domain/records.ts`).
- All five edge cases as first-class recorded outcomes, not error handling.
- Bundled fonts, the accessibility floor, and the print stylesheet.

## Decisions that deviate from the original brief

Recorded here so a later reader knows they were deliberate.

**1. No live timer during a trial.** The brief asked for "rep count, running total time, per-rep
times as they land". `PRODUCT.md` defines the participant as reading *at most four characters at a
time*, which a count plus a clock plus an accumulating column violates. Nobody acts on elapsed
time mid-trial: the participant needs reps-remaining, the facilitator needs to know tracking is
alive so they can catch a void. The rail carries a tracking-health indicator where the clock would
have been. Elapsed time is captured throughout and appears on Result and on the sheet.

**2. Outcome detail is facilitator-facing only.** On a settled trial the participant sees 完成 and
their pips, nothing else. `未完成五次` and `手部支撐` appear in the rail. Putting "you did not
complete five" in front of someone at 48px is the exact harm the tone rule forbids.

**3. The roster shows no times.** Ten older adults listed with their times, on a monitor in a small
shared room, is a leaderboard. Numbers live on Result (one person at a time) and on the sheet
(read alone by the site lead).

**4. 差值 is withheld when the two trials are not comparable.** A difference is only computed when
both trials are protocol-valid **and** over the same number of repetitions. Comparing a 5-rep time
against a 4-rep time produced a −4.2 s "improvement" for a participant who did *less* work; the
cell now reads 不可比較 and the footer explains why. This is a funding document.

**5. Shapes are SVG, not Unicode.** Noto Sans TC does not cover `▮ ▯ ◇ ⊘`. Since colour never
carries meaning alone, the shape is load-bearing and cannot depend on font coverage.

## Fonts

Noto Sans TC, bundled locally via `@fontsource/noto-sans-tc`, **never a CDN** — the appliance has
no network. Fontsource ships CJK as many small `unicode-range` subsets, so the browser fetches only
the ranges a page actually uses despite the large total on disk.

Digits get two independent guarantees, because a numeral that changes width as its value changes is
disqualifying on an instrument: `font-variant-numeric: tabular-nums` globally, **and** a `Digits`
primitive that renders each character in a fixed `1ch` cell. The second survives a fallback face,
which the first does not. Verified: all ten digits measure 113.27 px at the hero size.

## Verified

Measured in a headless browser, not eyeballed.

- **All seven screens audited**, not just the roster: 421 text nodes across setup, roster, detail,
  trial cue, trial running, result and the sheet. Zero below 4.5:1, minimum 5.28:1. Zero controls under
  64 px once `<input>`s are resolved to their wrapping `<label>`, which is the actual tap target.
  One `<h1>` per surface, no duplicates.
- **Roster fits the class.** All **12 of 12 rows fully visible at 1280×800 with no scrolling**
  (neither the field nor the page scrolls), and 12 of 12 at 1600×900. Two columns: twelve rows at
  the 64 px tap floor is 768 px of rows alone, which does not fit under an 800 px viewport at any
  type size, so the tap target rather than the typography is the binding constraint.
- **Contrast.** Full-page audit resolves every colour through a canvas (`getComputedStyle` returns
  `oklch()` verbatim, so string parsing silently reports 1.00:1). **Zero below 4.5:1**,
  minimum 5.28:1. Every text node in the locked participant field measures **≥8.19:1**
  against a 7:1 floor. Token matrix is in `DESIGN.md`; all values there are measured, and three
  hand-computed sets have now been wrong — including the first draft of this cream palette, whose
  estimates would have shipped `--ink-muted` at 3.80:1.
- **Print.** The sheet is **889 px of content against 1017 px of A4 printable height** (297 mm less
  28 mm of `@page` margin) — 33.8 mm of headroom, one page. Emitting a PDF returns a single page.
  Note the app shell needs its `height:100%` / `overflow:hidden` flattened in `@media print`, or a
  sheet that fits paginates to two pages anyway.
- **Print stays black on white.** The screen's cream ground does not leak onto paper: under print
  emulation the sheet background measures pure `255,255,255` and **all 104 text nodes measure
  chroma 0 on both foreground and background**. Verified, not assumed.
- **Tap targets.** Zero facilitator controls under 64 px; smallest measured row is 66 px. (The
  scenario switcher toggle is 44 px: a demo-only affordance, absent from the product and from
  print.)
- **Digits.** All ten digits measure **113.27 px** at the hero size, unchanged.
- **Camera.** The self-view acquires a real 1280×720 stream, and **zero `<canvas>` elements exist
  in the DOM** while it is live. Denying permission leaves the trial flow fully working on fixtures.
- **Trial split.** The trial screen is two equal halves: mirrored self-view left, readout right.
  Verified across **thirteen viewport sizes** — exact 50/50 where split, no horizontal overflow, no
  clipping, and `.readout__count` the largest element in the right half at every one. Stacks below
  900 px or in portrait. Smallest hero anywhere is 6rem, three times the 2rem participant floor.
  With no camera the readout takes the whole field. See `DESIGN.md` for what this gave up: the rep
  count is no longer the largest element on screen, only in its half.
- **Reduced motion.** All four animations collapse to instant state swaps; content is never gated
  behind a transition.
- **No horizontal overflow** at 1280×800 or 1600×900.
- **CJK line breaking.** 雙手抱胸，坐穩後由工作人員開始。 holds one line at 1280×800, 1600×900,
  900×700 and 620×700, so 工作人員 never splits across lines.

### Known limits

- The sheet fits **up to about 16 participants** on one page. Beyond that it needs a second page or
  a smaller row rhythm; the minimum funded class size is 10.
- **zh-TW only**, a dated exception to invariant 5 recorded in the design doc. Every string already
  routes through `src/i18n/strings.ts`, so English is an implementation of the `Strings` type rather
  than a refactor.
- Layout targets a fixed landscape monitor. It degrades safely on a laptop for the demo URL, but it
  is not a responsive product and phones are out of scope.

## Not built, on purpose

Physiotherapist dashboard · longitudinal trend charts · live rep-by-rep form coaching · multi-person
tracking · **any pose estimation, landmark extraction or MediaPipe code** · mobile app · cloud
backend · accounts · a second exercise · TTS · automatic capacity test.

The one piece of camera code that does exist is the opt-in framing preview: it binds a
`MediaStream` to a `<video>` and does nothing else. No canvas, no frame capture, no analysis, no
retention. Rep counts and times are still entirely fixture-driven.

**Tier 2** (working sets, load ladder, stop rule) is gated on the August experiment described in the
design doc and is deliberately absent. There is no velocity or effort UI anywhere in this build.

## Deploy

Not yet deployed. `npm run build` produces a self-contained `dist/` with a relative base, so it
works from a subpath, an arbitrary static host, or `file://`.

Whatever host is used, the deployed page must keep the persistent 示範模式 · 模擬資料 marker. It is
not decorative: this is a UI prototype with simulated data, and it must never read as a working
measurement system.
