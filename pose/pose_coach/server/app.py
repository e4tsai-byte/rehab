"""FastAPI app: REST + WebSocket implementation of `SessionDataSource.ts`
against the real pose-tracking pipeline.

Run (from `pose/`, using the project's `.venv-test`):
    .venv-test/bin/python -m uvicorn pose_coach.server.app:app --host 127.0.0.1 --port 8765

Serves on http://127.0.0.1:8765 per README.md's "seam" section. CORS is
enabled for the Vite dev server (http://localhost:5173) only.
"""

import asyncio
import datetime
from pathlib import Path
from typing import Annotated, Dict, List, Literal, Union

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from . import seed_data
from .enrolment import EnrolmentStore
from .store import RecordStore
from .tracking import CaptureRunner, TrackingHub, TrialManager

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_PATH = DATA_DIR / "records.json"
ENROLMENT_PATH = DATA_DIR / "enrolment.json"

app = FastAPI(title="pose-coach localhost server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

trial_manager = TrialManager()
tracking_hub = TrackingHub(on_change=trial_manager.on_tracking_state)
store = RecordStore(DATA_PATH, seed_data.build_seed_records())
enrolment_store = EnrolmentStore(ENROLMENT_PATH)
capture_runner = CaptureRunner(tracking_hub, trial_manager)


@app.on_event("startup")
async def _startup() -> None:
    loop = asyncio.get_running_loop()
    tracking_hub.bind_loop(loop)
    trial_manager.bind_loop(loop)
    store.bind_loop(loop)
    capture_runner.start()


@app.on_event("shutdown")
async def _shutdown() -> None:
    capture_runner.stop()


# ── REST: block / sessions / records ───────────────────────────────────────


@app.get("/block")
async def get_block() -> Dict:
    return enrolment_store.get_current_block()


@app.get("/sessions")
async def get_sessions() -> List[Dict]:
    return enrolment_store.get_sessions()


@app.get("/sessions/{session_id}/records")
async def get_records(session_id: str) -> List[Dict]:
    return store.for_session(session_id)


# ── REST: enrolment and session setup ───────────────────────────────────────


@app.get("/sites")
async def get_sites() -> List[Dict]:
    return enrolment_store.get_sites()


@app.get("/sites/{site_id}/enrolment")
async def get_enrolment(site_id: str) -> List[Dict]:
    return enrolment_store.get_enrolment(site_id)


class EnrolParticipantBody(BaseModel):
    label: str


@app.post("/sites/{site_id}/enrolment")
async def enrol_participant(site_id: str, body: EnrolParticipantBody) -> Dict:
    return enrolment_store.enrol_participant(site_id, body.label)


Phase = Literal["pre", "post"]


class SessionSetupBody(BaseModel):
    siteId: str
    year: int
    cycle: int
    phase: Phase
    attendeeIds: List[str]


@app.post("/sessions/open")
async def open_session(body: SessionSetupBody) -> Dict:
    return enrolment_store.open_session(body.model_dump())


# ── REST: trial lifecycle ───────────────────────────────────────────────────


class StartTrialBody(BaseModel):
    sessionId: str
    participantId: str


@app.post("/trials/start")
async def start_trial(body: StartTrialBody) -> Dict:
    def on_settled(controller) -> None:
        store.append(
            {
                "kind": "trial",
                "sessionId": controller.session_id,
                "participantId": controller.participant_id,
                "outcome": controller.outcome,
                "startedIso": controller.started_iso,
                # Never staff-entered, never derived here -- ArUco marker
                # detection is out of scope for this build (confirmed stub).
                "seatHeightCm": None,
            }
        )

    controller = trial_manager.start(
        body.sessionId, body.participantId, capture_runner.latest_frame_timestamp, on_settled
    )
    return {"trialId": controller.trial_id}


@app.post("/trials/{trial_id}/end")
async def end_trial(trial_id: str) -> Dict:
    controller = trial_manager.get(trial_id)
    if controller is None:
        raise HTTPException(status_code=404, detail="unknown trialId")
    return controller.end()


AbortReason = Literal["wrong_participant", "interruption", "participant_declined", "equipment", "other"]


class AbortTrialBody(BaseModel):
    reason: AbortReason


@app.post("/trials/{trial_id}/abort")
async def abort_trial(trial_id: str, body: AbortTrialBody) -> Dict:
    controller = trial_manager.get(trial_id)
    if controller is None:
        raise HTTPException(status_code=404, detail="unknown trialId")
    return controller.abort(body.reason)


class MarkUnableBody(BaseModel):
    sessionId: str


@app.post("/participants/{participant_id}/mark-unable")
async def mark_unable(participant_id: str, body: MarkUnableBody) -> Dict:
    outcome = {"kind": "unable"}
    store.append(
        {
            "kind": "trial",
            "sessionId": body.sessionId,
            "participantId": participant_id,
            "outcome": outcome,
            "startedIso": datetime.datetime.now().isoformat(timespec="seconds"),
            "seatHeightCm": None,
        }
    )
    return outcome


# ── REST: corrections ────────────────────────────────────────────────────────
# A discriminated-union Outcome model, used only to validate the untrusted
# `outcome` field of a correction body (every outcome this server emits
# itself is built internally as a plain dict and not re-validated here).
# `hand_contact` is included even though this server's own trial logic never
# produces it -- CorrectionNote's `hand_contact_missed` exists precisely so
# a facilitator can manually correct a trial to hand_contact after the fact.


class CompleteOutcomeIn(BaseModel):
    kind: Literal["complete"]
    repsCompleted: Literal[5]
    repTimesMs: List[int]
    totalMs: int


class IncompleteOutcomeIn(BaseModel):
    kind: Literal["incomplete"]
    repsCompleted: int
    repTimesMs: List[int]
    elapsedMs: int


class HandContactOutcomeIn(BaseModel):
    kind: Literal["hand_contact"]
    repsCompleted: int
    repTimesMs: List[int]
    elapsedMs: int
    firstContactRep: int
    protocolInvalid: Literal[True]


class UnableOutcomeIn(BaseModel):
    kind: Literal["unable"]


class AbortedOutcomeIn(BaseModel):
    kind: Literal["aborted"]
    reason: AbortReason
    repsCompleted: int
    elapsedMs: int


VoidReason = Literal["roi_multiple_people", "tracking_lost", "out_of_frame"]


class VoidOutcomeIn(BaseModel):
    kind: Literal["void"]
    reason: VoidReason
    repsCompleted: int


OutcomeIn = Annotated[
    Union[
        CompleteOutcomeIn,
        IncompleteOutcomeIn,
        HandContactOutcomeIn,
        UnableOutcomeIn,
        AbortedOutcomeIn,
        VoidOutcomeIn,
    ],
    Field(discriminator="kind"),
]

CorrectionNote = Literal["rep_miscount", "wrong_participant", "hand_contact_missed", "other"]


class CorrectionBody(BaseModel):
    sessionId: str
    participantId: str
    correctsRecordId: str
    outcome: OutcomeIn
    note: CorrectionNote


@app.post("/corrections", status_code=204)
async def add_correction(body: CorrectionBody) -> None:
    store.append(
        {
            "kind": "correction",
            "sessionId": body.sessionId,
            "participantId": body.participantId,
            "correctsRecordId": body.correctsRecordId,
            "outcome": body.outcome.model_dump(),
            "note": body.note,
            "atIso": datetime.datetime.now().isoformat(timespec="seconds"),
        }
    )
    return None


# ── Live video preview (annotated) ──────────────────────────────────────────
# Reinstated on explicit request: the participant/facilitator want to SEE
# tracking working, not just trust a text status chip. This deliberately
# reverses the new frontend's own "not built, on purpose: any camera or
# MediaPipe code" -- a real, acknowledged deviation from the documented
# design, not an oversight. Still honors the hard privacy invariant: nothing
# here writes a frame to disk. Each frame is JPEG-encoded in memory by the
# capture loop (tracking.py) with the skeleton overlay already drawn,
# immediately overwriting the previous one -- never a stored sequence.
_VIDEO_FRAME_INTERVAL_S = 1 / 15


@app.get("/video")
async def video_feed() -> StreamingResponse:
    async def _mjpeg():
        boundary = b"frame"
        while True:
            jpeg = capture_runner.get_latest_jpeg()
            if jpeg is not None:
                yield (
                    b"--" + boundary + b"\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(jpeg)).encode() + b"\r\n\r\n" + jpeg + b"\r\n"
                )
            await asyncio.sleep(_VIDEO_FRAME_INTERVAL_S)

    return StreamingResponse(_mjpeg(), media_type="multipart/x-mixed-replace; boundary=frame")


# ── WebSockets ───────────────────────────────────────────────────────────────


@app.websocket("/ws/tracking")
async def ws_tracking(websocket: WebSocket) -> None:
    await websocket.accept()
    q = tracking_hub.subscribe()
    try:
        while True:
            message = await q.get()
            await websocket.send_json(message)
    except WebSocketDisconnect:
        pass
    finally:
        tracking_hub.unsubscribe(q)


@app.websocket("/ws/trials/{trial_id}")
async def ws_trial(websocket: WebSocket, trial_id: str) -> None:
    await websocket.accept()
    controller = trial_manager.get(trial_id)
    if controller is None:
        await websocket.close(code=4404)
        return

    q = controller.subscribe()
    try:
        while True:
            message = await q.get()
            if message is None:  # sentinel: 'settled' already sent, close now
                break
            await websocket.send_json(message)
    except WebSocketDisconnect:
        pass
    finally:
        controller.unsubscribe(q)
        try:
            await websocket.close()
        except RuntimeError:
            pass  # already closed (client disconnected first)


@app.websocket("/ws/records")
async def ws_records(websocket: WebSocket) -> None:
    await websocket.accept()
    q = store.subscribe()
    try:
        while True:
            await q.get()
            await websocket.send_json({})
    except WebSocketDisconnect:
        pass
    finally:
        store.unsubscribe(q)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8765)
