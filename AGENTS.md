# Rehabibi — Agent Roster

Twelve specialist agents, defined in `.claude/agents/`. Each one owns a slice of the
system, and — more importantly — each one knows what it *doesn't* own.

The roster is shaped by a single observation about this product: **Rehabibi sits at the
intersection of clinical judgment, 3D geometry, noisy sensor data, and a person in pain
reading a screen from across a room.** Those are four genuinely different kinds of
expertise, and collapsing any two of them into one role is how this codebase gets a
number that is clinically sensible, geometrically correct, and completely unusable at
60fps on a laptop webcam.

---

## The roster

| Agent | Owns | Called when |
|---|---|---|
| **physiatrist** | Clinical content of `exerciseCatalog.ts`, the meaning of every `FormFlag` | Adding an exercise, setting angles/holds/reps, defining a compensation |
| **kinematicist** | Vector geometry in `shoulderKinematics.ts` | Defining how an angle is computed, occlusion fallbacks, an angle reading wrong |
| **measurement-engineer** | `CONFIG`, **both** state machines (paced + isometric, `CLAUDE.md` §3), hysteresis, rep/hold validity | A rep or hold miscounts, a flag fires spuriously, any constant needs a value |
| **evidence-analyst** | Literature verification, research docs | A number needs a source, a claim needs checking |
| **frontend-engineer** | `components/`, `hooks/`, `surfaces/`, `data/`, `domain/` types, `App.tsx`, `main.tsx`, `index.html` | Building or refactoring UI, the render loop, typecheck failures |
| **ux-designer** | Information architecture, flow, feedback timing, a11y | Designing a screen, deciding what appears mid-rep |
| **brand-designer** | `styles/`, the `index.html` favicon, `DESIGN.md` | Brand assets, tokens, visual treatment, visual drift |
| **zh-tw-copywriter** | User-visible copy across `src/i18n/uiStrings.ts` and `domain/` catalogs | Any new or changed user-visible character (zh-TW & EN) |
| **privacy-auditor** | Invariant #1 — blocking authority | Before merging anything touching camera, storage, network, or deps |
| **qa-engineer** | The fixture corpus, test conventions, definition of done | Adding tests, reproducing a bug, judging coverage |
| **architect** | `CLAUDE.md`, module boundaries, the invariant list | Where code belongs, agent conflicts, structural drift |
| **product-strategist** | `README.md`, `PRODUCT.md`, roadmap, positioning | Outward-facing docs, deciding what to build next |

---

## The boundaries that matter most

These are the four splits that are easy to get wrong, and the reason each one exists.

### physiatrist ≠ kinematicist ≠ measurement-engineer

Three roles, one pipeline, three genuinely different failure modes:

- The **physiatrist** says *"patients cheat forward flexion by hiking the shoulder toward
  the ear — that's upper trapezius substituting for deltoid, and it causes secondary
  impingement."* Clinical judgment. Gets it wrong → the app coaches the wrong thing.
- The **kinematicist** says *"that's the vertical displacement of the acromion landmark
  relative to the shoulder-to-hip trunk vector, normalized by shoulder width."*
  Geometry. Gets it wrong → the number doesn't measure what it claims to.
- The **measurement-engineer** says *"0.08 normalized, with a separate 0.12 for seated
  because the trunk vector degrades when hips are occluded, and it needs three
  consecutive frames or landmark jitter will fire it every second rep."* Signal
  processing. Gets it wrong → the number is right and the app is unusable.

Collapsing these into one "mathematician" produces the classic failure of this product
category: a clinically correct threshold that fires constantly on real camera data, until
the user stops believing any of the feedback.

### brand-designer ≠ ux-designer

The brand designer owns the palette, the tokens, the type scale, the *feel* — Rehabibi's
deliberate bet that rehab looks like training, not treatment. The UX designer owns what a
person in pain can actually read while holding their arm at 90° six feet from a laptop.
These pull against each other productively; the architect arbitrates.

### zh-tw-copywriter is a separate role, not a translation step

The tone rule is `CLAUDE.md` invariant 1.6: dignified, no cheerfulness, no
exclamation marks, never 加油, never 太棒了. A user who managed three reps before their
shoulder stopped them has a valid outcome and the copy must not suggest otherwise. That
is a design position with clinical weight, not a localization chore — and it needs
someone who knows the words a physical therapist actually says to a patient.

Rehabibi is bilingual (zh-TW and EN): UI chrome is strictly typed in
`src/i18n/uiStrings.ts` and read via `useT()`, while exercise, routine, and recovery
copy lives as paired `*Zh`/`*En` fields in `src/domain/`. The same dignified tone
governs both languages.

### evidence-analyst is a role because this repo proved it needs one

