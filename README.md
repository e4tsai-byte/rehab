# Rehabibi — Intelligent Home Rehabilitation Coach

**Rehabibi** is a private, real-time computer-vision physical rehabilitation coach that helps people recovering from shoulder surgery or musculoskeletal injury perform prescribed rehab exercises with consistent form and measurable, repeatable feedback at home.

Born out of personal post-surgery shoulder rehabilitation, Rehabibi addresses the core failure of home physical therapy: **without a therapist present, patients cannot verify their angle, hold duration, or movement tempo, and drift into compensatory habits — shrugging, leaning, rushing the lowering phase — that work against recovery.**

It runs entirely in your web browser. No hardware, no account, no video ever leaves your device.

> **Scope today:** two right-arm shoulder forward-flexion exercises, standing and seated. Left-arm tracking and additional movements are planned. 🗓️

---

## What Rehabibi Is Not

Rehabibi is a form-feedback and adherence tool. It is **not a medical device**, not a diagnostic, and not a substitute for a physical therapist or surgeon. It does not prescribe exercises, assess healing, or clear you to progress.

Use it only for movements your clinician has already prescribed, and stop immediately if a movement causes pain. Angle and timing readings are camera-based estimates from a consumer webcam and have not been clinically validated against goniometry.

---

## Key Capabilities

* **📐 3D Goniometric Joint Tracking** — real-time 3D joint angle calculation (hip → shoulder → elbow/wrist) via MediaPipe BlazePose running on WebAssembly and the WebGL GPU backend.
* **🧍 Standing & 🪑 Seated Desk Modes** — full-body standing view plus an upper-body desk framing, with a spine-vector fallback when the hips are occluded. The two modes are separate measurements with separate thresholds, not one measurement with a tolerance.
* **⏱️ Cadence & Isometric Hold Engine**
  * 5.0 s controlled concentric elevation
  * Top isometric hold — engages at 80°, releases below 72°, target band 80°–110° around a 90° nominal
  * 5.0 s controlled eccentric lowering
  * 3.0 s post-rep recovery interval
* **⚠️ Real-Time Form Guards**
  * **Shoulder Shrug / Hike** — flags the right shoulder rising relative to the left, the visible signature of upper-trapezius substitution. *(proxy measure; no per-user baseline yet 🗓️)*
  * **Torso Lean** — detects lateral trunk tilt in the camera plane. In seated or occluded framing this falls back to a head-position proxy. Backward arching is not observable from a frontal view. 🗓️
  * **Bent Elbow** — flags elbow flexion beyond ~25° from full extension (2D angle below 155°). The 2D measurement is sensitive to foreshortening when the arm points toward the camera.
  * **Dynamic Pacer** — alerts when elevation deviates more than 16° from the expected position on the 5 s curve, after a settling grace period.
* **📊 Post-Session Scorecard** — completed reps, average hold duration, peak angle, and a rep-by-rep breakdown of concentric tempo, hold duration, eccentric tempo, and form flags.
* **🔥 Habit Building** — daily streak tracking and session history, persisted locally.

### On the thresholds above

None of these numbers is clinically validated. Their provenance:

| Value | Status |
|---|---|
| 5 s concentric / 5 s eccentric | Clinical convention, uncited. Slow-tempo eccentric loading is standard tendon-rehab practice; 5 s is a round number, not a sourced protocol value. |
| 5 s isometric hold | Literature-adjacent. Holds of 5–45 s are widely prescribed in rotator-cuff protocols; 5 s sits at the short end. |
| 3.0 s inter-rep rest | Judgment call. Chosen to keep the state machine from re-entering, not from a rest-interval literature. |
| 2.5 s "rushed" floor | Judgment call, unvalidated. |
| 155° elbow extension | Judgment call, unvalidated. Not a clinical extension criterion. |
| 0.08 / 0.12 shrug ratio | Placeholder pending pilot data. Note the two figures use *different denominators* (torso length vs. shoulder width) and are not comparable to each other. |
| 14° torso lean | Judgment call, uncited. |
| 16° pacing tolerance | Judgment call, unvalidated. |

Every one of them should be tuned against real footage. See `CLAUDE.md` §3 for the rule governing threshold changes.

---

## Quickstart

### Prerequisites

* Node.js 18+
* A Chromium-based browser (Chrome, Edge, Brave) with webcam access. Safari is untested — MediaPipe's GPU backend is materially weaker there. 🗓️

### Installation

```bash
git clone https://github.com/e4tsai-byte/rehab.git
cd rehab

npm install
npm run dev
```

Open **`http://localhost:5173`**, allow camera access, and begin.

---

## Technology Stack

* **Frontend** — React 19, TypeScript, Vite, vanilla modern CSS with a dark design-token system
* **Computer Vision** — Google MediaPipe Pose Landmarker (`@mediapipe/tasks-vision`) via WebAssembly and WebGL
* **Audio** — Web Audio API synthesized chimes
* **Backend** — none. Rehabibi is a static front-end. There is no server, no account system, and no API.

---

## Privacy & Engineering Invariants

1. **Zero video retention.** Camera frames are processed in browser memory and discarded immediately. No video or image data is written to disk or sent across the network.
2. **Local-only persistence.** What survives a reload is rep records and settings, in this browser's `localStorage`, on this device. No landmark arrays, no frames, no identity fields.
3. **Deterministic kinematics.** Angles, durations, and form flags come from transparent vector algebra and trigonometry — never a black-box score.
4. **No network dependency.** The app works with the network disconnected. A remote request from a rehab surface is a defect.

The full contract is in `CLAUDE.md`; the agent roster that maintains it is in `AGENTS.md`.

---

## License

MIT License. Designed with care for accessible global physical recovery.
