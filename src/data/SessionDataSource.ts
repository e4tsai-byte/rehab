/* ─────────────────────────────────────────────────────────────────────────────
   THE SEAM.

   One interface, two implementations:

     · FixtureDataSource  — this build. Simulated, deterministic, no camera.
     · LocalhostDataSource — October. The Python pose pipeline serves this same
                             shape over localhost HTTP/WebSocket on the appliance.

   NO UI CODE MAY KNOW WHICH IS LIVE. If a component imports from `data/fixtures`
   directly, that is a bug. Everything goes through `useDataSource()`.

   This is the boundary named in CLAUDE.md ("the pose pipeline implements that
   same interface later; no UI code may know the difference") and in the design
   doc's runtime seam. Keep it narrow.
   ───────────────────────────────────────────────────────────────────────────── */

import type {
  AbortReason,
  AnyRecord,
  AssessmentSession,
  Block,
  CorrectionNote,
  Outcome,
  Participant,
  ParticipantId,
  RecordId,
  SessionId,
  SessionSetup,
  Site,
  SiteId,
  TrackingState,
  TrialEvent,
} from '../domain/types'

export type Unsubscribe = () => void

export interface SessionDataSource {
  /** Whether this source is backed by a real camera. Drives the demo banner. */
  readonly isSimulated: boolean

  getBlock(): Promise<Block>
  getSessions(): Promise<readonly AssessmentSession[]>
  getRecords(sessionId: SessionId): Promise<readonly AnyRecord[]>

  /* ── Enrolment and session setup ───────────────────────────────────────────
     The setup screen runs entirely against these four. A real participant store
     — a local SQLite table on the appliance, most likely — implements them
     without any UI change: the screen never learns where the list came from.

     INVARIANT 2 is enforced by the SIGNATURE, not by discipline. `enrol` takes a
     display label and nothing else. There is no name parameter to pass, no
     optional field to fill in later, and the pseudonymous id is assigned by the
     store rather than supplied by the caller — so a UI that wanted to record a
     real identifier would have nowhere to put it.
     ─────────────────────────────────────────────────────────────────────────── */

  getSites(): Promise<readonly Site[]>

  /** Everyone enrolled at the site, across 期. The setup screen picks from this. */
  getEnrolment(siteId: SiteId): Promise<readonly Participant[]>

  /** Enrol someone new. The STORE assigns the id; staff supply only a label. */
  enrolParticipant(siteId: SiteId, label: string): Promise<Participant>

  /** Open (or re-open) the session the setup screen configured. */
  openSession(setup: SessionSetup): Promise<AssessmentSession>

  /** Current tracking state, for the rail indicator between trials. */
  getTrackingState(): TrackingState
  subscribeTracking(handler: (s: TrackingState) => void): Unsubscribe

  /**
   * Begin a trial. THE CUE EVENT.
   *
   * The clock starts here, on the staff action, never on first movement.
   * Cue-to-movement reaction time in older adults is 0.3-1.0 s, which is larger
   * than the entire October error budget and systematic rather than random, so a
   * movement-triggered clock could not be compared to a human stopwatch.
   */
  startTrial(sessionId: SessionId, participantId: ParticipantId): Promise<TrialId>

  /** Live event stream for the trial in progress. */
  subscribeTrial(trialId: TrialId, handler: (e: TrialEvent) => void): Unsubscribe

  /**
   * End the trial now and record whatever happened. Fewer than 5 reps records
   * `incomplete`, which is a valid outcome and not an error.
   */
  endTrial(trialId: TrialId): Promise<Outcome>

  /** Discard the trial with a reason. Appends an `aborted` record. */
  abortTrial(trialId: TrialId, reason: AbortReason): Promise<Outcome>

  /** Record that the protocol cannot be performed at all. Still enrolled. */
  markUnable(sessionId: SessionId, participantId: ParticipantId): Promise<Outcome>

  /** Append a correction. Never mutates the record it corrects. */
  appendCorrection(input: {
    sessionId: SessionId
    participantId: ParticipantId
    correctsRecordId: RecordId
    outcome: Outcome
    note: CorrectionNote
  }): Promise<void>

  /** Fires whenever the record log grows, so surfaces can refetch. */
  subscribeRecords(handler: () => void): Unsubscribe
}

export type TrialId = string
