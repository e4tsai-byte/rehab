import React, { useEffect, useRef, useState } from 'react'
import { AngleGauge } from '../components/AngleGauge'
import { CadencePacer } from '../components/CadencePacer'
import { Digits } from '../components/Digits'
import { FormAlertBanner } from '../components/FormAlertBanner'
import { RailButton } from '../components/RailButton'
import { RepPips } from '../components/RepPips'
import { useDataSource } from '../data/context'
import type { FormFlag, RehabLiveState, RehabRepRecord } from '../domain/rehabTypes'
import { useChime } from '../hooks/useChime'

export function RehabTrial({
  onDone,
}: {
  onDone: (summary: { completedReps: number; reps: RehabRepRecord[] }) => void
}) {
  const src = useDataSource()
  const { chime, armAudio } = useChime()
  
  const [liveState, setLiveState] = useState<RehabLiveState>({
    elevation: 0,
    phase: 'RESTING',
    holdRemaining: 5.0,
    concentricElapsed: 0,
    eccentricElapsed: 0,
    isTargetZone: false,
    flags: [],
    repsCompleted: 0,
    targetReps: 10,
  })
  
  const [completedReps, setCompletedReps] = useState<RehabRepRecord[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const prevPhaseRef = useRef<string>('RESTING')

  // Listen to WebSocket stream from localhost:8765
  useEffect(() => {
    if (!isStarted) return

    let ws: WebSocket | null = null
    try {
      ws = new WebSocket('ws://127.0.0.1:8765/ws/trials/T-1')
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (data.type === 'rehab_live') {
            setLiveState({
              elevation: data.elevation ?? 0,
              phase: data.phase ?? 'RESTING',
              holdRemaining: data.holdRemaining ?? 0,
              concentricElapsed: data.concentricElapsed ?? 0,
              eccentricElapsed: data.eccentricElapsed ?? 0,
              isTargetZone: Boolean(data.isTargetZone),
              flags: (data.flags ?? []) as FormFlag[],
              repsCompleted: data.repsCompleted ?? 0,
              targetReps: data.targetReps ?? 10,
            })
            
            // Audio chime cues on phase changes
            if (prevPhaseRef.current !== data.phase) {
              if (data.phase === 'HOLDING') {
                chime() // Arrived at 90 deg
              } else if (data.phase === 'DESCENDING' && prevPhaseRef.current === 'HOLDING') {
                chime() // 5s hold completed
              }
              prevPhaseRef.current = data.phase
            }
          } else if (data.type === 'rehab_rep') {
            chime() // Rep completed
            setCompletedReps((prev) => [...prev, data.rep])
          }
        } catch {
          // ignore parsing error
        }
      }
    } catch {
      // ignore connection error
    }

    return () => {
      if (ws) ws.close()
    }
  }, [isStarted, chime])

  function handleStart() {
    armAudio()
    setIsStarted(true)
  }

  function handleFinish() {
    onDone({
      completedReps: liveState.repsCompleted,
      reps: completedReps,
    })
  }

  return (
    <div className="zones">
      <div className="field field--locked field--split">
        {/* Left Half: Annotated Camera Skeleton */}
        <div className="field__view">
          <img
            src="http://127.0.0.1:8765/video"
            alt="Camera skeleton view"
            className="selfview__video"
          />
        </div>

        {/* Right Half: Rehab Coaching Engine */}
        <div className="field__stage">
          {!isStarted ? (
            <div className="cue">
              <p className="cue__title">右肩前舉復健訓練</p>
              <p className="cue__hint">
                目標：5 秒平舉至 90° $	o$ 停頓 5 秒 $	o$ 5 秒緩慢下放
              </p>
              <p className="cue__framing">
                請面向鏡頭站立，確保上半身完整進入畫面中
              </p>
            </div>
          ) : (
            <div className="rehab-stage">
              {/* Real-time Angle Goniometer */}
              <AngleGauge
                currentAngle={liveState.elevation}
                targetAngle={90}
                isTargetZone={liveState.isTargetZone}
              />

              {/* 5s - 5s - 5s Cadence Pacer & Hold Ring */}
              <CadencePacer
                phase={liveState.phase}
                holdRemaining={liveState.holdRemaining}
                concentricElapsed={liveState.concentricElapsed}
                eccentricElapsed={liveState.eccentricElapsed}
              />

              {/* Real-time Compensation / Form Alerts */}
              <FormAlertBanner flags={liveState.flags} />
            </div>
          )}
        </div>
      </div>

      {/* Persistent Facilitator / Action Rail */}
      <div className="rail">
        <div className="rail__context">
          <span className="rail__context-id">
            第 <Digits value={liveState.repsCompleted} /> / {liveState.targetReps} 次
          </span>
          <span className="rail__context-label">
            {liveState.phase === 'HOLDING' ? '維持停頓中' : liveState.phase === 'ASCENDING' ? '平舉抬起中' : liveState.phase === 'DESCENDING' ? '控制下放中' : '準備開始'}
          </span>
        </div>

        <div className="rail__state">
          <RepPips done={liveState.repsCompleted} total={liveState.targetReps} />
        </div>

        <div className="rail__spacer" />

        <div className="rail__actions">
          {!isStarted ? (
            <RailButton variant="primary" icon="start" onClick={handleStart}>
              開始訓練
            </RailButton>
          ) : (
            <RailButton variant="primary" onClick={handleFinish}>
              完成訓練
            </RailButton>
          )}
        </div>
      </div>
    </div>
  )
}
