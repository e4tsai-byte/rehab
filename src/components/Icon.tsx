/* ─────────────────────────────────────────────────────────────────────────────
   Icons — WAYFINDING AND ACTIONS ONLY.

   Distinct from `Shape.tsx`, and the split is the policy, not an accident:

     Shape  answers "what STATE is this in"  — outcome and tracking marks.
     Icon   answers "what is this PLACE"     — surfaces in the header,
            and "what will this DO"          — the verb on a control.

   Nothing here exists to set a mood. No celebration marks, no encouragement
   glyphs, no mascots, no progress ornaments. PRODUCT.md's anti-references rule
   out anything that reads as a consumer fitness app, and an icon added to make
   a screen feel friendlier is exactly that. If an icon does not answer one of
   the two questions above, it does not get added.

   SVG, NOT FONT GLYPHS. Noto Sans TC has no coverage for arrows, cameras or
   document marks, and an uncovered codepoint renders as a tofu box — which is
   worse than no icon, because the user cannot tell it is missing rather than
   broken. Same argument as `Digits` and `Shape`: if legibility depends on font
   coverage, it is not guaranteed.

   `currentColor` throughout, so an icon inherits the contrast of the text it
   sits beside and cannot drift below the floor independently.
   ───────────────────────────────────────────────────────────────────────────── */

export type IconKind =
  /* Places */
  | 'roster' /* the class list                    */
  | 'sheet' /* the printed report                */
  | 'trial' /* a measurement in progress         */
  | 'record' /* one participant's stored result   */
  /* Actions */
  | 'back' /* return to the previous surface    */
  | 'start' /* begin a measurement              */
  | 'print'
  | 'camera'
  | 'camera-off'
  | 'phase-swap' /* switch between pre and post test */

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function Icon({ kind, className }: { kind: IconKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className ? `icon ${className}` : 'icon'}
      aria-hidden="true"
      focusable="false"
    >
      {/* Three stacked entries. Reads as a list of people, not as a hamburger:
          the leading dots are what distinguish it from a menu control. */}
      {kind === 'roster' && (
        <g {...S}>
          <circle cx="4" cy="5.5" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="4" cy="10" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="4" cy="14.5" r="1.15" fill="currentColor" stroke="none" />
          <path d="M8 5.5h8M8 10h8M8 14.5h8" />
        </g>
      )}

      {/* A sheet of paper with a folded corner and ruled lines. */}
      {kind === 'sheet' && (
        <g {...S}>
          <path d="M4.5 2.5h7l4 4v11h-11z" />
          <path d="M11.5 2.5v4h4" />
          <path d="M7 11h6M7 14h4" />
        </g>
      )}

      {/* A person mid-rise from a seat: the exercise itself. */}
      {kind === 'trial' && (
        <g {...S}>
          <circle cx="10" cy="4.25" r="2" />
          <path d="M10 6.5v5" />
          <path d="M7 9h6" />
          <path d="M10 11.5l-2.5 2v4M10 11.5l2.5 2v4" />
        </g>
      )}

      {/* A sheet with a check: one stored, settled result. */}
      {kind === 'record' && (
        <g {...S}>
          <path d="M4.5 2.5h11v15h-11z" />
          <path d="M7.25 10l2 2 3.5-3.5" />
        </g>
      )}

      {kind === 'back' && (
        <g {...S}>
          <path d="M16 10H4.5" />
          <path d="M9 4.5L3.5 10 9 15.5" />
        </g>
      )}

      {/* Outlined triangle, not a filled media-player button: this starts a
          measurement of a person, and a solid play glyph reads as video. */}
      {kind === 'start' && (
        <g {...S}>
          <circle cx="10" cy="10" r="7.25" />
          <path d="M8.25 6.75l5 3.25-5 3.25z" />
        </g>
      )}

      {kind === 'print' && (
        <g {...S}>
          <path d="M6 7.5V2.75h8V7.5" />
          <path d="M6 14.5H3.5v-7h13v7H14" />
          <path d="M6 11.5h8v5.75H6z" />
        </g>
      )}

      {kind === 'camera' && (
        <g {...S}>
          <path d="M2.75 6.5h9.5v7h-9.5z" />
          <path d="M12.25 10l5-2.75v5.5L12.25 10z" />
        </g>
      )}

      {kind === 'camera-off' && (
        <g {...S}>
          <path d="M2.75 6.5h9.5v7h-9.5z" />
          <path d="M12.25 10l5-2.75v5.5L12.25 10z" />
          <path d="M3.5 16.5l13-13" />
        </g>
      )}

      {/* Two arrows reversing: pre becomes post and back again. */}
      {kind === 'phase-swap' && (
        <g {...S}>
          <path d="M3.5 7.5h13l-3-3" />
          <path d="M16.5 12.5h-13l3 3" />
        </g>
      )}
    </svg>
  )
}
