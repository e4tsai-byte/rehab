"""Localhost HTTP + WebSocket server implementing the backend half of
`src/data/SessionDataSource.ts` (the frontend/backend contract) for the
Tier 1 five-times-sit-to-stand assessment.

Package layout:
    seed_data.py -- roster/block/sessions/seed record log, ported 1:1 from
                    `src/data/fixtures.ts` so the UI isn't empty on first run.
    store.py     -- append-only in-memory record log, flushed to a JSON file
                    on every append, with pub/sub for `/ws/records`.
    tracking.py  -- the always-on background camera+pipeline loop, the
                    idle/live/lost mapping, and the per-trial fixed-5-rep
                    controller (built on top of the existing, unmodified
                    `PoseTrackingPipeline` / `PoseCapture` / `RepCounter`).
    app.py       -- the FastAPI app: REST routes, WebSocket routes, CORS,
                    startup/shutdown wiring.

Run with (from `pose/`, using the project's `.venv-test`):
    .venv-test/bin/python -m uvicorn pose_coach.server.app:app --host 127.0.0.1 --port 8765

This is Tier 1 only: fixed 5-rep timing off an explicit trial-start cue.
No velocity, no fatigue-stop, no progression -- `autoregulation/velocity.py`
and `autoregulation/fatigue_stop.py` are never imported here.
"""
