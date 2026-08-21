import { useEffect, useState } from 'react'
import { AngleGauge } from '../components/AngleGauge'
import { CadencePacer } from '../components/CadencePacer'
import { Digits } from '../components/Digits'
import { FormAlertBanner } from '../components/FormAlertBanner'
import { RailButton } from '../components/RailButton'
import { RepPips } from '../components/RepPips'
import type { RehabRepRecord } from '../domain/rehabTypes'
import { useChime } from '../hooks/useChime'
import { usePoseTracker } from '../hooks/usePoseTracker'

export function RehabTrial({
  onDone,
}: {
  onDone: (summary: { completedReps: number; reps: RehabRepRecord[] }) => void
}) {
  const { chime, armAudio } = useChime()
  const [completedReps, setCompletedReps] = useState<RehabRepRecord[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const { isLoaded, liveState, videoRef, canvasRef } = usePoseTracker({
    onRep: (rep) => {
      chime()
      setCompletedReps((prev) => [...prev, rep])
    },
    onPhaseChange: (oldPhase, newPhase) => {
      if (newPhase === 'HOLDING') {
        chime()
      } else if (newPhase === 'DESCENDING' && oldPhase === 'HOLDING') {
        chime()
      }
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
        {/* Left Half: Mirrored Video Feed with Real-time Skeleton Overlay */}
        <div className="field__view">
          <div
            className="selfview"
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0a0f1d',
              overflow: 'hidden',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="selfview__video"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />

            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
            />

            {!isLoaded && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  color: '#e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backdropFilter: 'blur(4px)',
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
                }}
              >
                <p style={{ fontSize: '18px', fontWeight: 600 }}>⚠️ 相機權限未開啟</p>
                <p style={{ marginTop: '8px', color: '#94a3b8' }}>{cameraError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Half: Live Goniometer & Cadence Coaching Engine */}
        <div className="field__stage">
          {!isStarted ? (
            <div className="cue">
              <p className="cue__title">右肩前舉復健訓練</p>
              <p className="cue__hint">
                目標：5 秒平舉至 90° $	o$ 停頓 5 秒 $	o$ 5 秒緩慢下放
              </p>
              <p className="cue__framing">
                請面向鏡頭站立，確保上半身與右手完整進入畫面中
              </p>
            </div>
          ) : (
            <div className="rehab-stage">
              <AngleGauge
                currentAngle={liveState.elevation}
                targetAngle={90}
                isTargetZone={liveState.isTargetZone}
              />

              <CadencePacer
                phase={liveState.phase}
                holdRemaining={liveState.holdRemaining}
                concentricElapsed={liveState.concentricElapsed}
                eccentricElapsed={liveState.eccentricElapsed}
              />

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
            {liveState.phase === 'HOLDING'
              ? '維持停頓中 (90°)'
              : liveState.phase === 'ASCENDING'
              ? '平舉抬起中'
              : liveState.phase === 'DESCENDING'
              ? '控制下放中'
              : '準備開始'}
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
