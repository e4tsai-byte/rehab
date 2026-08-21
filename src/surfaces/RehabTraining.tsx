import { useCallback, useEffect, useState } from 'react'
import { AngleGauge } from '../components/AngleGauge'
import { CadencePacer } from '../components/CadencePacer'
import { FormAlertBanner } from '../components/FormAlertBanner'
import { RepPips } from '../components/RepPips'
import { EXERCISE_CATALOG, localizeExercise } from '../domain/exerciseCatalog'
import { CONFIG } from '../pose/shoulderKinematics'
import type { CompletedSession, RehabPhase, RehabRepRecord, UserSettings } from '../domain/rehabTypes'
import { useChime } from '../hooks/useChime'
import { usePoseTracker } from '../hooks/usePoseTracker'
import { useT } from '../i18n/LocaleContext'

interface RehabTrainingProps {
  exerciseId: string
  settings: UserSettings
  onFinishSession: (session: CompletedSession) => void
  onCancel: () => void
}

const PHASE_LABEL_KEY = {
  RESTING: 'phase.resting',
  ASCENDING: 'phase.ascending',
  HOLDING: 'phase.holding',
  DESCENDING: 'phase.descending',
} as const

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
  const { t, locale } = useT()
  const { chime, armAudio } = useChime()
  const [completedReps, setCompletedReps] = useState<RehabRepRecord[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const exercise = EXERCISE_CATALOG.find((e) => e.id === exerciseId) ?? EXERCISE_CATALOG[0]!
  const ex = localizeExercise(exercise, locale)
  const isSeated = exercise.posture === 'seated'
  const isIsometric = exercise.trackingModel === 'isometricHold'

  // Dose scoping (§9 D4). The isometric hold is a FIXED prescription read from the
  // exercise itself (5 holds × 20s); the global Settings sliders (target angle /
  // hold / reps) do NOT apply to it. The paced exercises keep reading the settings
  // sliders exactly as before, so their behavior is byte-identical.
  const doseReps = isIsometric ? exercise.targetReps : settings.targetReps
  const doseHoldS = isIsometric ? exercise.holdDurationS : settings.holdDurationS

  const { isLoaded, liveState, videoRef, canvasRef } = usePoseTracker({
    posture: exercise.posture,
    trackingModel: exercise.trackingModel,
    // For the isometric hold these are the fixed prescription; for paced exercises
    // they are the user's Settings sliders (unchanged from before).
    holdDurationS: doseHoldS,
    targetReps: doseReps,
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
        setCameraError(t('camera.errorPermission'))
      }
    }

    void startCamera()

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [videoRef, t])

  const handleComplete = useCallback(() => {
    const cleanCount = completedReps.filter((r) => r.isClean).length
    const qualityScore =
      completedReps.length > 0 ? Math.round((cleanCount / completedReps.length) * 100) : 100
    const totalHold = completedReps.reduce((acc, r) => acc + r.holdDuration, 0)
    const avgHold =
      completedReps.length > 0 ? totalHold / completedReps.length : doseHoldS
    const peakDeg = completedReps.reduce((max, r) => Math.max(max, r.peakElevation), 0)

    onFinishSession({
      id: `session-${Date.now()}`,
      exerciseId: exercise.id,
      // History stores the Chinese name; display resolves the current locale's
      // name from the catalog by id (see resolveExerciseName). Schema unchanged.
      exerciseNameZh: exercise.nameZh,
      timestamp: Date.now(),
      completedReps: completedReps.length,
      targetReps: doseReps,
      cleanRepsCount: cleanCount,
      formQualityScorePct: qualityScore,
      averageHoldDurationS: Math.round(avgHold * 10) / 10,
      peakElevationDeg: peakDeg,
      reps: completedReps,
    })
  }, [completedReps, exercise, settings, doseReps, doseHoldS, onFinishSession])

  useEffect(() => {
    if (isStarted && completedReps.length >= doseReps) handleComplete()
  }, [completedReps.length, doseReps, isStarted, handleComplete])

  function handleStart() {
    armAudio()
    setIsStarted(true)
  }

  const phaseLabel = t(PHASE_LABEL_KEY[liveState.phase])

  return (
    <div className="training-surface">
      <div className="training-body">
        <div className="training-camera">
          <video ref={videoRef} autoPlay playsInline muted className="training-camera__video" />
          <canvas ref={canvasRef} className="training-camera__canvas" />

          <span className="vchip vchip--mode">
            <span aria-hidden="true">{isSeated ? '🪑' : '🧍'}</span>
            <span>{isSeated ? t('posture.seatedDesk') : t('posture.standingFull')}</span>
            {!isLoaded && <span className="vchip__muted">· {t('train.loading')}</span>}
          </span>

          {/* The angle readout sits on the feed, where the user's eyes already
              are. Only safe because this surface is dark — see tokens.css. */}
          {isStarted && !cameraError && (
            <AngleGauge
              currentAngle={liveState.elevation}
              isTargetZone={liveState.isTargetZone}
              phaseLabel={phaseLabel}
              hint={liveState.isTargetZone ? t('gauge.holdHere') : undefined}
              // The isometric hold lives at a low 10–15° band. On the paced 0–90°
              // dial a correct 12° hold would read as near-failure, so the gauge
              // switches to a 0–30° scale with the green band centred on 12°. Paced
              // exercises pass nothing and keep the default 0–120° / accepted-band
              // rendering byte-identical.
              {...(isIsometric
                ? {
                    maxAngle: 30,
                    bandMinDeg: CONFIG.HOLD_GOOD_BAND_MIN_DEG,
                    bandMaxDeg: CONFIG.HOLD_GOOD_BAND_MAX_DEG,
                    targetDeg: CONFIG.HOLD_TARGET_ANGLE_DEG,
                  }
                : {})}
            />
          )}

          {isStarted && <FormAlertBanner flags={liveState.flags} />}

          {cameraError && (
            <div className="camera-error" role="alert">
              <span className="camera-error__title">{t('camera.errorTitle')}</span>
              <span className="camera-error__body">{cameraError}</span>
            </div>
          )}
        </div>

        <div className="training-panel">
          {!isStarted ? (
            <div className="training-intro">
              <p className="training-intro__tag">{ex.category}</p>
              <h2 className="training-intro__name">{ex.name}</h2>
              <p className="training-intro__body">{ex.framingHint}</p>

              {/* The three numbered steps describe the paced 5-second raise / hold /
                  lower tempo. That tempo does not exist for the isometric hold, so
                  showing them would misdescribe the movement — the isometric user is
                  guided by the framing hint and description above instead. (Isometric
                  step copy is a copywriter concern; not invented here.) */}
              {!isIsometric && (
                <div className="training-intro__steps">
                  <span className="training-step">
                    <span className="training-step__n">1</span>
                    <span>{t('train.step1', { cadence: settings.concentricCadenceS, angle: settings.targetAngleDeg })}</span>
                  </span>
                  <span className="training-step">
                    <span className="training-step__n">2</span>
                    <span>{t('train.step2', { hold: settings.holdDurationS })}</span>
                  </span>
                  <span className="training-step">
                    <span className="training-step__n">3</span>
                    <span>{t('train.step3', { cadence: settings.eccentricCadenceS })}</span>
                  </span>
                </div>
              )}

              <button className="btn btn--primary btn--lg" onClick={handleStart}>
                {t('train.startSet', { reps: doseReps })}
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
                targetDuration={doseHoldS}
              />

              <div className="training-progress">
                <div className="training-progress__head">
                  <span className="training-progress__count">
                    {completedReps.length}
                    <span className="training-progress__of"> {t('train.repsOf', { total: doseReps })}</span>
                  </span>
                </div>
                <RepPips done={completedReps.length} total={doseReps} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="training-rail">
        <div className="training-rail__state">
          <span className={`phase-chip phase-chip--${PHASE_CLASS[liveState.phase]}`}>
            {liveState.phase === 'RESTING' && liveState.restRemaining > 0
              ? t('train.restBetween', { s: liveState.restRemaining.toFixed(1) })
              : phaseLabel}
          </span>
        </div>

        <div className="training-rail__actions">
          {/* Leaving mid-set keeps the reps already done. Someone who stopped
              at rep 4 because their shoulder told them to made a correct
              decision, and it gets recorded as a session, not as nothing. */}
          <button className="btn btn--quiet" onClick={isStarted ? handleComplete : onCancel}>
            {isStarted ? t('train.finishRecord') : t('train.back')}
          </button>
          {isStarted && (
            <button className="btn btn--confirm" onClick={handleComplete}>
              {t('train.completeSet')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
