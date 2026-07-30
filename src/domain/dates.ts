/* ROC-era dates. A form filed with a Taiwanese funding report uses 民國 years, not
   Gregorian: the fixture block is "115 年度第 3 期", and a sheet mixing 2026 into
   that would look wrong to the person filing it. */

const ROC_OFFSET = 1911

function parts(iso: string): { y: number; m: number; d: number } | null {
  // Accept both a bare date and a full timestamp.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m || !m[1] || !m[2] || !m[3]) return null
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
}

/** `2026-07-27` → `115/07/27`. Returns the input unchanged if unparseable. */
export function rocDate(iso: string): string {
  const p = parts(iso)
  if (!p) return iso
  const roc = p.y - ROC_OFFSET
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${roc}/${pad(p.m)}/${pad(p.d)}`
}

/** Today, in ROC form. */
export function rocToday(): string {
  const now = new Date()
  const iso = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
    .getDate()
    .toString()
    .padStart(2, '0')}`
  return rocDate(iso)
}
