import type { FormFlag } from '../domain/rehabTypes'
import { useT } from '../i18n/LocaleContext'
import type { StringKey } from '../i18n/uiStrings'

interface FormAlertBannerProps {
  flags: readonly FormFlag[]
}

/* Instruction, never verdict. The user already knows the movement was hard;
   what they do not know is what to do about it in the next two seconds.
   "Relax the shoulder down", not "You shrugged". CLAUDE.md invariant 1.6 —
   the copy for both locales lives in uiStrings under the `flag.*` keys. */
export function FormAlertBanner({ flags }: FormAlertBannerProps) {
  const { t } = useT()

  if (flags.length === 0) return null

  // Two at once is the ceiling. A stream of simultaneous corrections is not
  // actionable within a rep, and reads as a list of accusations.
  const uniqueFlags = Array.from(new Set(flags)).slice(0, 2)

  return (
    <div className="form-alert" role="alert" aria-live="assertive">
      {uniqueFlags.map((flag) => (
        <div key={flag} className="form-alert__item">
          <span className="form-alert__title">{t(`flag.${flag}.title` as StringKey)}</span>
          <span className="form-alert__hint">{t(`flag.${flag}.hint` as StringKey)}</span>
        </div>
      ))}
    </div>
  )
}
