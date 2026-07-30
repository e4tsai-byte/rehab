# Product

## Register

product

## Users

Four, wanting different things. There is no fifth.

**1. Participant, 75–90.** Reads the screen from 2.5–3 m, mid-physical-effort, often without
reading glasses, possibly with cataracts. Never touches the interface. **Reads at most four
characters at a time.** Needs to know two things: how many reps done, and am I finished.

**2. Facilitator / 照服員.** Part-time care worker, no clinical training, standing, running a room
of ten. **Holds an absolute veto** — a device that adds work, exposes their judgement, or
disrupts the class simply stops being switched on. Needs to run ten people through a 30-second
trial each without losing control of the class.

**3. 據點負責人 (site lead) — the adoption decision-maker.** Rarely present at a session. Is not
buying strength or technology. Is buying **defensible evidence** for annual inspection and next
year's funding. **Their entire experience of this product is the printed sheet.**

**4. Nobody else.** No physiotherapist surface, no administrator console, no clinician view.

## Product Purpose

A fixed-camera measurement instrument for community elder-care centres in Taiwan. Not a consumer
product, not an app. An appliance: a Mac mini or NUC with one camera and one monitor, installed at
a care station, no network. Nobody downloads it, buys it, or makes an account.

Tier 1, this build: automate the government-mandated pre/post functional assessment — five
sit-to-stands, arms crossed, timed — for a class of ten or more older adults, and print a
one-page sheet the site submits with its funding report.

**The printed sheet is the product. Not the screen.** It is a first-class surface, not an export.
A4, one page, large type, handed physically to a manager who files it.

Success is not a good-looking screen. Success is a site lead filing a sheet without editing it,
and a facilitator switching the machine on again next week.

## Brand Personality

**Dignified, austere, instrumental.**

These are adults doing hard physical work. Not patients being managed, not users being engaged.
No cheerfulness, no encouragement, no exclamation marks. A finished trial reads **完成**. Never
停止, never 加油, never 太棒了.

Failure states are not failures. Someone who manages three reps instead of five has a **valid
recorded outcome**, and the screen must not make them feel they broke something.

The participant-facing surface should read as **an instrument** — a stopwatch, a scale, a
thermometer — not as software.

## Anti-references

- **Consumer fitness apps.** Activity rings, streaks, confetti, badges, progress celebrations,
  gamification of any kind.
- **Glossy health-tech SaaS.** Gradient cards, glassmorphism, hero sections, marketing polish,
  dashboard grids of KPI tiles.
- **Clinical software.** Dense tables, tiny type, chart walls.
- **Anything that reads as "impressive."** Austere is the correct outcome, not a failure of
  ambition. Do not let anti-slop rules push this toward visual interest.

## Design Principles

1. **The sheet is the product.** The screen serves a 30-second interaction; the sheet is what the
   decision-maker actually holds. Design the artifact first, and never treat printing as an
   export path bolted onto a UI.

2. **The facilitator has a veto, so every addition must reduce their work or be invisible.** If a
   feature makes them think, explain, or intervene, it is a liability. This product's failure mode
   is not a bug, it is a switch left off.

3. **Four characters at a time.** One surface, one number, one decision. Anything competing with
   the primary readout for the participant's attention is removed rather than shrunk.

4. **A valid outcome is never an error.** Incomplete, hand-assisted, unable, aborted: these are
   recorded results with their own legible states, not exceptions, warnings, or red text.

5. **The record is append-only, and correcting it must feel ordinary.** A facilitator who cannot
   fix the machine will either stop using it or start gaming it. Correction is a first-class
   action, never an admission of fault.

## Accessibility & Inclusion

Applies **before any aesthetic rule**, not after.

- **Participant-facing:** nothing below 2rem; primary number ~12rem; contrast ≥7:1.
- **Colour never carries meaning alone** — always paired with a word and a distinct shape.
- **Facilitator tap targets ≥64px.** No hover-only affordances.
- **Honour `prefers-reduced-motion`.** Motion is functional only; nothing decorative.
- **Typography:** Traditional Chinese only in this build, with complete zh-TW coverage. Chinese is
  the entire interface, never a fallback behind a Latin face. English arrives later and must
  optically match for weight and x-height.
- **Numbers are the primary content.** Tabular figures only. No proportional-width digits, no
  digit that changes width as it changes value.
- **Cataract and contrast-sensitivity consideration:** the hero readout is achromatic — near-black
  ink on the cream ground — rather than a saturated hue, because chroma costs luminance contrast at
  3 m for an eye that scatters light. That rule is independent of polarity and survived the flip.
- **Administrative thresholds are reported as counts, never as warnings.** The ≥10 average
  attendance floor decides whether a 期 is funded at all, so the number is shown — beside the
  threshold, in ordinary ink, with no colour, icon, or instruction attached. The device reports;
  the 據點 decides. This is distinct from the 14-second ICOPE threshold, which is *clinical* and is
  therefore absent from the product entirely rather than merely unstyled.
- **Icons are functional only.** Every icon answers "what is this place" or "what will this do".
  They exist for wayfinding and status scanning, which helps an older user base, and they add a
  channel alongside word and shape so colour is never carrying meaning alone. Nothing is added to
  make a screen feel friendlier — that is the consumer-fitness failure the anti-references rule out.
  SVG, never font glyphs: Noto Sans TC has no coverage for arrows or device marks and an uncovered
  codepoint renders as tofu, which is worse than no icon.

## Theming

**Single theme, positive polarity: dark ink on a cream ground.** No toggle in this build — one
theme, done properly.

This reverses an earlier decision, and the reason is acuity rather than taste. A bright field
constricts the pupil; a smaller pupil increases depth of field and reduces the visual cost of
optical aberration and lens opacity. For a 75–90 year old reading at 2.5–3 m, that generally helps
more than a dark field does. The scene is unchanged — overhead fluorescent light, a fixed monitor,
an 80-year-old mid-effort — but the conclusion drawn from it is.

Two consequences follow and are not negotiable:

- **The ground is cream, not white.** Low chroma, high lightness, never pure white. A white field
  under overhead fluorescent light produces veiling glare that gives back everything the pupil
  constriction won.
- **The 7:1 participant contrast floor is unchanged.** Polarity does not relax it, and every value
  is re-measured through a canvas rather than reasoned about.

The printed sheet remains separately, strictly **black on white**. Paper is paper: the cream is a
screen decision and must never reach the printer.

## Design-system mapping

No component library has a primitive for "one number legible at three metres" or for a government
funding report. Both are custom. Do not map this onto Material, Carbon, or any shadcn default
vocabulary.

## The hard structural constraint

**One machine, one monitor, two audiences.** The screen the facilitator operates is the screen the
participant reads mid-movement. There is no second display. This is the central UI problem, not an
edge case, and it is resolved deliberately in DESIGN.md rather than by making one number large on
a dashboard.
