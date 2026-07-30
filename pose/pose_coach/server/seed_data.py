"""Roster/block/sessions/seed record log.

Ported 1:1 from `src/data/fixtures.ts` (`PARTICIPANTS`, `BLOCK`, `SESSION_PRE`,
`SESSION_POST`, `buildLog()`) so the Roster/Sheet UI shows the same real-looking
demo data whether it's talking to the fixture source or this server -- the
task's instruction to "seed your server's data with the same participants/
block". Record IDs and log order match the TS source exactly, including the
edge cases (void-then-restart, incomplete, aborted, hand_contact, unable, a
correction on top of a complete trial).

These are plain dicts, not pydantic models: they're returned as-is by the
`/block`, `/sessions` and (as `RecordStore`'s seed) `/sessions/{id}/records`
endpoints, and FastAPI serializes dicts to JSON directly. Keys are camelCase
to match the TS wire contract exactly, not Python/PEP8 convention -- this is
the wire boundary named in `SessionDataSource.ts`, so it matches the contract
rather than local style.
"""

from typing import Dict, List

SITES: List[Dict] = [
    {"siteId": "SITE-01", "name": "示範社區照顧關懷據點"},
    {"siteId": "SITE-02", "name": "示範第二關懷據點"},
]

PARTICIPANTS: List[Dict] = [
    {"id": "P-0041", "label": "王阿姨"},
    {"id": "P-0042", "label": "陳媽"},
    {"id": "P-0043", "label": "林伯"},
    {"id": "P-0044", "label": "張姐"},
    {"id": "P-0045", "label": "李伯"},
    {"id": "P-0046", "label": "黃阿姨"},
    {"id": "P-0047", "label": "吳媽"},
    {"id": "P-0048", "label": "蔡伯"},
    {"id": "P-0049", "label": "鄭姐"},
    {"id": "P-0050", "label": "許阿姨"},
    {"id": "P-0051", "label": "曾伯"},
    {"id": "P-0052", "label": "何媽"},
]

# Enrolment is deliberately LARGER than the 期's attendee list -- mirrors
# fixtures.ts's ENROLLED, so the setup screen has extra people to pick from.
ENROLMENT_BY_SITE: Dict[str, List[Dict]] = {
    "SITE-01": [
        *PARTICIPANTS,
        {"id": "P-0053", "label": "周伯"},
        {"id": "P-0054", "label": "劉阿姨"},
        {"id": "P-0055", "label": "邱媽"},
    ],
    "SITE-02": [],
}

ALL_IDS: List[str] = [p["id"] for p in PARTICIPANTS]

BLOCK: Dict = {
    "blockId": "B-2026-03",
    "siteId": "SITE-01",
    "siteName": "示範社區照顧關懷據點",
    "blockName": "115 年度第 3 期",
    "startedIso": "2026-05-04",
    "participants": PARTICIPANTS,
}

SESSION_PRE: Dict = {
    "sessionId": "S-pre",
    "blockId": BLOCK["blockId"],
    "phase": "pre",
    "dateIso": "2026-05-04",
    "attendeeIds": ALL_IDS,
}

SESSION_POST: Dict = {
    "sessionId": "S-post",
    "blockId": BLOCK["blockId"],
    "phase": "post",
    "dateIso": "2026-07-27",
    "attendeeIds": ALL_IDS,
}

SESSIONS: List[Dict] = [SESSION_PRE, SESSION_POST]

SEAT_CM = 45


def _sum(xs) -> int:
    return sum(xs)


def _complete(rep_times_ms: List[int]) -> Dict:
    return {"kind": "complete", "repsCompleted": 5, "repTimesMs": rep_times_ms, "totalMs": _sum(rep_times_ms)}


def _incomplete(rep_times_ms: List[int]) -> Dict:
    return {
        "kind": "incomplete",
        "repsCompleted": len(rep_times_ms),
        "repTimesMs": rep_times_ms,
        "elapsedMs": _sum(rep_times_ms),
    }


def _hand_contact(rep_times_ms: List[int], first_contact_rep: int) -> Dict:
    return {
        "kind": "hand_contact",
        "repsCompleted": len(rep_times_ms),
        "repTimesMs": rep_times_ms,
        "elapsedMs": _sum(rep_times_ms),
        "firstContactRep": first_contact_rep,
        "protocolInvalid": True,
    }


_UNABLE: Dict = {"kind": "unable"}


def _at(date_iso: str, from_hour: int, minute_offset: int, second: int = 0) -> str:
    """Mirrors fixtures.ts's `at()`: minutes above 59 roll into hours."""
    hour = from_hour + minute_offset // 60
    minute = minute_offset % 60
    return f"{date_iso}T{hour:02d}:{minute:02d}:{second:02d}"


