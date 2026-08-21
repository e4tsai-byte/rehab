/* Locale-aware date and time formatting.
 *
 * The zh-TW UI formatted dates by hand ("8月3日 14:05", "2026 年 8 月"). Those
 * strings don't translate by substitution, so formatting moves to Intl here:
 * one place that knows the BCP-47 tag for each locale and the shapes the app
 * needs. 24-hour time throughout — this is a clinical adherence record, not a
 * consumer app.
 */

import type { Locale } from './locale'

const BCP47: Record<Locale, string> = { zh: 'zh-TW', en: 'en-US' }

/** Short session stamp for table rows: "8月3日 14:05" / "Aug 3, 14:05". */
export function formatSessionTime(ts: number, locale: Locale): string {
  return new Intl.DateTimeFormat(BCP47[locale], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ts))
}

/** Full session stamp for the summary header. */
export function formatSessionTimeLong(ts: number, locale: Locale): string {
  return new Intl.DateTimeFormat(BCP47[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ts))
}

/** Calendar heading: "2026 年 8 月" / "August 2026". */
export function formatMonthLabel(year: number, month1to12: number, locale: Locale): string {
  return new Intl.DateTimeFormat(BCP47[locale], { year: 'numeric', month: 'long' }).format(
    new Date(year, month1to12 - 1, 1),
  )
}

/** Seven single-character weekday headers, Sunday first, for the calendar grid. */
export function weekdayNarrow(locale: Locale): string[] {
  const fmt = new Intl.DateTimeFormat(BCP47[locale], { weekday: 'narrow' })
  // 2024-01-07 is a Sunday; walk seven days from there.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 7 + i)))
}
