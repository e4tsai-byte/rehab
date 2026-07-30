"""Append-only in-memory record log, flushed to a JSON file on every append.

This is a placeholder persistence strategy, not the final architecture: a
single flat JSON file, rewritten in full on every append, single-process,
no migrations, no locking against a second server instance. It exists only
so a demo restart doesn't lose the record log. A real deployment would want
sqlite (or similar) with a proper append-only log table. Noted here per the
task's request to flag this as a placeholder.

On startup: if the JSON file already has records, load and use those
(actual durability across restarts). Otherwise seed from `seed_data.py` and
write that out as the initial file.
"""

import asyncio
import json
import threading
from pathlib import Path
from typing import Dict, List, Optional, Set


class RecordStore:
    def __init__(self, path: Path, seed_records: List[Dict]):
        self._path = path
        self._lock = threading.Lock()
        self._subscribers: Set[asyncio.Queue] = set()
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._records: List[Dict] = self._load_or_seed(seed_records)

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def _load_or_seed(self, seed_records: List[Dict]) -> List[Dict]:
        if self._path.exists():
            try:
                with self._path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, list) and data:
                    return data
            except (json.JSONDecodeError, OSError):
                pass  # fall through to re-seed a corrupt/empty file
        self._path.parent.mkdir(parents=True, exist_ok=True)
        records = list(seed_records)
        self._flush(records)
        return records

    def _flush(self, records: List[Dict]) -> None:
        tmp_path = self._path.with_suffix(".json.tmp")
        with tmp_path.open("w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        tmp_path.replace(self._path)

    def _next_record_id(self) -> str:
        highest = 0
        for record in self._records:
            record_id = record.get("recordId", "")
            try:
                highest = max(highest, int(record_id.split("-", 1)[1]))
            except (IndexError, ValueError):
                continue
        return f"R-{highest + 1:04d}"

    def append(self, record_without_id: Dict) -> Dict:
        """Assigns the next recordId, appends, flushes, and notifies
        `/ws/records` subscribers. Never mutates an existing record --
        callers only ever pass a brand-new record body."""
        with self._lock:
            record = {"recordId": self._next_record_id(), **record_without_id}
            self._records.append(record)
            self._flush(self._records)
        self._notify()
        return record

    def all_records(self) -> List[Dict]:
        return list(self._records)

    def for_session(self, session_id: str) -> List[Dict]:
        return [r for r in self._records if r.get("sessionId") == session_id]

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    def _notify(self) -> None:
        """Fires an empty message to every `/ws/records` subscriber so the
        client knows to refetch. May be called from the background capture
        thread (a trial auto-settling) as well as the event-loop thread (a
        REST handler), hence the thread-safe hop."""
        if self._loop is None:
            return
        for q in list(self._subscribers):
            self._loop.call_soon_threadsafe(q.put_nowait, {})
