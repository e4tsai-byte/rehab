## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
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
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).

# VeloCare — project rules

A shared, camera-based strength-training coach for community elder-care centres in Taiwan.
A participant does sit-to-stands in front of a device; it counts reps, checks movement
quality, measures how much they slow across a set, and turns that into two decisions: stop
the set now, and change the load next time. One non-specialist staff member supervises a
rotation. No wearable, no app, no smartphone, no account.

## Repository layout

This repo is `velocare/`, nested inside a parent workspace folder. The parent contains
internal strategy documents (`../Proposal .pdf`, `../GoonGPT Hackathon Blurt.pdf`). Read them
for background when useful. **Never copy them into this repo** — they are internal, contain
claims explicitly marked unverified, and this repo is public.

## Hard invariants — never violate, never "improve"

1. **No image data is ever persisted.** Frames are reduced to landmarks and discarded. No
   frame buffer, no canvas readback we retain, no upload, no "just for debugging" recording.
   If a feature seems to need stored video, stop and raise it — the answer is no.
2. **No identity fields.** There is no name, date of birth, or national ID field anywhere in
   any type, schema, form, or fixture. Participants are pseudonymous IDs (`P-0042`) plus a
   short staff-chosen display label. The mapping to a real person lives in the site's paper
   records, off-device.
3. **No clinical output.** The system never diagnoses, screens, assesses risk, categorises,
   or refers. Every output is a training measurement or a training instruction. Use training
   language (train, coach, progress, participant) — never clinical language (diagnose,
   screen, assess, rehabilitate, patient). This is a regulatory boundary, not a style
   preference: it is what keeps the product outside medical-device classification.
4. **Accessibility floor on participant surfaces**, applied before any aesthetic rule:
   nothing under 2rem; primary number ~12rem; contrast >= 7:1; colour never carries meaning
   alone (always paired with a word and a distinct shape); >=64px tap targets on facilitator
   surfaces; no hover-only affordances; honour `prefers-reduced-motion`.
5. **Traditional Chinese (zh-TW) is the default language**, English is the toggle. All copy
   lives in one strings module. Both languages ship complete — English is not a stub. The CJK
   face must have full zh-TW coverage.

## Open decisions — do not silently resolve

- **Load progression mechanism.** Resistance bands (what the current proposal says) vs chair
  height (probably more correct for sit-to-stands, and camera-verifiable). Until this is
  settled, load is an **abstract ordered ladder** and the UI says "step up / hold / step
  down". Do not hardcode band colours.
- **Velocity-intent validity.** Velocity loss only indexes fatigue if participants attempt
  maximal speed each rep. The system cues "stand up fast, sit down slowly", but compliance in
  this population is unproven. Where a session's rep-to-rep velocity is erratic rather than
  monotonically declining, prefer declining to make a recommendation over making a weak one.

## Design tool hierarchy

- **impeccable owns the design system.** `DESIGN.md` and `PRODUCT.md` are the source of
  truth for tokens, typography, and anti-references. Do not run `/design-consultation` — it
  would author a competing system.
- **taste-skill applies at generation time only.** It never overrides `DESIGN.md`.
- **When impeccable and taste conflict, impeccable wins.**
- Variant exploration: `/design-shotgun`. Mockup to markup: `/design-html`.
- Plan-stage design critique: `/plan-design-review`. Built-UI critique: impeccable
  `/audit`, `/critique`, `/polish`. Do not use gstack `/design-review` — impeccable owns that.

## Aesthetic direction

The participant display should look almost austere. That is the correct outcome, not a
failure of ambition — do not let anti-slop rules push it toward visual interest.
Anti-references: consumer fitness apps (rings, streaks, confetti, badges, gamification),
glossy health-tech SaaS (gradient cards, glassmorphism, hero sections), clinical software
(dense grids, tiny type, chart walls).
Tone: dignified. These are adults doing hard physical work — not patients being managed, not
users being engaged. No cheerfulness, no encouragement stickers, no exclamation marks.

## Current scope

Frontend only, driven by fixtures behind a `SessionDataSource` interface. The pose pipeline
implements that same interface later; no UI code may know the difference. No backend, no
accounts, no deployment yet.
