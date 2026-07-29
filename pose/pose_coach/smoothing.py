"""Per-side median-filter smoothing buffers.

Median, not mean (per design doc): a single misdetected-but-high-visibility
frame (e.g. a chair armrest edge briefly read as a knee landmark) shifts a
mean noticeably but is rejected by a median, at no added implementation
cost over a mean.
"""

import statistics
from collections import deque


class MedianBuffer:
    """Fixed-size sliding window over raw values, exposing the median of
    the window after each push."""

    def __init__(self, window_size: int):
        self._window_size = window_size
        self._values = deque(maxlen=window_size)

    def reset(self) -> None:
        self._values.clear()

    def push(self, value: float) -> float:
        self._values.append(value)
        return statistics.median(self._values)

    @property
    def is_empty(self) -> bool:
        return len(self._values) == 0


class SideSmoothingState:
    """The per-channel median buffers for one body side (knee angle and hip
    height -- the two channels the state machine gates on). Reset together
    on a side switch: per the design doc, the smoothing buffer is per-side
    and flushed (reset, not blended) whenever the resolved side changes,
    because left/right readings commonly differ by several degrees at
    typical demo camera angles, and averaging across a side switch would
    fabricate an angle discontinuity."""

    def __init__(self, window_size: int):
        self.knee_angle = MedianBuffer(window_size)
        self.hip_height_norm = MedianBuffer(window_size)

    def reset(self) -> None:
        self.knee_angle.reset()
        self.hip_height_norm.reset()
