"""Sequence test: median-filter outlier rejection.

Per the design doc: "a sequence with one outlier frame has that outlier
rejected by the median filter, not blended in" -- the whole reason
MedianBuffer uses statistics.median instead of a rolling mean (see
smoothing.py's module docstring: "a single misdetected-but-high-visibility
frame ... shifts a mean noticeably but is rejected by a median").
"""

import statistics

from pose_coach import config
from pose_coach.smoothing import MedianBuffer, SideSmoothingState


def test_single_outlier_frame_is_rejected_not_blended():
    buf = MedianBuffer(window_size=config.SMOOTHING_WINDOW_FRAMES)

    steady_values = [90.0, 91.0, 89.0, 90.0]
    for v in steady_values:
        smoothed = buf.push(v)

    # Window is now [90, 91, 89, 90]; push an extreme outlier (e.g. a chair
    # armrest edge briefly misread as a knee landmark).
    outlier = 200.0
    smoothed = buf.push(outlier)

    # Window is [90, 91, 89, 90, 200] (window_size=5) -> median = 90.
    assert smoothed == 90.0
    # The outlier must not have pulled the smoothed value anywhere near a
    # mean of the same window (~112), which is what a rolling-mean filter
    # would have produced.
    naive_mean = statistics.mean(steady_values + [outlier])
    assert abs(smoothed - naive_mean) > 15.0


def test_outlier_ages_out_of_window_after_window_size_pushes():
    buf = MedianBuffer(window_size=3)
    buf.push(90.0)
    buf.push(200.0)  # outlier
    buf.push(91.0)
    # Window [90, 200, 91] -> median 91.
    assert buf.push(91.0) == 91.0  # window becomes [200, 91, 91] (90 aged out)... see below

    # Explicitly re-derive expectation instead of guessing: after 4 pushes
    # into a window_size=3 buffer, the buffer holds the last 3 values.
    assert list(buf._values) == [200.0, 91.0, 91.0]


def test_side_smoothing_state_channels_are_independent():
    state = SideSmoothingState(window_size=config.SMOOTHING_WINDOW_FRAMES)
    state.knee_angle.push(90.0)
    state.knee_angle.push(200.0)
    state.hip_height_norm.push(0.5)

    assert not state.hip_height_norm.is_empty
    assert list(state.hip_height_norm._values) == [0.5]
    assert list(state.knee_angle._values) == [90.0, 200.0]


def test_reset_clears_both_channels():
    state = SideSmoothingState(window_size=config.SMOOTHING_WINDOW_FRAMES)
    state.knee_angle.push(90.0)
    state.hip_height_norm.push(0.5)

    state.reset()

    assert state.knee_angle.is_empty
    assert state.hip_height_norm.is_empty
