/* Persistent honesty marker. Not dismissible.

   This build ships as a public URL for a competition submission, so it must be
   self-evidently a UI prototype with simulated data. It must never imply a
   working measurement system exists. `no-print` keeps it off the sheet: a printed
   page handed to a site lead is a different artifact with its own footer. */

import { strings } from '../i18n/strings'

export function DemoBanner({ simulated }: { simulated: boolean }) {
  if (!simulated) return null
  return (
    <div className="demo no-print" role="note">
      <span className="demo__badge">{strings.demo.badge}</span>
      <span className="demo__detail">{strings.demo.detail}</span>
    </div>
  )
}