`docs/decisions/velocity-loss-decision-research.md` caught its own citation error — a 10%
threshold that had been written up as 20%, traced to a search-engine summary nobody
checked against the abstract. It also flagged that two of its four sources studied healthy
trained lifters aged 20–35, not the elderly population that device targeted. That is a
distinct discipline with a distinct method, and folding it into "physician" loses the
method.

That document is a velocare artifact, archived rather than deleted precisely because it
is the worked example. Its subject matter does not apply to Rehabibi. Its **method** is
the standard — and Rehabibi needs it: every threshold in the README's provenance table is
currently labelled *judgment call* or *placeholder*, and not one has a source.

---

## Collaboration pipelines

### Adding a new exercise

The `PRODUCT.md` §5 roadmap has nine planned exercises across all six regions: three
shoulder movements (EX-3 lateral abduction, EX-4 scaption, EX-5 external rotation),
two knee movements (KN-1 quad sets, KN-2 terminal knee extension), and one entry each
for hip, elbow, spine, and ankle (HP-1, EL-1, SP-1, AK-1). Each one runs this chain, in order:

```
physiatrist        → defines it clinically: target muscles, rehab phase, framing view,
                     the compensation set with each one's OBSERVABLE landmark signature,
                     ROM bounds, contraindications
        ↓
evidence-analyst   → sources the angles, holds, and protocol; labels every number
                     (literature-supported / clinical convention / judgment call /
                     placeholder pending pilot data)
        ↓
kinematicist       → turns each observable signature into vectors and a continuous
                     quantity; defines what 0° and 90° mean physically; handles the
                     degeneracies for that framing view
        ↓
measurement-engineer → sets thresholds with hysteresis pairs, state-machine transitions,
                     debounce windows; proves every state is unstickable
        ↓
qa-engineer        → static fixtures, sequence tests, degeneracy tests; before/after run
                     over the corpus for every threshold
        ↓
zh-tw-copywriter   → instructions, cues, and form-alert copy, to the character budget
                     ux-designer specifies
        ↓
frontend-engineer  → wires it into the catalog and training surface
        ↓
product-strategist → only now does it move from **Planned** to **Live** in PRODUCT.md
```

**The last step is the point.** Nothing gets announced until the chain is complete.

> **Model-choice gate (added 2026-08-21).** Before the chain runs, the architect
> decides which of the two session models (`CLAUDE.md` §3) the exercise uses and
> whether it needs a new `posture`/`FormFlag`/catalog field. The side-lying
> supraspinatus hold was the first exercise to need the second model; its
> decision record is `CLAUDE.md` §9. Any exercise that would need a *third*
> model, or a fourth `posture` value, is an architect escalation, not a
> physiatrist-first task.

### Merging anything that touches camera, storage, network, or dependencies

```
frontend-engineer  → builds it
        ↓
privacy-auditor    → PASS, or BLOCKED with file:line and the clause violated
        ↓
product-strategist → confirms README/PRODUCT privacy claims are still literally true
```

The auditor has blocking authority and read-only tools. It does not negotiate.

### A threshold changes

```
measurement-engineer → proposes, with a stated rationale
        ↓
qa-engineer          → before/after run over the fixture corpus, reporting exactly which
                       reps changed classification
        ↓
physiatrist          → confirms the new behavior is still clinically safe
        ↓
architect            → records the decision if it departs from a documented default
```

---

## Notes on setup

**`.claude/settings.json` blocks all `Skill` invocations** unless `gstack` is installed at
`~/.claude/skills/gstack`. Subagents are unaffected, but any skill-based workflow will be
denied in this repo until `gstack` is installed or the hook is removed. Confirmed
intentional and documented in `CLAUDE.md` §8 (Tooling Note).

## Resolved 2026-08-21

velocare — the supervised 5x sit-to-stand assessment product that used to share this
repository — was deleted. `CLAUDE.md` was rewritten against the live tree, its stale
Project Structure section replaced, and the invariant list given named enforcers.

Recovery: branch `velocare-archive`, tag `velocare-final-state`.

Two things had to happen *before* the deletion, because both were load-bearing for the
live product in ways their filenames did not suggest: the goniometer, pacer, form-alert
and pip rules had to be extracted out of velocare's 2607-line `app.css` into
`telemetry.css`, and the zh-TW tone invariant had to be lifted out of `i18n/strings.ts`
into `CLAUDE.md`. See `CLAUDE.md` section 7.

## Open debt

Tracked in full in `.claude/agents/architect.md`.

1. **Paced elevation rep sequence tests.** `npm test` runs 14 unit tests in
   `src/pose/__tests__/` covering geometry across all postures and the isometric hold tracker.
   Sequence tests for the paced elevation machine (`ClientShoulderFlexionTracker`) remain
   qa-engineer's standing task. `CLAUDE.md` section 3 carries the interim rule.
