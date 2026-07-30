/* ─────────────────────────────────────────────────────────────────────────────
   Outcome and tracking → display triad.

   INVARIANT 4 — colour never carries meaning alone. Every state that appears on
   screen returns a WORD and a SHAPE here, and `tone` is optional. A surface that
   renders `tone` without `word` and `shape` is a bug.

   Shapes are SVG kinds, not characters: Noto Sans TC does not cover the geometric
   glyphs this needs, and a missing-glyph box is not a shape.

   Tracking shapes (circles / square) are deliberately disjoint from outcome
   shapes (bars / triangle / diamond) so a facilitator never confuses "the machine
   is fine" with "the person finished".
   ───────────────────────────────────────────────────────────────────────────── */

import type { ShapeKind } from '../components/Shape'
import { strings } from '../i18n/strings'
import type { Outcome, TrackingState } from './types'

/** `neutral` means no colour at all, which is the default and the common case. */
export type Tone = 'neutral' | 'accent' | 'alert'

export interface Display {
  readonly word: string
  readonly shape: ShapeKind
  readonly tone: Tone
}

export function trackingDisplay(s: TrackingState): Display {
  switch (s) {
    case 'live':
      return { word: strings.tracking.live, shape: 'circle-filled', tone: 'accent' }
    case 'idle':
      return { word: strings.tracking.idle, shape: 'circle-hollow', tone: 'neutral' }
    case 'lost':
      return { word: strings.tracking.lost, shape: 'square-filled', tone: 'alert' }
  }
}

/**
 * Outcome display.
 *
 * `hand_contact` is `neutral`, not `alert`, and that is load-bearing.
 * PRODUCT.md: "Failure states are not failures." A participant who used their
 * hands did not malfunction, and a red row would tell them they did. Only the
 * machine failing (`void`) earns an alarm hue.
 */
export function outcomeDisplay(o: Outcome): Display {
  switch (o.kind) {
    case 'complete':
      return { word: strings.status.complete, shape: 'bar-filled', tone: 'neutral' }
    case 'incomplete':
      return { word: strings.status.incomplete, shape: 'bar-hollow', tone: 'neutral' }
    case 'hand_contact':
      return { word: strings.status.handContact, shape: 'triangle', tone: 'neutral' }
    case 'unable':
      return { word: strings.status.unable, shape: 'diamond', tone: 'neutral' }
    case 'aborted':
      return { word: strings.status.aborted, shape: 'slash-circle', tone: 'neutral' }
    case 'void':
      return { word: strings.status.voided, shape: 'square-filled', tone: 'alert' }
  }
}

export const awaitingDisplay: Display = {
  word: strings.status.awaiting,
  shape: 'circle-hollow',
  tone: 'neutral',
}
