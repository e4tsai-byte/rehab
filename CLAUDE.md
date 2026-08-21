# Rehabibi — System Invariants & Developer Guide

This document defines non-negotiable engineering rules and system architecture for the **Rehabibi** codebase.

---

## 1. Non-Negotiable Invariants

1. **100% Privacy by Design**:
   * Camera frames must NEVER be stored, logged to disk, uploaded to any remote server, or retained.
   * All pose estimation and kinematic calculations run strictly client-side via in-browser `@mediapipe/tasks-vision` (WebAssembly & WebGL GPU).
2. **Deterministic Kinematic Computation**:
   * All angles and compensation triggers must be computed via transparent vector mathematics (`shoulderKinematics.ts`).
   * No probabilistic or generative AI guessing for joint angles or rep counting.
3. **Ergonomic State Machine Architecture**:
   * All exercises follow deterministic state machines (`RESTING` $	o$ `ASCENDING` $	o$ `HOLDING` $	o$ `DESCENDING` $	o$ `RESTING`).
   * Must include 3-second post-rep rest intervals and robust descent-settle triggers to avoid getting stuck.
4. **Dual-View Support**:
   * Every exercise should account for both standing full-body and seated desk upper-body occlusion modes where possible.

---

## 2. Project Structure

```
/Users/ethantsai/Github/rehab/
├── src/
│   ├── domain/
│   │   ├── rehabTypes.ts          # Core domain models (Phases, Flags, RepRecords, Settings)
│   │   └── exerciseCatalog.ts     # Prescribed exercise library metadata & instructions
│   ├── pose/
│   │   └── shoulderKinematics.ts  # 3D vector geometry, shrug detection, state machine
│   ├── hooks/
│   │   ├── usePoseTracker.ts      # In-browser MediaPipe PoseLandmarker vision loop
│   │   └── useChime.ts            # Web Audio API audio metronome & cues
│   ├── components/
│   │   ├── RehabHeader.tsx        # App header with streak badge & settings icon
│   │   ├── ExerciseCard.tsx       # Routine card with parameters & start CTA
│   │   ├── SettingsModal.tsx      # Target angle, hold duration, and reps modal
│   │   ├── AngleGauge.tsx         # Circular SVG goniometer with active target zone
│   │   ├── CadencePacer.tsx       # 5s dynamic bar, hold countdown, and 3s rest ring
│   │   └── FormAlertBanner.tsx    # Real-time form compensation warning alerts
│   ├── surfaces/
│   │   ├── RehabDashboard.tsx     # Home dashboard, exercise switcher, streak & history
│   │   ├── RehabTraining.tsx      # Fullscreen live 60 FPS coaching surface
│   │   └── SessionSummary.tsx     # Post-workout form quality scorecard
│   ├── styles/
│   │   └── rehab.css              # Sleek Dark Mode design tokens & UI styling
│   └── App.tsx                    # Main app state router (Dashboard → Training → Summary)
├── pose/                          # Python kinematics benchmark suite & test harness
└── package.json
```

---

## 3. Development Workflow

```bash
# Typecheck
npm run typecheck

# Build bundle
npm run build

# Start local Vite dev server
npm run dev

# Run Python kinematic tests
python3 pose/tests/test_shoulder_flexion.py
```
