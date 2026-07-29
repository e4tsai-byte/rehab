"""Generic switch hysteresis primitive, shared by person-selection and
side-selection (per the design doc: person selection "has the same
hysteresis treatment as side-switching")."""


class SwitchHysteresis:
    """'Don't switch until the challenger has been ahead for N consecutive
    frames' state machine.

    Call `should_switch(incumbent_score, challenger_score)` once per frame.
    Returns True on the frame the switch should actually occur (and resets
    the internal counter); False otherwise -- either because the challenger
    isn't ahead this frame, or hasn't been ahead for long enough yet.
    """

    def __init__(self, frames_required: int, margin: float = 0.0):
        self._frames_required = frames_required
        self._margin = margin
        self._consecutive_advantage_frames = 0

    def reset(self) -> None:
        self._consecutive_advantage_frames = 0

    def should_switch(self, incumbent_score: float, challenger_score: float) -> bool:
        if challenger_score > incumbent_score + self._margin:
            self._consecutive_advantage_frames += 1
        else:
            self._consecutive_advantage_frames = 0

        if self._consecutive_advantage_frames >= self._frames_required:
            self._consecutive_advantage_frames = 0
            return True
        return False
