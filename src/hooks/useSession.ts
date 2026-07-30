import { useCallback, useEffect, useState } from 'react'
import { useDataSource } from '../data/context'
import { resolveTrials, type ResolvedTrial } from '../domain/records'
import type { AssessmentSession, Block, SessionId, TrackingState } from '../domain/types'

export interface SessionView {
  readonly block: Block | null
  readonly sessions: readonly AssessmentSession[]
  readonly active: AssessmentSession | null
  readonly resolved: readonly ResolvedTrial[]
  /** Resolved trials for every session, keyed by sessionId. The sheet needs both. */
  readonly allResolved: ReadonlyMap<SessionId, readonly ResolvedTrial[]>
  readonly refresh: () => void
}

/** Loads the 期 and keeps resolved trials in sync with the append-only log. */
export function useSession(activePhase: 'pre' | 'post' = 'post'): SessionView {
  const src = useDataSource()
  const [block, setBlock] = useState<Block | null>(null)
  const [sessions, setSessions] = useState<readonly AssessmentSession[]>([])
  const [allResolved, setAllResolved] = useState<ReadonlyMap<SessionId, readonly ResolvedTrial[]>>(
    new Map(),
  )

  const load = useCallback(async () => {
    const [b, ss] = await Promise.all([src.getBlock(), src.getSessions()])
    setBlock(b)
    setSessions(ss)
    const entries = await Promise.all(
      ss.map(async (s) => {
        const records = await src.getRecords(s.sessionId)
        return [s.sessionId, resolveTrials(records)] as const
      }),
    )
    setAllResolved(new Map(entries))
  }, [src])

  useEffect(() => {
    void load()
    return src.subscribeRecords(() => void load())
  }, [load, src])

  const active = sessions.find((s) => s.phase === activePhase) ?? null
  const resolved = (active && allResolved.get(active.sessionId)) ?? []

  return { block, sessions, active, resolved, allResolved, refresh: () => void load() }
}

/** Tracking state for the rail indicator. */
export function useTracking(): TrackingState {
  const src = useDataSource()
  const [state, setState] = useState<TrackingState>(() => src.getTrackingState())
  useEffect(() => src.subscribeTracking(setState), [src])
  return state
}
