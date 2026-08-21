/**
 * Resolve a bundled asset path against the deployed base.
 *
 * WHY: every image was referenced with a site-absolute path (`/images/x.jpg`)
 * while `vite.config.ts` sets `base: './'` so the bundle survives a GitHub
 * Pages project subpath. Site-absolute paths bypass `base` entirely — served
 * from `/rehab/`, `/images/x.jpg` resolves to the domain root and 404s. Locally
 * the app sits at `/`, so the two agree and the defect is invisible until
 * deploy. Every thumbnail and diagram in the app was affected.
 *
 * Tolerant of a leading slash on purpose: custom routines saved before this fix
 * hold `/images/...` in localStorage, and stripping it here migrates them
 * without a storage rewrite.
 *
 * Passes data: and absolute http(s): URLs through untouched — an uploaded
 * cover image is already a complete URL and must not be prefixed.
 */
export function assetUrl(path: string | undefined): string | undefined {
  // thumbnailUrl and diagramUrl are optional on ExerciseDefinition, so the
  // undefined case is real rather than defensive — pass it through and let the
  // img element decide, instead of resolving BASE_URL against nothing.
  if (!path) return path
  if (/^(data:|blob:|https?:)/i.test(path)) return path
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
