# Rehabibi — Intelligent Home Rehabilitation Coach

**Rehabibi** is a private, real-time computer-vision physical rehabilitation coach that empowers patients recovering from surgery or musculoskeletal injury to perform prescribed rehab exercises with clinical precision at home.

Born out of personal post-surgery shoulder rehabilitation, Rehabibi solves the fundamental challenge of home physical therapy: **without a physical therapist present, patients struggle to verify if their angle, hold duration, and movement tempo are correct, often developing compensatory cheating habits (such as shoulder shrugging or torso leaning) that hinder recovery.**

Rehabibi provides instant 60 FPS visual and auditory coaching directly in your web browser with **zero hardware setup, zero cloud video uploads, and 100% on-device privacy**.

---

## Key Capabilities

* **📐 3D Goniometric Joint Tracking**: Real-time 3D joint angle calculation ($	ext{Hip} 	o 	ext{Shoulder} 	o 	ext{Elbow/Wrist}$) powered by MediaPipe BlazePose GPU WebAssembly.
* **🧍 Standing & 🪑 Seated Desk Modes**: Supports full-body standing view as well as upper-body / desk framing with intelligent spine-vector fallback when hips are occluded.
* **⏱️ Precision Cadence & Isometric Hold Engine**:
  * $5.0	ext{s}$ Controlled Concentric Elevation
  * $5.0	ext{s}$ Top Isometric Hold at $90^\circ \pm 5^\circ$
  * $5.0	ext{s}$ Controlled Eccentric Lowering
  * $3.0	ext{s}$ Post-Rep Recovery Rest Interval
* **⚠️ Real-Time Form & Cheat Guards**:
  * **Shoulder Shrug / Hike**: Detects upper trapezius overcompensation.
  * **Torso Lean / Sway**: Catches trunk arching or lateral tilting.
  * **Bent Elbow**: Ensures full lever arm extension ($> 155^\circ$).
  * **Dynamic Velocity Pacer**: Live alerts if movement is **Too Fast** or **Too Slow** relative to the 5s curve.
* **📊 Post-Session Form Scorecard**: Comprehensive breakdown calculating overall **Form Quality Score (%)**, average hold time, and a rep-by-rep inspection table.
* **🔥 Habit Building**: Daily workout streak tracking and session history persisted locally.

---

## Quickstart

### Prerequisites
* Node.js $\ge 18$
* A modern browser (Chrome, Brave, Safari, Edge) with webcam access

### Installation & Launch
```bash
git clone https://github.com/e4tsai-byte/rehab.git
cd rehab

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open **`http://localhost:5173`** in your browser, allow camera permissions, and begin your rehabilitation session!

---

## Technology Stack

* **Frontend**: React 19, TypeScript, Vite, Vanilla Modern CSS (Dark Mode Design System)
* **Computer Vision**: Google MediaPipe Pose Landmarker (`@mediapipe/tasks-vision` via WebAssembly & WebGL GPU acceleration)
* **Audio Feedback**: Web Audio API synthesized frequency chimes
* **Optional Backend**: Python 3 / FastAPI server for research and offline video benchmark processing

---

## Privacy & Clinical Invariants

1. **Zero Video Retention**: Web camera frames are processed entirely in browser memory at 60 FPS and discarded immediately. No video or image data is ever written to disk or sent across the network.
2. **Deterministic Kinematics**: All angles, durations, and form flags are calculated using transparent vector algebra and trigonometry, never black-box probabilistic guesswork.
3. **Form Coach, Not Diagnostic Device**: Rehabibi guides exercise form and tracks adherence to physician-prescribed movements; it does not diagnose medical conditions.

---

## License

MIT License. Designed with care for accessible global physical recovery.
