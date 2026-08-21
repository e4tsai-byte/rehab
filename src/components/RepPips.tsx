/* One slot per prescribed rep. Shape-first: a filled pip differs from a hollow
   one by fill AND by a visible ring, so it reads without colour and at 3 m.

   This is also the user's feedback channel if they cannot hear the chime, which
   is why the fill is the one animation in the camera region.

   `total` comes from the user's settings (UserSettings.targetReps), not from a
   constant — it used to import velocare's PRESCRIBED_REPS = 5, which was the
   sit-to-stand protocol's fixed rep count and never applied to this product. */

export function RepPips({ done, total }: { done: number; total: number }) {
  return (
    <div className="pips" role="presentation">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < done ? 'pip pip--on' : 'pip'} />
      ))}
    </div>
  )
}
