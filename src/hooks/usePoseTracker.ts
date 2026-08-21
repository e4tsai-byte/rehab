import { useCallback, useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { RehabLiveState, RehabRepRecord } from '../domain/rehabTypes'
import {
  ClientShoulderFlexionTracker,
  ClientSideLyingHoldTracker,
  type Landmark3D,
  type Posture,
} from '../pose/shoulderKinematics'

type TrackingModel = 'pacedElevation' | 'isometricHold'
type HoldTracker = ClientShoulderFlexionTracker | ClientSideLyingHoldTracker

export function usePoseTracker({
  posture = 'standing',
  trackingModel = 'pacedElevation',
  holdDurationS = 5.0,
  targetReps = 10,
  onRep,
  onPhaseChange,
}: {
  posture?: Posture
  trackingModel?: TrackingModel
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
  // The active tracker. Selected by trackingModel: the paced elevation machine or
  // the side-lying isometric-hold machine (§9 D2). Both expose the same
  // process(worldLandmarks, landmarks2D, timestampS) => { rep, live } contract and
  // the setHoldDuration / setTargetReps setters. Lazy-initialised with the correct
  // class so the very first detection frame already has the right machine.
  const trackerRef = useRef<HoldTracker | null>(null)
  function makeTracker(model: TrackingModel): HoldTracker {
    return model === 'isometricHold'
      ? new ClientSideLyingHoldTracker(targetReps, holdDurationS)
      : new ClientShoulderFlexionTracker(targetReps, posture, holdDurationS)
  }
  if (trackerRef.current === null) {
    trackerRef.current = makeTracker(trackingModel)
  }
  const animIdRef = useRef<number | null>(null)

  // Rebuild ONLY when the model itself changes (a genuinely different state
  // machine). A settings change (posture / hold / reps) must NOT reset the machine
  // — it flows through the setters below, exactly as the paced path did before.
  const prevModelRef = useRef<TrackingModel>(trackingModel)
  useEffect(() => {
    if (prevModelRef.current !== trackingModel) {
      prevModelRef.current = trackingModel
      trackerRef.current = makeTracker(trackingModel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingModel])

  useEffect(() => {
    const tr = trackerRef.current
    if (!tr) return
    // setPosture exists on the paced tracker only; the isometric tracker is
    // side-lying by construction and has no posture to set.
    if (tr instanceof ClientShoulderFlexionTracker) tr.setPosture(posture)
    tr.setHoldDuration(holdDurationS)
    tr.setTargetReps(targetReps)
  }, [posture, holdDurationS, targetReps])
  const prevPhaseRef = useRef<string>('RESTING')

  useEffect(() => {
    let active = true

    /* Local assets, not a CDN.
     *
     * These used to point at cdn.jsdelivr.net (pinned to @latest) and
     * storage.googleapis.com, which meant the app could not start without a
     * network and a rehab surface made remote requests on every load — both
     * forbidden by invariant 1, and both contradicted by the README.
     *
     * The wasm is copied out of node_modules by scripts/vendor-mediapipe.mjs on
     * postinstall/prebuild; the model is committed under public/models/.
     * BASE_URL keeps them resolving under a GitHub Pages subpath. */
    /* Resolved to absolute URLs against document.baseURI rather than left
       relative. `base: './'` makes BASE_URL the string './', and MediaPipe's
       FilesetResolver concatenates onto whatever it is given before fetching —
       so a relative prefix depends on how it happens to construct the request.
       Resolving here removes the ambiguity and still honours the deploy base. */
    const resolve = (p: string) => new URL(`${import.meta.env.BASE_URL}${p}`, document.baseURI).href
    const WASM_PATH = resolve('vendor/mediapipe/wasm')
    const MODEL_PATH = resolve('models/pose_landmarker_lite.task')

    async function createLandmarker(delegate: 'GPU' | 'CPU') {
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
    }

    async function initMediaPipe() {
      try {
        const landmarker = await createLandmarker('GPU')
        if (!active) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker
        setIsLoaded(true)
      } catch (err) {
        // Not "network slow" any more — the assets are local. A GPU failure here
        // is a WebGL/driver problem, so CPU is a real fallback rather than a retry.
        console.warn('GPU delegate unavailable, falling back to CPU', err)
        try {
          const landmarker = await createLandmarker('CPU')
          if (!active) {
            landmarker.close()
            return
          }
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

        const tracker = trackerRef.current
        if (!tracker) {
          animIdRef.current = requestAnimationFrame(runDetection)
          return
        }
        const { rep, live } = tracker.process(lms3d, lms2d, nowS)
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
