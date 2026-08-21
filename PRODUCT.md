# Rehabibi — Product Specification

## 1. Vision & Mission

**Rehabibi** is an intelligent, accessible, and privacy-preserving computer-vision physical rehabilitation platform. 

While initiated to solve the specific post-surgery recovery needs of rotator cuff and shoulder mobility rehabilitation, Rehabibi is architected to scale into an open global tool that helps anyone anywhere perform their prescribed physical therapy exercises correctly, safely, and consistently at home.

---

## 2. The Core Problem

Physical therapy and post-surgical rehabilitation are overwhelmingly executed at home between clinical visits. However, home rehabilitation suffers from critical failure modes:

1. **Invisible Compensations (Cheating)**: When experiencing joint stiffness or weakness, patients instinctively compensate by shrugging their shoulders (activating upper trapezius instead of deltoids) or leaning their torso backward to heave the arm upward. Without a therapist watching, these compensations become bad muscle memory and cause secondary impingement.
2. **Tempo & Cadence Collapse**: Patients frequently rush the movement (e.g. lifting in 1 second and immediately letting the arm drop), skipping the crucial eccentric control and isometric holds that rebuild tendon strength.
3. **Imprecise Angle Estimation**: Patients cannot accurately judge whether they have reached their target range of motion (e.g. $90^\circ$ horizontal elevation) or are under/overshooting.
4. **Lack of Adherence & Accountability**: Doing repetitive exercises in isolation without objective progress metrics leads to high dropout rates.

---

## 3. The Rehabibi Solution

Rehabibi transforms any standard laptop or smartphone camera into an active physical therapy mirror:

```
[ Webcam / Mobile Camera ]
           ↓
[ 100% In-Browser MediaPipe BlazePose GPU Vision ]
           ↓
[ Deterministic 3D Vector Kinematics & Compensation Engine ]
           ↓
[ Real-Time 60 FPS Visual Goniometer + Audio Metronome + Post-Session Scorecard ]
```

---

## 4. User Personas

### Primary Persona: The Recovering Patient
* **Context**: Recovering from orthopedic surgery (e.g. rotator cuff repair, subacromial decompression, labrum repair, frozen shoulder) or managing chronic joint pain.
* **Prescription**: Prescribed daily sets of specific movements (e.g. 3 sets of 10 reps of $90^\circ$ forward flexion with $5	ext{s}$ isometric hold).
* **Needs**:
  * Clear, non-intimidating visual feedback showing exact elevation angle.
  * Real-time warnings when shrugging, leaning, or bending the elbow.
  * Seamless ability to exercise while standing or sitting at a desk during work breaks.
  * Motivational streak counters and clear post-workout form scorecards.

### Future Persona: The Physical Therapist / Clinician
* **Context**: Prescribing home exercise protocols to patients and needing objective adherence verification.
* **Needs**:
  * Ability to customize prescribed angles ($60^\circ$–$180^\circ$), hold durations ($2	ext{s}$–$10	ext{s}$), and rep counts.
  * Objective exportable compliance logs (% clean reps, average hold duration, common compensation flags).

---

## 5. Exercise Catalog Roadmap

| Exercise Code | Name | Primary Target | Framing View | Status |
| :--- | :--- | :--- | :--- | :--- |
| **EX-1** | **Standing Arm Forward Flexion** | Anterior Deltoid, Supraspinatus, Serratus Anterior | Full Body Frontal | ✅ Live |
| **EX-2** | **Seated Desk Forward Flexion** | Anterior Deltoid, Shoulder Mobility | Upper Body / Desk Frontal | ✅ Live |
| **EX-3** | **Standing Lateral Abduction ($90^\circ$)** | Middle Deltoid, Supraspinatus | Full Body Frontal | 🗓️ Planned |
| **EX-4** | **Scaption ($30^\circ$ Scapular Plane Elevation)** | Rotator Cuff (Supraspinatus isolation) | Frontal / $45^\circ$ Oblique | 🗓️ Planned |
| **EX-5** | **Supported External Rotation ($0^\circ$ Abduction)** | Infraspinatus, Teres Minor | Frontal / Desk | 🗓️ Planned |
| **EX-6** | **Wall Slides / Overhead Elevation ($120^\circ$–$180^\circ$)** | Full Overhead Mobility & Scapular Rhythm | Sagittal Side View | 🗓️ Planned |

---

## 6. Core Product Invariants

1. **100% Privacy by Design**: All computer vision runs locally inside WebAssembly/WebGL. Zero camera frames, video clips, or face crops leave the device.
2. **Clinical Transparency**: Every metric displayed to the user is grounded in measurable joint angles ($^\circ$) and verifiable time intervals ($	ext{s}$). No opaque black-box AI scores without explanation.
3. **Positive, Dignified Coaching**: Alerts are corrective and encouraging, prioritizing user safety and proper mechanics over punitive grading.
