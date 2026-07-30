/* ─────────────────────────────────────────────────────────────────────────────
   Digits — the numeral primitive. Every number on screen goes through it.

   Belt two of two on tabular figures. `font-variant-numeric: tabular-nums` is
   applied globally in base.css, but it depends on the loaded face actually
   shipping `tnum`. This renders each character in a fixed 1ch cell, which is
   font-independent and survives a fallback face. On an instrument, a digit that
   changes width as its value changes is disqualifying.
   ───────────────────────────────────────────────────────────────────────────── */

const SEPARATORS = new Set(['.', ':', ',', '−', '-', '+', '±', '/'])

export function Digits({
  value,
  className,
  'aria-hidden': ariaHidden,
}: {
  value: string | number
  className?: string
  'aria-hidden'?: boolean
}) {
  const text = String(value)
  return (
    <span
      className={className ? `digits ${className}` : 'digits'}
      {...(ariaHidden ? { 'aria-hidden': true } : {})}
    >
      {/* The plain string is what a screen reader announces; the cells are
          presentational so it never reads out character by character. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" style={{ display: 'inline-flex' }}>
        {[...text].map((ch, i) => (
          <span
            key={`${i}-${ch}`}
            className={SEPARATORS.has(ch) ? 'digits__cell digits__cell--sep' : 'digits__cell'}
          >
            {ch}
          </span>
        ))}
      </span>
    </span>
  )
}
