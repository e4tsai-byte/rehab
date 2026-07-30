"""Sites, enrolment, and session-opening -- the state behind the new Setup
screen's four SessionDataSource methods (`getSites`, `getEnrolment`,
`enrolParticipant`, `openSession`).

Same placeholder-persistence approach as `store.py`: one JSON file,
rewritten in full on every mutation, loaded on startup if present. Not the
final architecture (no locking, no migrations) -- flagged for the same
reason `store.py` flags it.

Sites are static (seeded, never created at runtime -- nothing in the
contract adds a site). Enrolment and sessions are mutable: staff can enrol
a new participant, and opening a session can create a new one or re-open
(update attendance on) an existing siteId+year+cycle+phase combination.

INVARIANT 2, enforced the same way the frontend enforces it: `enrol_participant`
takes only a label. The pseudonymous id is assigned here, by the store --
there is no parameter a name could be passed through.
"""

import json
import threading
from pathlib import Path
from typing import Dict, List, Optional

from . import seed_data


class EnrolmentStore:
    def __init__(self, path: Path):
        self._path = path
        self._lock = threading.Lock()
        state = self._load_or_seed()
        self._enrolment: Dict[str, List[Dict]] = state["enrolment"]
        self._sessions: List[Dict] = state["sessions"]
        self._current_block: Dict = state["currentBlock"]
        self._next_participant_seq: int = state["nextParticipantSeq"]
        self._next_session_seq: int = state["nextSessionSeq"]

    # ── persistence ──────────────────────────────────────────────────────

    def _load_or_seed(self) -> Dict:
        if self._path.exists():
            try:
                with self._path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, dict) and "enrolment" in data:
                    return data
            except (json.JSONDecodeError, OSError):
                pass  # fall through to re-seed a corrupt/empty file

        seeded = {
            "enrolment": {k: list(v) for k, v in seed_data.ENROLMENT_BY_SITE.items()},
            "sessions": list(seed_data.SESSIONS),
            "currentBlock": dict(seed_data.BLOCK),
            "nextParticipantSeq": 56,  # seed data ends at P-0055
            "nextSessionSeq": 1,
        }
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._flush(seeded)
        return seeded

    def _flush(self, state: Optional[Dict] = None) -> None:
        payload = state if state is not None else {
            "enrolment": self._enrolment,
            "sessions": self._sessions,
            "currentBlock": self._current_block,
            "nextParticipantSeq": self._next_participant_seq,
            "nextSessionSeq": self._next_session_seq,
        }
        tmp_path = self._path.with_suffix(".json.tmp")
        with tmp_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        tmp_path.replace(self._path)

    # ── reads ────────────────────────────────────────────────────────────

    def get_sites(self) -> List[Dict]:
        return list(seed_data.SITES)

    def get_enrolment(self, site_id: str) -> List[Dict]:
        return list(self._enrolment.get(site_id, []))

    def get_current_block(self) -> Dict:
        return dict(self._current_block)

    def get_sessions(self) -> List[Dict]:
        return list(self._sessions)

    # ── writes ───────────────────────────────────────────────────────────

    def enrol_participant(self, site_id: str, label: str) -> Dict:
        with self._lock:
            participant = {"id": f"P-{self._next_participant_seq:04d}", "label": label}
            self._next_participant_seq += 1
            self._enrolment.setdefault(site_id, []).append(participant)
            self._flush()
        return dict(participant)

    def open_session(self, setup: Dict) -> Dict:
        """Find-or-create the session for (siteId, year, cycle, phase).
        Re-opening an existing one updates its attendeeIds to today's
        selection -- attendance varies session to session, per the type's
        own comment on AssessmentSession.attendeeIds."""
        site_id = setup["siteId"]
        year = setup["year"]
        cycle = setup["cycle"]
        phase = setup["phase"]
        block_id = f"B-{site_id}-{year}-{cycle}"

        with self._lock:
            for session in self._sessions:
                if session["blockId"] == block_id and session["phase"] == phase:
                    session["attendeeIds"] = list(setup["attendeeIds"])
                    self._sync_current_block(site_id, block_id, year, cycle)
                    self._flush()
                    return dict(session)

            session = {
                "sessionId": f"S-{self._next_session_seq:04d}",
                "blockId": block_id,
                "phase": phase,
                # No wall-clock date scoping needed for a hackathon demo --
                # a real deployment would stamp today's date here.
                "dateIso": self._current_block.get("startedIso", ""),
                "attendeeIds": list(setup["attendeeIds"]),
            }
            self._next_session_seq += 1
            self._sessions.append(session)
            self._sync_current_block(site_id, block_id, year, cycle)
            self._flush()
            return dict(session)

    def _sync_current_block(self, site_id: str, block_id: str, year: int, cycle: int) -> None:
        """`getBlock()` is still called by Roster/Sheet to mean "the 期 in
        view" -- point it at whichever block a session was most recently
        opened for. Participants come from that site's enrolment."""
        site_name = next((s["name"] for s in seed_data.SITES if s["siteId"] == site_id), site_id)
        self._current_block = {
            "blockId": block_id,
            "siteId": site_id,
            "siteName": site_name,
            "blockName": f"{year} 年度第 {cycle} 期",
            "startedIso": self._current_block.get("startedIso", ""),
            "participants": self._enrolment.get(site_id, []),
        }
