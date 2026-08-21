# Rehabibi — Design System & Visual Specification

## 1. Design Philosophy: "Sleek Dark Mode & Neon Precision"

Rehabibi is built on modern sports-science telemetry aesthetics: dark, focused, high-contrast, and distraction-free.

Unlike clinical hospital software which is often sterile and uninspiring, Rehabibi creates a premium athletic-recovery atmosphere that makes daily physical therapy feel empowering and precise.

---

## 2. Color Palette & Design Tokens

### Background & Surface Layers
* `--rehab-bg`: `#070a13` (Deep Void Blue/Black) — Minimizes eye strain and makes camera video overlay pop.
* `--rehab-surface`: `#0f172a` (Slate 900) — Primary card and modal background.
* `--rehab-surface-glass`: `rgba(15, 23, 42, 0.82)` with `backdrop-filter: blur(16px)` — Floating overlays and header.
* `--rehab-border`: `rgba(255, 255, 255, 0.08)` / `rgba(56, 189, 248, 0.2)` — Subtle glass borders.

### Semantic Neon Accents
* 🔷 **Cyan (`#38bdf8`) / Royal Blue (`#0284c7`)**: Primary movement indicator, live skeleton tracking line, goniometer arc.
* 🟢 **Emerald (`#10b981`) / Mint (`#34d399`)**: Target lock, clean rep indicator, completed countdown, perfect tempo status.
* 🟠 **Amber (`#f59e0b`) / Gold (`#fbbf24`)**: Active hold countdown ring, 3-second post-rep rest interval, streak fire icon.
* 🔴 **Rose / Crimson (`#ef4444`, `#f87171`)**: Real-time form alerts (shoulder hike, torso lean, rushed velocity).

---

## 3. Typography & Numerics

* **Primary Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Noto Sans TC"`, sans-serif.
* **Telemetry Numerics**: Tabular numerical figures (`font-variant-numeric: tabular-nums`) to ensure numbers update at 60 FPS without layout jitter.

---

## 4. Key UI Components

### 1. Goniometer Angle Gauge (`AngleGauge.tsx`)
* Circular SVG dial with high-contrast degree readout (`0°` to `120°`).
* Glowing target zone arc illuminated between $85^\circ$ and $95^\circ$.
* Instantly shifts from glowing cyan to vibrant emerald when locking into the target horizontal zone.

### 2. Cadence Metronome & Hold Ring (`CadencePacer.tsx`)
* **Ascent & Descent Pacer**: Smooth 5.0-second animated fill bar showing elapsed time ($0.0	ext{s} 	o 5.0	ext{s}$).
* **Dynamic Pace Badge**: Real-time evaluation pills:
  * `✨ 節奏完美` (Emerald)
  * `⚠️ 速度過快（請放慢）` (Crimson)
  * `⚠️ 速度過慢（稍微加快）` (Amber)
* **Hold Ring**: Circular isometric hold countdown ring with smooth counter-clockwise stroke depletion.
* **Rest Ring**: Amber countdown ring during the 3-second post-rep rest period (`☕ 次間休息放鬆：3.0 秒`).

### 3. Real-Time Skeleton Overlay (`usePoseTracker.ts`)
* High-visibility glowing turquoise lines rendered directly over the mirrored video feed.
* Highlighted joints (Shoulder, Elbow, Wrist) with pulsating status rings.

### 4. Post-Session Form Quality Scorecard (`SessionSummary.tsx`)
* Prominent circular completion dial displaying **% 完美動作率**.
* Summary cards: Completed Reps, Average Hold Duration, Peak Angle.
* Rep-by-Rep Inspection Table breaking down concentric tempo, hold duration, eccentric tempo, and specific form flags.

---

## 5. Responsive Behavior

* **Desktop / Laptop View**: Side-by-side 2-column split (Left: 60 FPS Mirrored Camera Feed; Right: Goniometer, Cadence Bar, Alerts).
* **Mobile / Tablet View**: Stacked vertical layout (Top: Camera Feed; Bottom: Telemetry Panel).
