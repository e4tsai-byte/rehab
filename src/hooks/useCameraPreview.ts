/* ─────────────────────────────────────────────────────────────────────────────
   Framing preview — camera acquisition and liveness.

   INVARIANT 1: NO IMAGE DATA IS EVER PERSISTED, AND NONE IS EVER READ.

   This module obtains a MediaStream and hands it to a <video> element. That is
   the entire contract. Deliberately absent, and none of it may be added here:

     - no <canvas>, no drawImage, no getImageData, no createImageBitmap
     - no ImageCapture, no MediaRecorder, no grabFrame, no takePhoto
     - no pose estimation, no landmark extraction, no MediaPipe
     - no frame buffer, no upload, no storage of any kind

   Liveness is derived from two sources, neither of which is image data:

     1. MediaStreamTrack events — `ended`, `mute`, `unmute` — plus `readyState`.
     2. `requestVideoFrameCallback` METADATA. That callback reports how many
        frames have been presented and when; it does not expose pixels. It is
        used only to notice a stream that has silently stalled without firing
        `mute`, which is the common failure mode of a loose USB camera.

   The stream is stopped on `stop()` and on unmount, so the camera indicator
   light goes out when the preview is collapsed. Nothing outlives the hook.

   Nothing here gates the demo. Every failure path resolves to a status the UI
   renders as ordinary text, and the fixture-driven flow is untouched.
   ───────────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus =
  /** Default. No permission has been requested and no prompt has been shown. */
  | 'off'
  /** Browser exposes no getUserMedia at all. */
  | 'unsupported'
  /** Not a secure context, so the API is unavailable regardless of permission. */
  | 'insecure'
  | 'starting'
  | 'live'
  | 'denied'
  | 'notfound'
  | 'error'

/**
 * Camera SIGNAL, not tracking confidence.
 *
 * There is no pose estimation in this build, so a "tracking confidence" number
 * would be fabricated. This reports only whether the camera is still delivering
 * frames, which is a real property of the stream and is what actually predicts
 * the void this preview exists to prevent.
 */
export type CameraSignal = 'live' | 'stalled' | 'ended'

/** Frames must arrive at least this often, or the stream counts as stalled. */
const STALL_MS = 1500

/* `requestVideoFrameCallback` is in the DOM lib but is not implemented
   everywhere, so it is probed at runtime rather than assumed. */
type MaybeRvfc = Partial<
  Pick<HTMLVideoElement, 'requestVideoFrameCallback' | 'cancelVideoFrameCallback'>
>

export function useCameraPreview() {
  const [status, setStatus] = useState<CameraStatus>('off')
  const [signal, setSignal] = useState<CameraSignal>('ended')

  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rvfcRef = useRef<number | null>(null)
  const lastFrameAtRef = useRef<number>(0)

  /* Torn down by both `stop()` and unmount. Kept in a ref so the cleanup path
     never depends on render order. */
  const teardown = useCallback(() => {
    const v: (HTMLVideoElement & MaybeRvfc) | null = videoRef.current
    if (v && rvfcRef.current !== null && v.cancelVideoFrameCallback) {
      v.cancelVideoFrameCallback(rvfcRef.current)
    }
    rvfcRef.current = null

    if (v) v.srcObject = null

    const s = streamRef.current
    if (s) for (const t of s.getTracks()) t.stop()
    streamRef.current = null
  }, [])

  const stop = useCallback(() => {
    teardown()
    setSignal('ended')
    setStatus('off')
  }, [teardown])

  const start = useCallback(async () => {
    if (!window.isSecureContext) {
      setStatus('insecure')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }

    setStatus('starting')
    try {
      /* `audio: false` is explicit and not a default worth relying on: this
         product has no reason to ever touch a microphone. */
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })

      streamRef.current = stream

      const [track] = stream.getVideoTracks()
      if (track) {
        track.addEventListener('ended', () => setSignal('ended'))
        track.addEventListener('mute', () => setSignal('stalled'))
        track.addEventListener('unmute', () => setSignal('live'))
      }

      const v = videoRef.current
      if (v) {
        v.srcObject = stream
        /* Autoplay for a muted, playsInline preview. A rejected play() is not
           fatal — the element simply shows the first frame — so it is swallowed
           rather than surfaced as an error the facilitator cannot act on. */
        void v.play().catch(() => {})
      }

      lastFrameAtRef.current = performance.now()
      setSignal('live')
      setStatus('live')
    } catch (err) {
      teardown()
      setSignal('ended')
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') setStatus('denied')
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setStatus('notfound')
      else setStatus('error')
    }
  }, [teardown])

  /* Frame-arrival watchdog. Metadata only — the callback body reads no pixels
     and touches no canvas; it records a timestamp and reschedules itself. */
  useEffect(() => {
    if (status !== 'live') return
    const v: (HTMLVideoElement & MaybeRvfc) | null = videoRef.current
    const request = v?.requestVideoFrameCallback
    if (!v || !request) return

    let cancelled = false

    const onFrame = () => {
      if (cancelled) return
      lastFrameAtRef.current = performance.now()
      rvfcRef.current = request.call(v, onFrame)
    }
    rvfcRef.current = request.call(v, onFrame)

    const watchdog = window.setInterval(() => {
      const track = streamRef.current?.getVideoTracks()[0]
      if (!track || track.readyState === 'ended') {
        setSignal('ended')
        return
      }
      const stale = performance.now() - lastFrameAtRef.current > STALL_MS
      setSignal(stale || track.muted ? 'stalled' : 'live')
    }, 500)

    return () => {
      cancelled = true
      window.clearInterval(watchdog)
      if (rvfcRef.current !== null && v.cancelVideoFrameCallback) {
        v.cancelVideoFrameCallback(rvfcRef.current)
      }
      rvfcRef.current = null
    }
  }, [status])

  /* The preview panel unmounts when the trial starts, taking the <video> with
     it, but the stream stays open so the rail can keep reporting signal. Track
     state alone carries it from here — no element, so no frame callback. */
  useEffect(() => {
    if (status !== 'live') return
    const poll = window.setInterval(() => {
      const track = streamRef.current?.getVideoTracks()[0]
      if (!track || track.readyState === 'ended') setSignal('ended')
      else if (track.muted) setSignal('stalled')
    }, 1000)
    return () => window.clearInterval(poll)
  }, [status])

  useEffect(() => teardown, [teardown])

  /** Re-binds the stream after the <video> remounts (cue → trial → cue). */
  const attach = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current
      void el.play().catch(() => {})
    }
  }, [])

  return { status, signal, attach, start, stop }
}
