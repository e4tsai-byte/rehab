"""Smoke test for `pose_coach.overlay.draw_autoregulation_panel`.

Not pure logic (mutates a real frame via OpenCV drawing calls), so this
just confirms it doesn't crash across the tri-state `fatigue_stop_triggered`
values it's meant to render distinctly (True/False/None) -- in particular
that `_FATIGUE_STOP_COLORS[fatigue_stop_triggered]` doesn't KeyError on
None, which a naive `Dict[bool, ...]` implementation would.
"""

import numpy as np
import pytest

cv2 = pytest.importorskip("cv2", reason="opencv-python not installed")

from pose_coach.overlay import draw_autoregulation_panel


@pytest.mark.parametrize("fatigue_stop_triggered", [True, False, None])
@pytest.mark.parametrize("velocity_loss_pct", [0.15, None])
def test_draw_autoregulation_panel_does_not_crash(fatigue_stop_triggered, velocity_loss_pct):
    frame = np.zeros((240, 320, 3), dtype=np.uint8)
    draw_autoregulation_panel(
        frame,
        rep_count=3,
        failed_stand_count=1,
        velocity_loss_pct=velocity_loss_pct,
        fatigue_stop_triggered=fatigue_stop_triggered,
    )
    # Something was actually drawn (frame mutated in place, no longer all-zero).
    assert frame.any()
