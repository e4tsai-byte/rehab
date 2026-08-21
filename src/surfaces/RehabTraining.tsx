import { useCallback, useEffect, useState } from 'react'
import { AngleGauge } from '../components/AngleGauge'
import { CadencePacer } from '../components/CadencePacer'
import { FormAlertBanner } from '../components/FormAlertBanner'
import { RepPips } from '../components/RepPips'
import { EXERCISE_CATALOG } from '../domain/exerciseCatalog'
import type { CompletedSession, RehabPhase, RehabRepRecord, UserSettings } from '../domain/rehabTypes'
import { useChime } from '../hooks/useChime'
import { usePoseTracker } from '../hooks/usePoseTracker'

interface RehabTrainingProps {
  exerciseId: string
  settings: UserSettings
  onFinishSession: (session: CompletedSession) => void
  onCancel: () => void
}

const PHASE_LABEL: Record<RehabPhase, string> = {
  RESTING: '準備開始',
  ASCENDING: '向上平舉',
  HOLDING: '維持停頓',
  DESCENDING: '控制下放',
}

const PHASE_CLASS: Record<RehabPhase, string> = {
  RESTING: 'resting',
  ASCENDING: 'ascending',
  HOLDING: 'holding',
  DESCENDING: 'descending',
}

export function RehabTraining({
  exerciseId,
  settings,
  onFinishSession,
  onCancel,
}: RehabTrainingProps) {
  const { chime, armAudio } = useChime()
  const [completedReps, setCompletedReps] = useState<RehabRepRecord[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const exercise = EXERCISE_CATALOG.find((e) => e.id === exerciseId) ?? EXERCISE_CATALOG[0]!
  const isSeated = exercise.posture === 'seated'

  const { isLoaded, liveState, videoRef, canvasRef } = usePoseTracker({
    isSeated,
    // Both of these are optional on the hook, so omitting them is a silent
    // fallback to 5.0s / 10 reps rather than a type error — the user's settings
    // would simply never reach the tracker.
    holdDurationS: settings.holdDurationS,
    targetReps: settings.targetReps,
    onRep: (rep) => {
      if (settings.soundEnabled) chime()
      setCompletedReps((prev) => [...prev, rep])
    },
    onPhaseChange: (oldPhase, newPhase) => {
      if (!settings.soundEnabled) return
      if (newPhase === 'HOLDING') chime()
      else if (newPhase === 'DESCENDING' && oldPhase === 'HOLDING') chime()
    },
  })

  useEffect(() => {
    let stream: MediaStream | null = null

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch {
        setCameraError('請在瀏覽器網址列允許相機存取權限')
      }
    }

    void startCamera()

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [videoRef])

  const handleComplete = useCallback(() => {
    const cleanCount = completedReps.filter((r) => r.isClean).length
    const qualityScore =
      completedReps.length > 0 ? Math.round((cleanCount / completedReps.length) * 100) : 100
    const totalHold = completedReps.reduce((acc, r) => acc + r.holdDuration, 0)
    const avgHold =
      completedReps.length > 0 ? totalHold / completedReps.length : settings.holdDurationS
    const peakDeg = completedReps.reduce((max, r) => Math.max(max, r.peakElevation), 0)

    onFinishSession({
      id: `session-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseNameZh: exercise.nameZh,
      timestamp: Date.now(),
      completedReps: completedReps.length,
      targetReps: settings.targetReps,
      cleanRepsCount: cleanCount,
      formQualityScorePct: qualityScore,
      averageHoldDurationS: Math.round(avgHold * 10) / 10,
      peakElevationDeg: peakDeg,
      reps: completedReps,
    })
  }, [completedReps, exercise, settings, onFinishSession])

  useEffect(() => {
    if (isStarted && completedReps.length >= settings.targetReps) handleComplete()
  }, [completedReps.length, settings.targetReps, isStarted, handleComplete])

  function handleStart() {
    armAudio()
    setIsStarted(true)
  }

  const phaseLabel = PHASE_LABEL[liveState.phase]

  return (
    <div className="training-surface">
      <div className="training-body">
        <div className="training-camera">
          <video ref={videoRef} autoPlay playsInline muted className="training-camera__video" />
          <canvas ref={canvasRef} className="training-camera__canvas" />

          <span className="vchip vchip--mode">
            <span aria-hidden="true">{isSeated ? '🪑' : '🧍'}</span>
            <span>{isSeated ? '坐姿桌前' : '站姿全身'}</span>
            {!isLoaded && <span className="vchip__muted">· 載入中</span>}
          </span>

          {/* The angle readout sits on the feed, where the user's eyes already
              are. Only safe because this surface is dark — see tokens.css. */}
          {isStarted && !cameraError && (
            <AngleGauge
              currentAngle={liveState.elevation}
              isTargetZone={liveState.isTargetZone}
              phaseLabel={phaseLabel}
              hint={liveState.isTargetZone ? '很好，停在這裡' : undefined}
            />
          )}

          {isStarted && <FormAlertBanner flags={liveState.flags} />}

          {cameraError && (
            <div className="camera-error" role="alert">
              <span className="camera-error__title">相機權限未開啟</span>
              <span className="camera-error__body">{cameraError}</span>
            </div>
          )}
        </div>

        <div className="training-panel">
          {!isStarted ? (
            <div className="training-intro">
              <p className="training-intro__tag">{exercise.category}</p>
              <h2 className="training-intro__name">{exercise.nameZh}</h2>
              <p className="training-intro__body">{exercise.framingHintZh}</p>

              <div className="training-intro__steps">
                <span className="training-step">
                  <span className="training-step__n">1</span>
                  <span>以 {settings.concentricCadenceS} 秒緩慢平舉至 {settings.targetAngleDeg}°</span>
                </span>
                <span className="training-step">
                  <span className="training-step__n">2</span>
                  <span>維持停頓 {settings.holdDurationS} 秒</span>
                </span>
                <span className="training-step">
                  <span className="training-step__n">3</span>
                  <span>以 {settings.eccentricCadenceS} 秒緩慢控制下放</span>
                </span>
              </div>

              <button className="btn btn--primary btn--lg" onClick={handleStart}>
                開始這一組 · {settings.targetReps} 次
              </button>
            </div>
          ) : (
            <>
              <CadencePacer
                phase={liveState.phase}
                holdRemaining={liveState.holdRemaining}
                restRemaining={liveState.restRemaining}
                concentricElapsed={liveState.concentricElapsed}
                eccentricElapsed={liveState.eccentricElapsed}
                paceStatus={liveState.paceStatus}
                targetDuration={settings.holdDurationS}
              />

              <div className="training-progress">
                <div className="training-progress__head">
                  <span className="training-progress__count">
                    {completedReps.length}
                    <span className="training-progress__of"> / {settings.targetReps} 次</span>
                  </span>
                </div>
                <RepPips done={completedReps.length} total={settings.targetReps} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="training-rail">
        <div className="training-rail__state">
          <span className={`phase-chip phase-chip--${PHASE_CLASS[liveState.phase]}`}>
            {liveState.phase === 'RESTING' && liveState.restRemaining > 0
              ? `次間休息 ${liveState.restRemaining.toFixed(1)}s`
              : phaseLabel}
          </span>
        </div>

        <div className="training-rail__actions">
          {/* Leaving mid-set keeps the reps already done. Someone who stopped
              at rep 4 because their shoulder told them to made a correct
              decision, and it gets recorded as a session, not as nothing. */}
          <button className="btn btn--quiet" onClick={isStarted ? handleComplete : onCancel}>
            {isStarted ? '結束並記錄' : '返回'}
          </button>
          {isStarted && (
            <button className="btn btn--confirm" onClick={handleComplete}>
              完成這一組
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
