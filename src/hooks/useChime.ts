/* A single non-speech chime on rep detection. No TTS anywhere in Tier 1: all
   instruction is visual and staff-delivered.

   The AudioContext is created on the staff's 開始 press, which is the user
   gesture browsers require, so it never needs an autoplay workaround.

   Short, soft, and one note. A chime that sounds like a game point would put
   this in the consumer-fitness register the anti-references rule out. */

import { useCallback, useEffect, useRef } from 'react'

export function useChime() {
  const ctxRef = useRef<AudioContext | null>(null)

  const ensure = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctxRef.current = new Ctor()
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const chime = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || ctx.state !== 'running') return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.value = 740 // F#5. Audible over room noise, not shrill.

    // Fast attack, short exponential decay. ~180ms total.
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)

    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.2)
  }, [])

  useEffect(() => {
    return () => {
      void ctxRef.current?.close()
      ctxRef.current = null
    }
  }, [])

  return { chime, armAudio: ensure }
}
