"""pose_coach -- pose tracking + exercise-state classification for the
PHIT camera-based strength coach PoC (design doc:
lucasting-main-design-20260729-004848.md).

Package layout:
    config.py         -- named constants (landmark indices, thresholds,
                          hysteresis bands, model path). No logic.
    types.py           -- shared plain data types (Landmark, PoseObservation,
                          Side, State, FrameOutput). No logic.
    geometry.py        -- pure vector/angle math (law-of-cosines angles,
                          acos-domain clamping, zero-vector guards).
    measurements.py    -- per-side joint-angle / hip-height measurements,
                          built from geometry.py + config.py landmark indices.
    hysteresis.py       -- generic "don't switch until the challenger has
                          led for N consecutive frames" primitive.
    selection.py        -- person-selection and side-selection hysteresis,
                          built on hysteresis.py.
    smoothing.py         -- per-side median-filter buffers.
    state_machine.py    -- SEATED/STANDING/TRANSITIONING hysteresis state
                          machine.
    pipeline.py          -- pure per-frame orchestration of the above
                          (person select -> side select -> measure -> smooth
                          -> classify). No camera, no MediaPipe, no OpenCV --
                          this is what gets unit-tested against synthetic
                          landmark coordinates.
    capture.py            -- impure I/O: OpenCV webcam capture + MediaPipe
                          Pose Landmarker (Tasks API, VIDEO mode) inference,
                          converting results into plain PoseObservations.
    overlay.py            -- impure I/O: OpenCV skeleton/state-label drawing.

`scripts/run_demo.py` is the live-webcam entry point wiring capture,
pipeline, and overlay together.
"""

__version__ = "0.1.0"
