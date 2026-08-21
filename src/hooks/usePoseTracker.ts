import { useCallback, useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { RehabLiveState, RehabRepRecord } from '../domain/rehabTypes'
import { ClientShoulderFlexionTracker, type Landmark3D } from '../pose/shoulderKinematics'

export function usePoseTracker({
  isSeated = false,
  holdDurationS = 5.0,
  targetReps = 10,
  onRep,
  onPhaseChange,
}: {
  isSeated?: boolean
  holdDurationS?: number
  targetReps?: number
  onRep?: (rep: RehabRepRecord) => void
  onPhaseChange?: (oldPhase: string, newPhase: string) => void
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [liveState, setLiveState] = useState<RehabLiveState>({
    elevation: 0,
    phase: 'RESTING',
    holdRemaining: 5.0,
    restRemaining: 0,
    concentricElapsed: 0,
    eccentricElapsed: 0,
    paceStatus: 'IDLE',
    expectedAngle: 0,
    isTargetZone: false,
    flags: [],
    repsCompleted: 0,
    targetReps: 10,
  })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const trackerRef = useRef<ClientShoulderFlexionTracker>(new ClientShoulderFlexionTracker(10))
  const animIdRef = useRef<number | null>(null)
  useEffect(() => {
    trackerRef.current.setSeatedMode(isSeated)
    trackerRef.current.setHoldDuration(holdDurationS)
    trackerRef.current.setTargetReps(targetReps)
  }, [isSeated, holdDurationS, targetReps])
  const prevPhaseRef = useRef<string>('RESTING')

  useEffect(() => {
    let active = true

    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        if (!active) return

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        if (!active) return
        landmarkerRef.current = landmarker
        setIsLoaded(true)
      } catch (err) {
        console.warn('GPU delegate failed or network slow, falling back to CPU delegate', err)
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          )
          const landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          })
          if (!active) return
          landmarkerRef.current = landmarker
          setIsLoaded(true)
        } catch (cpuErr) {
          console.error('Failed to load MediaPipe PoseLandmarker', cpuErr)
        }
      }
    }

    void initMediaPipe()
    return () => {
      active = false
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
      landmarkerRef.current?.close()
    }
  }, [])

  const runDetection = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const landmarker = landmarkerRef.current

    if (video && canvas && landmarker && video.readyState >= 2) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      const ctx = canvas.getContext('2d')
      const nowS = performance.now() / 1000
      const results = landmarker.detectForVideo(video, performance.now())

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }

      if (results && results.landmarks && results.landmarks[0]) {
        const lms2d = results.landmarks[0] as Landmark3D[]
        const lms3d = (results.worldLandmarks?.[0] as Landmark3D[]) || lms2d

        if (ctx) {
          drawSkeleton(ctx, lms2d, canvas.width, canvas.height)
        }

        const { rep, live } = trackerRef.current.process(lms3d, lms2d, nowS)
        setLiveState(live)

        if (prevPhaseRef.current !== live.phase) {
          onPhaseChange?.(prevPhaseRef.current, live.phase)
          prevPhaseRef.current = live.phase
        }

        if (rep) {
          onRep?.(rep)
        }
      }
    }

    animIdRef.current = requestAnimationFrame(runDetection)
  }, [onRep, onPhaseChange])

  useEffect(() => {
    if (isLoaded) {
      animIdRef.current = requestAnimationFrame(runDetection)
    }
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
    }
  }, [isLoaded, runDetection])

  return {
    isLoaded,
    liveState,
    videoRef,
    canvasRef,
  }
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark3D[],
  w: number,
  h: number
) {
  const connections: [number, number][] = [
    [11, 12],
    [11, 23],
    [12, 24],
    [23, 24],
    [11, 13], [13, 15],
    [12, 14], [14, 16],
  ]

  ctx.save()
  // NOTE: The <canvas> element is already mirrored via CSS (transform: scaleX(-1))
  // along with the <video>. Therefore, we do NOT flip the canvas context again here.

  for (const [i, j] of connections) {
    const p1 = landmarks[i]
    const p2 = landmarks[j]
    if (!p1 || !p2 || (p1.visibility ?? 1) < 0.3 || (p2.visibility ?? 1) < 0.3) continue

    const isRightArm = (i === 12 && j === 14) || (i === 14 && j === 16)
    ctx.beginPath()
    ctx.moveTo(p1.x * w, p1.y * h)
    ctx.lineTo(p2.x * w, p2.y * h)
    ctx.lineWidth = isRightArm ? 6 : 3
    ctx.strokeStyle = isRightArm ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)'
    ctx.stroke()
  }

  for (let i = 0; i < landmarks.length; i++) {
    if (i !== 11 && i !== 12 && i !== 13 && i !== 14 && i !== 15 && i !== 16 && i !== 23 && i !== 24) {
      continue
    }
    const p = landmarks[i]
    if (!p || (p.visibility ?? 1) < 0.3) continue

    const isRightArm = i === 12 || i === 14 || i === 16
    ctx.beginPath()
    ctx.arc(p.x * w, p.y * h, isRightArm ? 7 : 4, 0, 2 * Math.PI)
    ctx.fillStyle = isRightArm ? '#0284c7' : '#94a3b8'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
  }

  ctx.restore()
}
