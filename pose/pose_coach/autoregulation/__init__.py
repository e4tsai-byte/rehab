"""Autoregulation: rep counting, per-rep velocity/ROM, and within-set
fatigue-stop detection, per docs/rep-counting-velocity-loss-design.md.

This package only consumes `pose_coach`'s existing per-frame `FrameOutput`
stream (`pipeline.PoseTrackingPipeline.process_frame`) -- no changes to
that pipeline, no new tracking/camera/model logic here.

Package layout (demo-critical path only -- see the design doc's Next
Steps prioritization):
    rep_counter.py   -- SEATED->STANDING->SEATED cycle detection from the
                         FrameOutput stream, discard rules, failed-stand
                         tracking. Pure, stateful across frames (like
                         state_machine.StateClassifier).
    velocity.py       -- pure per-rep math: mean_velocity (whole-phase
                         displacement, not framewise differentiation),
                         peak_velocity, ROM/min_angle/max_angle.
    fatigue_stop.py   -- SetSummary aggregation: velocity_loss_pct, the
                         20% threshold, the first-3-rep consistency guard
                         (gates both fatigue_stop_triggered and, later,
                         progression), and the minimum-rep-count fallback.

Deliberately NOT built in this slice (per the design doc's own Next Steps
sequencing -- "buildable now, but not demoable before the deadline"):
`progression.py` (rolling-baseline load recommendation) and
`session_store.py` (cross-session persistence). Both require real
multi-session data that can't exist before the demo; adding them now would
be scope creep ahead of the actually-demoable path. Not stubbed here --
left entirely unbuilt, per the design doc's explicit instruction.
"""