_record_seq = 0


def _next_record_id() -> str:
    global _record_seq
    _record_seq += 1
    return f"R-{_record_seq:04d}"


def _trial(session_id: str, participant_id: str, outcome: Dict, started_iso: str) -> Dict:
    return {
        "recordId": _next_record_id(),
        "kind": "trial",
        "sessionId": session_id,
        "participantId": participant_id,
        "outcome": outcome,
        "startedIso": started_iso,
        "seatHeightCm": None if outcome["kind"] == "unable" else SEAT_CM,
    }


def build_seed_records() -> List[Dict]:
    """Same log, same order, same record IDs as `fixtures.ts`'s `buildLog()`."""
    log: List[Dict] = []

    def pre(minute: int, second: int = 0) -> str:
        return _at(SESSION_PRE["dateIso"], 9, minute, second)

    # PRE session: all 12 assessed.
    log.append(_trial(SESSION_PRE["sessionId"], "P-0041", _complete([2900, 3100, 3200, 3400, 3600]), pre(12)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0042", _complete([3400, 3600, 3900, 4100, 4400]), pre(18)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0043", _complete([2400, 2500, 2600, 2700, 2800]), pre(24)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0044", _complete([3800, 4000, 4300, 4600, 5000]), pre(31)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0045", _complete([2700, 2800, 2900, 3000, 3200]), pre(37)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0046", _incomplete([4200, 4600, 5100]), pre(43)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0047", _complete([3100, 3300, 3400, 3600, 3800]), pre(49)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0048", _hand_contact([3300, 3500, 3900, 4300, 4700], 3), pre(55)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0049", _complete([2600, 2700, 2800, 3000, 3100]), pre(61)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0050", dict(_UNABLE), pre(66)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0051", _complete([3000, 3200, 3300, 3500, 3700]), pre(70)))
    log.append(_trial(SESSION_PRE["sessionId"], "P-0052", _complete([3600, 3800, 4100, 4400, 4800]), pre(76)))

    def post(minute: int, second: int = 0) -> str:
        return _at(SESSION_POST["dateIso"], 9, minute, second)

    # POST session: mid-flight, 7 of 12 assessed.
    log.append(_trial(SESSION_POST["sessionId"], "P-0041", _complete([2500, 2600, 2700, 2800, 2900]), post(10)))
    log.append(_trial(SESSION_POST["sessionId"], "P-0042", _complete([3000, 3100, 3300, 3500, 3700]), post(16)))

    # EDGE: void from tracking loss, then a successful restart. Both stay in
    # the log; only the restart represents the participant.
    log.append(
        _trial(
            SESSION_POST["sessionId"],
            "P-0043",
            {"kind": "void", "reason": "roi_multiple_people", "repsCompleted": 2},
            post(21),
        )
    )
    log.append(_trial(SESSION_POST["sessionId"], "P-0043", _complete([2200, 2300, 2300, 2400, 2500]), post(22, 30)))

    # EDGE: incomplete. Three reps is a valid recorded outcome, not an error.
    log.append(_trial(SESSION_POST["sessionId"], "P-0044", _incomplete([4000, 4300, 4700]), post(28)))

    # EDGE: abort with a reason. Doesn't represent the participant, so
    # P-0045 still reads as outstanding on the roster.
    log.append(
        _trial(
            SESSION_POST["sessionId"],
            "P-0045",
            {"kind": "aborted", "reason": "interruption", "repsCompleted": 1, "elapsedMs": 3100},
            post(33),
        )
    )

    # EDGE: hand contact. Recorded in full, marked protocol-invalid, no alarm.
    log.append(
        _trial(SESSION_POST["sessionId"], "P-0048", _hand_contact([3000, 3200, 3500, 3800, 4000], 4), post(39))
    )

    # EDGE: unable to perform the protocol. Still enrolled, still counted present.
    log.append(_trial(SESSION_POST["sessionId"], "P-0050", dict(_UNABLE), post(45)))

    # EDGE: a correction appended on top of a complete trial. The original
    # is preserved forever; the roster shows the corrected outcome plus a marker.
    miscounted = _trial(SESSION_POST["sessionId"], "P-0047", _complete([3000, 3200, 3300, 3500, 3600]), post(51))
    log.append(miscounted)
    log.append(
        {
            "recordId": _next_record_id(),
            "kind": "correction",
            "sessionId": SESSION_POST["sessionId"],
            "participantId": "P-0047",
            "correctsRecordId": miscounted["recordId"],
            "outcome": _incomplete([3000, 3200, 3300, 3500]),
            "note": "rep_miscount",
            "atIso": post(52, 30),
        }
    )

    # Outstanding at post: P-0046, P-0049, P-0051, P-0052, and P-0045 (abort only).
    return log
