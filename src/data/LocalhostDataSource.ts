/* ─────────────────────────────────────────────────────────────────────────────
   LocalhostDataSource. Implements SessionDataSource against the Python capture
   pipeline over localhost HTTP/WebSocket. See SessionDataSource.ts for "the
   seam" — no UI code may know this exists instead of FixtureDataSource.

   Endpoints (assumed contract — the Python server did not exist yet when this
   was written; see the report that shipped alongside this file for the exact
   assumptions flagged as guesses):

     GET  {base}/block
     GET  {base}/sessions
     GET  {base}/sessions/:sessionId/records
     POST {base}/trials/start            { sessionId, participantId } -> { trialId } | trialId
     POST {base}/trials/:trialId/end     -> Outcome
     POST {base}/trials/:trialId/abort   { reason } -> Outcome
     POST {base}/participants/:participantId/mark-unable   { sessionId } -> Outcome
     POST {base}/corrections             body = input, no content

     WS   {base}/ws/tracking     persistent, one message per tracking change
     WS   {base}/ws/trials/:trialId   one message per TrialEvent, closes itself
                                       after `settled`
     WS   {base}/ws/records      one message per record-log growth (payload
                                  ignored, per the interface's doc comment)
   ───────────────────────────────────────────────────────────────────────────── */

import type {
  AbortReason,
  AnyRecord,
  AssessmentSession,
  Block,
  CorrectionNote,
  Outcome,
  ParticipantId,
  RecordId,
  SessionId,
  TrackingState,
  TrialEvent,
} from '../domain/types'
import type { SessionDataSource, TrialId, Unsubscribe } from './SessionDataSource'

const RECONNECT_DELAY_MS = 2000

function isTrackingState(v: unknown): v is TrackingState {
  return v === 'idle' || v === 'live' || v === 'lost'
}

/** Accepts a bare tracking state or a `TrialEvent`-shaped `{ type: 'tracking', state }` frame. */
function parseTrackingMessage(raw: string): TrackingState | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isTrackingState(parsed)) return parsed
    if (parsed && typeof parsed === 'object' && 'state' in parsed) {
      const state = (parsed as { state: unknown }).state
      if (isTrackingState(state)) return state
    }
  } catch {
    // malformed frame; ignored
  }
  return null
}

export class LocalhostDataSource implements SessionDataSource {
  readonly isSimulated = false

  private readonly baseUrl: string
  private readonly wsBaseUrl: string

  // ── Persistent tracking socket ──────────────────────────────────────────
  // Opened at construction so getTrackingState() (synchronous, per the
  // interface) always has a cached value to return, even before any surface
  // subscribes. Stays open for the lifetime of this data source; individual
  // subscribeTracking() callers only add/remove a listener on it.
  private trackingState: TrackingState = 'idle'
  private trackingSocket: WebSocket | null = null
  private trackingReconnectTimer: number | null = null
  private readonly trackingHandlers = new Set<(s: TrackingState) => void>()

  // ── Records socket ───────────────────────────────────────────────────────
  // Lazily opened on first subscribeRecords() call, closed once the last
  // listener unsubscribes, so a live source with no one listening doesn't
  // hold a socket open forever.
  private recordsSocket: WebSocket | null = null
  private recordsReconnectTimer: number | null = null
  private readonly recordsHandlers = new Set<() => void>()

  constructor(baseUrl = 'http://127.0.0.1:8765') {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.wsBaseUrl = this.baseUrl.replace(/^http/, 'ws')
    this.connectTrackingSocket()
  }

