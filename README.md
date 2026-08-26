# Rehabibi — Intelligent Home Rehabilitation Coach

**Rehabibi** is a private, real-time computer-vision physical rehabilitation coach that helps people recovering from shoulder surgery or musculoskeletal injury perform prescribed rehab exercises with consistent form and measurable, repeatable feedback at home.

Born out of personal post-surgery shoulder rehabilitation, Rehabibi addresses the core failure of home physical therapy: **without a therapist present, patients cannot verify their angle, hold duration, or movement tempo, and drift into compensatory habits — shrugging, leaning, rushing the lowering phase — that work against recovery.**

It runs entirely in your web browser. No hardware, no account, no video ever leaves your device.

**Live demo:** [e4tsai-byte.github.io/rehab](https://e4tsai-byte.github.io/rehab/) — allow camera access to try it.

> **Scope today:** three right-arm exercises are live — standing and seated forward flexion, plus a side-lying low-angle isometric hold for early-stage supraspinatus activation. Left-arm tracking and additional movements are planned. 🗓️

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
  * Top isometric hold — engages at 78°, accumulates down to 68°, releases below 52°, band 78°–115° around a 90° nominal
  * 5.0 s controlled eccentric lowering
  * 3.0 s post-rep recovery interval
* **🛏️ Side-Lying Isometric-Hold Model** — a second, independent tracking state machine (`READY → HOLDING → READY`) for low-load holds where the target is a *ceiling*, not a floor: 10°–15° abduction, held 20 s (progressing toward 30 s). Rising above the band is a form fault, the inverse of the paced-elevation model above.
* **⚠️ Real-Time Form Guards**
  * **Shoulder Shrug / Hike** — flags the right shoulder rising relative to the left, the visible signature of upper-trapezius substitution. *(proxy measure; no per-user baseline yet 🗓️)*
  * **Torso Lean** — detects lateral trunk tilt in the camera plane. In seated or occluded framing this falls back to a head-position proxy. Backward arching is not observable from a frontal view. 🗓️
  * **Bent Elbow** — flags a pronounced inward bend, gated on a 3D reach ratio (0.78) with a 115° angle floor. The reach ratio is the constant that binds in practice.
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
| 115° elbow / 0.78 reach ratio | Tuned on live runs, n = 1. Catches a pronounced bend, not the 20–30° of flexion that first shortens the lever arm. |
| 0.18 / 0.22 shrug ratio | Tuned on live runs, n = 1 — loosened from 0.08 / 0.12, which fired near-continuously on real movement. Different denominators (torso length vs. shoulder width), so the two are not comparable to each other. Detects asymmetric shrug only; a symmetric bilateral shrug is invisible. |
| 16° torso lean | Tuned on live runs, n = 1. Frontal-plane only — backward arching is not observable from this camera angle. |
| 18° pacing tolerance | Judgment call, unvalidated. |

The compensation and timeout values were tuned by the author across repeated live runs against his own shoulder — real evidence, and better than the desk-reasoned numbers they replaced, but calibrated on **one** shoulder in one room. Treat every row as n = 1 until the validation study widens it. See `CLAUDE.md` §3 for the rule governing threshold changes.

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
