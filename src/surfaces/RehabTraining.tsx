import { useEffect, useState } from 'react'
import { AngleGauge } from '../components/AngleGauge'
import { CadencePacer } from '../components/CadencePacer'
import { Digits } from '../components/Digits'
import { FormAlertBanner } from '../components/FormAlertBanner'
import { RepPips } from '../components/RepPips'
import type { CompletedSession, RehabRepRecord, UserSettings } from '../domain/rehabTypes'
import { useChime } from '../hooks/useChime'
import { usePoseTracker } from '../hooks/usePoseTracker'

interface RehabTrainingProps {
  settings: UserSettings
  onFinishSession: (session: CompletedSession) => void
  onCancel: () => void
}

export function RehabTraining({ settings, onFinishSession, onCancel }: RehabTrainingProps) {
  const { chime, armAudio } = useChime()
  const [completedReps, setCompletedReps] = useState<RehabRepRecord[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const { isLoaded, liveState, videoRef, canvasRef } = usePoseTracker({
    onRep: (rep) => {
      if (settings.soundEnabled) chime()
      setCompletedReps((prev) => [...prev, rep])
    },
    onPhaseChange: (oldPhase, newPhase) => {
      if (!settings.soundEnabled) return
      if (newPhase === 'HOLDING') {
        chime() // Reached target zone
      } else if (newPhase === 'DESCENDING' && oldPhase === 'HOLDING') {
        chime() // 5s hold completed
      }
    },
  })

  // Start browser camera stream
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
      } catch (err) {
        console.error('Camera access error:', err)
        setCameraError('請在瀏覽器網址列允許相機存取權限')
      }
    }

    void startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoRef])

  // Auto-finish set when target reps reached
  useEffect(() => {
    if (completedReps.length >= settings.targetReps && isStarted) {
      handleComplete()
    }
  }, [completedReps.length, settings.targetReps, isStarted])

  function handleStart() {
    armAudio()
    setIsStarted(true)
  }

  function handleComplete() {
    const cleanCount = completedReps.filter((r) => r.isClean).length
    const qualityScore =
      completedReps.length > 0 ? Math.round((cleanCount / completedReps.length) * 100) : 100

    const totalHold = completedReps.reduce((acc, r) => acc + r.holdDuration, 0)
    const avgHold = completedReps.length > 0 ? totalHold / completedReps.length : settings.holdDurationS

    const peakDeg = completedReps.reduce((max, r) => Math.max(max, r.peakElevation), 90)

    const session: CompletedSession = {
      id: `session-${Date.now()}`,
      exerciseId: 'right-arm-forward-flexion',
      exerciseNameZh: '站姿右手前舉復健訓練',
      timestamp: Date.now(),
      completedReps: completedReps.length,
      targetReps: settings.targetReps,
      cleanRepsCount: cleanCount,
      formQualityScorePct: qualityScore,
      averageHoldDurationS: Math.round(avgHold * 10) / 10,
      peakElevationDeg: peakDeg,
      reps: completedReps,
    }

    onFinishSession(session)
  }

  return (
    <div className="training-surface">
      <div className="training-body">
        {/* Left Half: 60 FPS Mirrored Camera + Glowing Turquoise Skeleton */}
        <div className="training-camera">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="training-camera__video"
          />

          <canvas ref={canvasRef} className="training-camera__canvas" />

          {!isLoaded && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(0, 0, 0, 0.75)',
                color: '#e2e8f0',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--rehab-border)',
              }}
            >
              <span>⚡ AI 姿勢偵測引擎載入中...</span>
            </div>
          )}

          {cameraError && (
            <div
              style={{
                position: 'absolute',
                color: '#fff',
                textAlign: 'center',
                padding: '24px',
                background: 'rgba(0,0,0,0.85)',
                borderRadius: '12px',
                border: '1px solid #ef4444',
              }}
            >
              <p style={{ fontSize: '18px', fontWeight: 600 }}>⚠️ 相機權限未開啟</p>
              <p style={{ marginTop: '8px', color: '#94a3b8' }}>{cameraError}</p>
            </div>
          )}
        </div>

        {/* Right Half: Live Coaching Goniometer & Pacer */}
        <div className="training-panel">
          {!isStarted ? (
            <div style={{ textAlign: 'center', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '28px', color: '#fff', margin: 0 }}>準備開始訓練</h2>
              <p style={{ fontSize: '15px', color: 'var(--rehab-text-muted)', lineHeight: '1.6', margin: 0 }}>
                請面向鏡頭站立，確保上半身完整進入鏡頭畫面。<br />
                平舉右手至 90° $	o$ 停頓 {settings.holdDurationS} 秒 $	o$ 緩慢下放。
              </p>
              <button
                onClick={handleStart}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#fff',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px var(--rehab-cyan-glow)',
                  marginTop: '16px',
                }}
              >
                開始第一組 (10 次)
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Angle Goniometer */}
              <AngleGauge
                currentAngle={liveState.elevation}
                targetAngle={settings.targetAngleDeg}
                isTargetZone={liveState.isTargetZone}
              />

              {/* 5s - 5s - 5s Cadence & Hold Pacer */}
              <CadencePacer
                phase={liveState.phase}
                holdRemaining={liveState.holdRemaining}
                concentricElapsed={liveState.concentricElapsed}
                eccentricElapsed={liveState.eccentricElapsed}
                targetDuration={settings.holdDurationS}
              />

              {/* Real-time Compensation Alerts */}
              <FormAlertBanner flags={liveState.flags} />
            </div>
          )}
        </div>
      </div>

      {/* Persistent Bottom Action Rail */}
      <div className="training-rail">
        <div className="training-rail__state">
          <div className="rep-counter-pill">
            第 <Digits value={completedReps.length} /> / {settings.targetReps} 次
          </div>

          <div
            className={`phase-pill phase-pill--${
              liveState.phase === 'HOLDING'
                ? 'holding'
                : liveState.phase === 'ASCENDING'
                ? 'ascending'
                : liveState.phase === 'DESCENDING'
                ? 'descending'
                : 'resting'
            }`}
          >
            {liveState.phase === 'HOLDING'
              ? '維持水平停頓中'
              : liveState.phase === 'ASCENDING'
              ? '平舉抬起中'
              : liveState.phase === 'DESCENDING'
              ? '控制下放中'
              : '就緒待命'}
          </div>

          <RepPips done={completedReps.length} total={settings.targetReps} />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--rehab-border)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            結束返回
          </button>

          {isStarted && (
            <button
              onClick={handleComplete}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              結算此組
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
