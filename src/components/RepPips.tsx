/* Five slots. Shape-first: a filled pip differs from a hollow one by fill AND by
   a visible ring, so it reads without colour and at 3 m.

   This is also the participant's feedback channel if they cannot hear the chime,
   which is why the fill is the one animation in the participant field. */

import { PRESCRIBED_REPS } from '../domain/types'

export function RepPips({ done, total = PRESCRIBED_REPS }: { done: number; total?: number }) {
  return (
    <div className="pips" role="presentation">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < done ? 'pip pip--on' : 'pip'} />
      ))}
    </div>
  )
}
