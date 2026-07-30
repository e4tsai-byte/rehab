/* ─────────────────────────────────────────────────────────────────────────────
   The header — navigation, and the answer to "where am I".

   STRUCTURE: HUB AND SPOKE, NOT A NAV BAR.

   This product is a workflow, not a website, and a row of top-level tabs would
   misdescribe it. There are four surfaces and only one of them is a place you
   dwell: the roster is the hub, and trial / result / sheet are spokes you enter
   for one participant or one task and then come back from. A tab bar would
   imply you can be "in" the trial surface without a participant, which is not a
   state that exists.

   So the header carries exactly three things:

     1. WHERE YOU ARE — the current surface, named, with its icon. This is the
        page's <h1>, so every surface now has exactly one and the heading order
        is well-formed. Before this, the trial screen had no heading at all.
     2. HOW TO GET BACK — a single, always-identical control returning to the
        hub. One destination, one label, one position, on every spoke. A
        facilitator never has to learn a second way back, and never has to
        decide which back is the right one.
     3. WHICH PHASE — pre or post, read-only. Wayfinding, not a control:
        switching phase is a facilitator action and lives in the rail, because a
        thing that changes what you are recording should not sit one pixel from
        a thing that only tells you where you are.

   Everything else stays where it was. The rail keeps the primary forward action
   on each surface, which is what a standing operator's thumb is already aimed
   at. The header is for orientation; the rail is for doing.
   ───────────────────────────────────────────────────────────────────────────── */

import { Icon, type IconKind } from './Icon'
import { Logo } from './Logo'
import { strings } from '../i18n/strings'

export interface Place {
  readonly title: string
  readonly icon: IconKind
}

export function AppHeader({
  place,
  phaseWord,
  onBack,
}: {
  place: Place
  /** Read-only. The control that changes it lives in the rail. */
  phaseWord: string
  /** Absent on the hub itself, which is what makes the hub identifiable. */
  onBack?: (() => void) | undefined
}) {
  return (
    <header className="hdr no-print">
      <Logo />

      <div className="hdr__where">
        {onBack && (
          <>
            <nav aria-label={strings.nav.whereLabel}>
              <button type="button" className="hdr__back" onClick={onBack}>
                <Icon kind="back" />
                <Icon kind="roster" />
                <span>{strings.nav.placeRoster}</span>
              </button>
            </nav>
            <span className="hdr__sep" aria-hidden="true">
              /
            </span>
          </>
        )}

        <h1 className="hdr__title">
          <Icon kind={place.icon} />
          <span>{place.title}</span>
        </h1>
      </div>

      <span className="hdr__phase">
        <span className="hdr__phase-label">{strings.nav.phaseLabel}</span>
        <span className="hdr__phase-value">{phaseWord}</span>
      </span>
    </header>
  )
}
