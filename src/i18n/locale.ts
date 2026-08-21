/* The locale primitives for Rehabibi's two supported languages.
 *
 * Until 2026 this was a single-locale (zh-TW) product and CLAUDE.md §4 said an
 * i18n layer should be *designed* the moment a second locale arrived rather
 * than inherited early. This is that layer. It stays deliberately small: a
 * union type, browser detection, and the <html lang> mapping. Persistence lives
 * in `data/rehabStore.ts` with every other localStorage access (invariant 1).
 */

export type Locale = 'zh' | 'en'

export const LOCALES: readonly Locale[] = ['zh', 'en'] as const

export function isLocale(value: unknown): value is Locale {
  return value === 'zh' || value === 'en'
}

/** The value written to `document.documentElement.lang` for each locale. */
export const HTML_LANG: Record<Locale, string> = {
  zh: 'zh-Hant',
  en: 'en',
}

/**
 * Pick a starting locale from the browser's language preferences. English for
 * an `en-*` visitor, Chinese for a `zh-*` visitor, and Chinese as the final
 * fallback — this stays a zh-TW-first product for anyone the browser can't
 * place. A stored choice (see rehabStore.loadLocale) always wins over this.
 */
export function detectBrowserLocale(): Locale {
  try {
    const langs =
      navigator.languages && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language]
    for (const lang of langs) {
      if (!lang) continue
      const lower = lang.toLowerCase()
      if (lower.startsWith('en')) return 'en'
      if (lower.startsWith('zh')) return 'zh'
    }
  } catch {
    /* navigator unavailable (SSR, locked-down webview) — fall through */
  }
  return 'zh'
}
