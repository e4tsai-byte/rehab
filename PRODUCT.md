# Rehabibi — Product Specification

## 1. Vision & Mission

**Rehabibi** is an intelligent, accessible, privacy-preserving computer-vision physical rehabilitation coach.

It began as a solution to one person's post-surgical rotator-cuff recovery. Rehabibi today covers **right-arm shoulder forward flexion**, standing and seated. The architecture is intended to generalise to other limbs and movements, and the roadmap in §5 is the sequence for getting there. 🗓️

---

## 2. The Core Problem

Post-surgical rehabilitation is overwhelmingly executed at home, between clinic visits. Home rehab has four well-known failure modes:

1. **Invisible compensations.** Facing stiffness or weakness, patients instinctively shrug (recruiting upper trapezius instead of deltoid) or lean the trunk to heave the arm up. Unwatched, these become habitual, and are commonly cited as a contributor to secondary impingement. *(literature-adjacent, uncited)*
2. **Tempo collapse.** Patients rush — lifting in a second, letting the arm drop — skipping the eccentric control and isometric hold that rebuild tendon capacity.
3. **Imprecise angle estimation.** Nobody can accurately judge from the inside whether they have reached 90° of elevation, or are 15° short.
4. **No accountability.** Repetitive solo exercise without objective feedback has a high dropout rate.

---

## 3. The Rehabibi Solution

Rehabibi turns a standard laptop camera into an active physical therapy mirror:

```
[ Webcam ]
     ↓
[ 100% In-Browser MediaPipe BlazePose (WASM + WebGL) ]
     ↓
[ Deterministic 3D Vector Kinematics & Compensation Engine ]
     ↓
[ Real-Time Visual Goniometer + Audio Metronome + Post-Session Scorecard ]
```

Nothing in that chain leaves the device.

---

## 4. User Personas

### Primary: The Recovering Patient

* **Context** — recovering from orthopedic shoulder surgery (rotator cuff repair, subacromial decompression, labral repair) or managing adhesive capsulitis or chronic shoulder pain.
* **Prescription** — daily sets of specific movements, set by their clinician.
* **Needs**
  * Clear, non-intimidating visual feedback showing actual elevation angle
  * Real-time warning when shrugging, leaning, or bending the elbow
  * The ability to exercise standing, or seated at a desk during a work break
  * Streak counters and a post-session scorecard that motivate without grading

The product is designed for this person. Every tradeoff resolves in their favour.

### Future: The Physical Therapist / Clinician 🗓️

* **Context** — prescribing home protocols and wanting objective adherence data.
* **Needs (not yet built)**
  * Customizable target angles (60°–180°), hold durations (2 s–10 s), and rep counts. **This requires parameterising `shoulderKinematics.CONFIG` per exercise — the current engine hardcodes every angle and duration threshold at module level.**
  * Exportable adherence summaries (% flag-free reps, average hold duration, most frequent compensation flags) — presented as engagement data, never as clinical measurement.

Do not design for the clinician at the patient's expense. An interface optimized for compliance reporting is an interface the patient stops opening.

---

## 5. Exercise Catalog Roadmap

| Code | Name | Primary Target | Framing View | Status |
| :--- | :--- | :--- | :--- | :--- |
| **EX-1** | Standing Right Arm Forward Flexion | Anterior deltoid, supraspinatus, serratus anterior | Full body, frontal | ✅ Live |
| **EX-2** | Seated Desk Right Arm Forward Flexion | Anterior deltoid, shoulder mobility | Upper body, frontal | ✅ Live |
| **EX-3** | Standing Lateral Abduction (90°) | Middle deltoid, supraspinatus | Full body, frontal | 🗓️ Planned |
| **EX-4** | Scaption (30° scapular plane elevation) | Rotator cuff, supraspinatus isolation | Frontal / 45° oblique | 🗓️ Planned |
| **EX-5** | Supported External Rotation (0° abduction) | Infraspinatus, teres minor | Frontal / desk | 🗓️ Planned |
| **EX-6** | Wall Slides / Overhead Elevation (120°–180°) | Overhead mobility, scapular rhythm | Sagittal side view | 🗓️ Planned |

Both live exercises are **right arm only**. The engine reads right-side landmarks with no side parameter; left-arm support is a real piece of work, not a config flag.

A row moves from 🗓️ to ✅ only after the full chain in `AGENTS.md` completes: physiatrist defines it, kinematicist makes it measurable, measurement-engineer makes it stable, qa-engineer has fixtures for it. Nothing is announced before that.

---

## 6. Core Product Invariants

1. **100% Privacy by Design.** All computer vision runs locally in WebAssembly and WebGL. Zero camera frames, video clips, or face crops leave the device. What persists is rep records and settings, in local storage, on this device.
2. **Measurement Transparency.** Every metric shown is a measured joint angle in degrees or a measured interval in seconds. No opaque score without an explanation the user could follow.
3. **Positive, Dignified Coaching.** Alerts are corrective and specific, prioritizing safety and mechanics over grading. A partial session is a valid outcome, and the copy must never imply otherwise. See `CLAUDE.md` invariant 1.6.
4. **Form Coach, Not a Medical Device.** Rehabibi provides form feedback and adherence tracking for movements a clinician has already prescribed. It does not diagnose, does not prescribe, does not assess recovery, and is not a substitute for in-person physical therapy. No screen, alert, or score may be worded so as to imply a clinical judgement.
