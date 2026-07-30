/* Colour + word + shape, always together. There is no variant of this component
   that renders colour alone, which is how invariant 4 is enforced structurally
   rather than by review. */

import type { Display } from '../domain/display'
import { Shape } from './Shape'

export function StateChip({
  display,
  size = 'rail',
}: {
  display: Display
  size?: 'rail' | 'row' | 'lead'
}) {
  return (
    <span className={`chip chip--${size} chip--${display.tone}`}>
      <Shape kind={display.shape} />
      <span className="chip__word">{display.word}</span>
    </span>
  )
}