  /* ── REST ─────────────────────────────────────────────────────────────── */

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}${path}`, init)
    } catch (err) {
      throw new Error(
        `LocalhostDataSource: could not reach backend at ${this.baseUrl}${path} — is the Python server running? (${String(err)})`,
      )
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`LocalhostDataSource: ${path} responded ${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`)
    }
    const text = await res.text()
    if (!text) return undefined as T
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(`LocalhostDataSource: ${path} returned a non-JSON response`)
    }
  }

  async getBlock(): Promise<Block> {
    return this.request<Block>('/block')
  }

  async getSessions(): Promise<readonly AssessmentSession[]> {
    return this.request<readonly AssessmentSession[]>('/sessions')
  }

  async getRecords(sessionId: SessionId): Promise<readonly AnyRecord[]> {
    return this.request<readonly AnyRecord[]>(`/sessions/${encodeURIComponent(sessionId)}/records`)
  }

  async startTrial(sessionId: SessionId, participantId: ParticipantId): Promise<TrialId> {
    const result = await this.request<{ trialId: TrialId } | TrialId>('/trials/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, participantId }),
    })
    return typeof result === 'string' ? result : result.trialId
  }

  async endTrial(trialId: TrialId): Promise<Outcome> {
    return this.request<Outcome>(`/trials/${encodeURIComponent(trialId)}/end`, { method: 'POST' })
  }

  async abortTrial(trialId: TrialId, reason: AbortReason): Promise<Outcome> {
    return this.request<Outcome>(`/trials/${encodeURIComponent(trialId)}/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
  }

  async markUnable(sessionId: SessionId, participantId: ParticipantId): Promise<Outcome> {
    return this.request<Outcome>(`/participants/${encodeURIComponent(participantId)}/mark-unable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
  }

  async appendCorrection(input: {
    sessionId: SessionId
    participantId: ParticipantId
    correctsRecordId: RecordId
    outcome: Outcome
    note: CorrectionNote
  }): Promise<void> {
    await this.request<void>('/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  }

  /* ── Tracking (persistent socket, synchronous read) ──────────────────────── */

  getTrackingState(): TrackingState {
    return this.trackingState
  }

  subscribeTracking(handler: (s: TrackingState) => void): Unsubscribe {
    this.trackingHandlers.add(handler)
    return () => {
      this.trackingHandlers.delete(handler)
    }
  }

  private setTrackingState(s: TrackingState) {
    this.trackingState = s
    for (const h of this.trackingHandlers) h(s)
  }

  private connectTrackingSocket() {
    let socket: WebSocket
    try {
      socket = new WebSocket(`${this.wsBaseUrl}/ws/tracking`)
    } catch {
      this.setTrackingState('lost')
      this.scheduleTrackingReconnect()
      return
    }
    this.trackingSocket = socket
    socket.onmessage = (ev) => {
      if (typeof ev.data !== 'string') return
      const state = parseTrackingMessage(ev.data)
      if (state) this.setTrackingState(state)
    }
    // onclose always follows onerror, so the reconnect + state fallback lives
    // there; nothing extra to do on error itself.
    socket.onclose = () => {
      if (this.trackingSocket === socket) this.trackingSocket = null
      // Backend unreachable/dropped. There is no explicit "offline" tracking
      // state in the domain model, so `lost` (the same state used for
      // in-trial tracking loss) is the closest honest signal for the rail
      // indicator — flagged in the report rather than assumed silently.
      this.setTrackingState('lost')
      this.scheduleTrackingReconnect()
    }
  }

  private scheduleTrackingReconnect() {
    if (this.trackingReconnectTimer !== null) return
    this.trackingReconnectTimer = window.setTimeout(() => {
      this.trackingReconnectTimer = null
      this.connectTrackingSocket()
    }, RECONNECT_DELAY_MS)
  }

  /* ── Trial event stream (one socket per trial) ───────────────────────────── */

  subscribeTrial(trialId: TrialId, handler: (e: TrialEvent) => void): Unsubscribe {
    const socket = new WebSocket(`${this.wsBaseUrl}/ws/trials/${encodeURIComponent(trialId)}`)
    socket.onmessage = (ev) => {
      if (typeof ev.data !== 'string') return
      try {
        const parsed = JSON.parse(ev.data) as TrialEvent
        handler(parsed)
      } catch {
        // malformed frame; ignored rather than crashing the trial surface
      }
    }
    return () => {
      socket.close()
    }
  }

  /* ── Record-log growth notifications (shared, refcounted socket) ─────────── */

  subscribeRecords(handler: () => void): Unsubscribe {
    this.recordsHandlers.add(handler)
    if (!this.recordsSocket) this.connectRecordsSocket()
    return () => {
      this.recordsHandlers.delete(handler)
      if (this.recordsHandlers.size === 0) this.teardownRecordsSocket()
    }
  }

  private connectRecordsSocket() {
    if (this.recordsHandlers.size === 0) return
    let socket: WebSocket
    try {
      socket = new WebSocket(`${this.wsBaseUrl}/ws/records`)
    } catch {
      this.scheduleRecordsReconnect()
      return
    }
    this.recordsSocket = socket
    socket.onmessage = () => {
      for (const h of this.recordsHandlers) h()
    }
    socket.onclose = () => {
      if (this.recordsSocket === socket) this.recordsSocket = null
      if (this.recordsHandlers.size > 0) this.scheduleRecordsReconnect()
    }
  }

  private scheduleRecordsReconnect() {
    if (this.recordsReconnectTimer !== null) return
    this.recordsReconnectTimer = window.setTimeout(() => {
      this.recordsReconnectTimer = null
      this.connectRecordsSocket()
    }, RECONNECT_DELAY_MS)
  }

  private teardownRecordsSocket() {
    if (this.recordsReconnectTimer !== null) {
      window.clearTimeout(this.recordsReconnectTimer)
      this.recordsReconnectTimer = null
    }
    if (this.recordsSocket) {
      this.recordsSocket.close()
      this.recordsSocket = null
    }
  }
}
