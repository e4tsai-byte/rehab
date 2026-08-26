# Rehabibi — Product Specification

## 1. Vision & Mission

**Rehabibi** is an intelligent, accessible, privacy-preserving computer-vision physical rehabilitation coach for full-body musculoskeletal recovery.

Born out of personal post-surgical rotator-cuff recovery, Rehabibi has expanded into a full-body rehabilitation architecture covering 6 major anatomical regions (`Shoulder`, `Knee`, `Hip`, `Elbow`, `Spine`, `Ankle`). Today, three foundational right-arm shoulder movements are clinically active (`EX-0`, `EX-1`, `EX-2`), integrated with an interactive body anatomy map, customizable prescription planner, and comprehensive exercise library. The full-body roadmap in §5 charts the sequence for activating remaining regional kinematic trackers. 🗓️

---

## 2. The Core Problem

Post-surgical rehabilitation is overwhelmingly executed at home, between clinic visits. Home rehab has four well-known failure modes:

1. **Invisible compensations.** Facing stiffness or weakness, patients instinctively shrug (recruiting upper trapezius instead of deltoid) or lean the trunk to heave the limb. Unwatched, these become habitual and compromise recovery. *(literature-adjacent, uncited)*
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

* **Context** — recovering from orthopedic surgery or managing musculoskeletal conditions (rotator cuff repair, knee rehabilitation, spine posture, hip/ankle mobility).
* **Prescription** — daily sets of specific movements, organized into customizable multi-track prescriptions.
* **Needs**
  * Clear, non-intimidating visual feedback showing actual joint angle
  * Real-time warning when shrugging, leaning, or bending
  * The ability to exercise standing, seated at a desk, or in side-lying floor postures
  * Multi-track prescription progress, streak counters, and post-session scorecards that motivate without grading

The product is designed for this person. Every tradeoff resolves in their favour.

### Clinician & Prescribing Physiotherapist

* **Context** — prescribing home protocols and wanting structured adherence tracking.
* **Capabilities**
  * Multi-track prescription timeline organizing exercises into active parallel and queued stages
  * Customizable target angles, hold durations, and daily frequency parameters
  * Objective per-rep adherence and compensation logs (presented as engagement data, never as clinical diagnostic measurement)

Do not design for the clinician at the patient's expense. An interface optimized for compliance reporting is an interface the patient stops opening.

---

## 5. Exercise Catalog Roadmap

| Code | Name | Region | Primary Target | Framing View | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EX-0** | Side-Lying Right Arm Low Abduction Hold (10°–15°) | Shoulder | Supraspinatus, low-angle isometric activation | Side-lying, floor-level camera | ✅ Live |
| **EX-1** | Standing Right Arm Forward Flexion | Shoulder | Anterior deltoid, supraspinatus, serratus anterior | Full body, frontal | ✅ Live |
| **EX-2** | Seated Desk Right Arm Forward Flexion | Shoulder | Anterior deltoid, shoulder mobility | Upper body, frontal | ✅ Live |
| **EX-3** | Standing Lateral Abduction (90°) | Shoulder | Middle deltoid, supraspinatus | Full body, frontal | 🗓️ Planned |
| **EX-4** | Scaption (30° scapular plane elevation) | Shoulder | Rotator cuff, supraspinatus isolation | Frontal / 45° oblique | 🗓️ Planned |
| **EX-5** | Supported External Rotation (0° abduction) | Shoulder | Infraspinatus, teres minor | Frontal / desk | 🗓️ Planned |
| **KN-1** | Seated Isometric Quad Sets | Knee | Quadriceps neuromuscular activation | Seated, sagittal side view | 🗓️ Planned |
| **KN-2** | Terminal Knee Extension (TKE) | Knee | Vastus medialis (VMO), terminal lockout | Standing, sagittal side view | 🗓️ Planned |
| **HP-1** | Side-Lying Clamshell Activation | Hip | Gluteus medius, pelvic stability | Side-lying, floor-level camera | 🗓️ Planned |
| **EL-1** | Eccentric Wrist Extension | Elbow | Forearm extensors, tendon remodeling | Seated desk, close-up | 🗓️ Planned |
| **SP-1** | Cervical Retraction Chin Tuck | Spine | Deep neck flexors, axial alignment | Seated, sagittal eye-level | 🗓️ Planned |
| **AK-1** | Seated Active Ankle Dorsiflexion | Ankle | Tibialis anterior, foot clearance | Seated, sagittal ankle-level | 🗓️ Planned |

**Anatomy Explorer & Region Dashboards:** The dashboard provides an interactive human body anatomy selector across 6 major musculoskeletal regions (`Shoulder`, `Knee`, `Hip`, `Elbow`, `Spine`, `Ankle`). Clicking any region opens a dedicated dashboard displaying targeted prescriptions, muscle groups, and roadmap movements.

All live exercises are currently **right arm / right limb**. The engine reads right-side landmarks with transparent vector kinematics.

A row moves from 🗓️ to ✅ only after the full chain in `AGENTS.md` completes: physiatrist defines it, kinematicist makes it measurable, measurement-engineer makes it stable, qa-engineer has fixtures for it. Nothing is announced before that.

---

## 6. Core Product Invariants

1. **100% Privacy by Design.** All computer vision runs locally in WebAssembly and WebGL. Zero camera frames, video clips, or face crops leave the device. What persists is rep records and settings, in local storage, on this device.
2. **Measurement Transparency.** Every metric shown is a measured joint angle in degrees or a measured interval in seconds. No opaque score without an explanation the user could follow.
3. **Positive, Dignified Coaching.** Alerts are corrective and specific, prioritizing safety and mechanics over grading. A partial session is a valid outcome, and the copy must never imply otherwise. See `CLAUDE.md` invariant 1.6.
4. **Form Coach, Not a Medical Device.** Rehabibi provides form feedback and adherence tracking for movements a clinician has already prescribed. It does not diagnose, does not prescribe, does not assess recovery, and is not a substitute for in-person physical therapy. No screen, alert, or score may be worded so as to imply a clinical judgement.
