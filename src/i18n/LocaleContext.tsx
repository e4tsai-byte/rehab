/* The one place the current locale lives at runtime.
 *
 * `LocaleProvider` wraps the app in `main.tsx`. Everything below it reads the
 * locale and the `t()` translator through `useT()`. The provider also keeps
 * `<html lang>` in sync so the browser applies the right line-breaking and
 * font behaviour, and persists the choice through rehabStore (invariant 1 —
 * localStorage access is centralised there).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Locale } from './locale'
import { HTML_LANG } from './locale'
import { loadLocale, saveLocale } from '../data/rehabStore'
import { translate, type StringKey, type TVars } from './uiStrings'

export type TranslateFn = (key: StringKey, vars?: TVars) => string

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslateFn
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale)

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale]
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    saveLocale(next)
  }, [])

  const t = useCallback<TranslateFn>((key, vars) => translate(locale, key, vars), [locale])

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/** The hook every surface uses: `const { t, locale, setLocale } = useT()`. */
export function useT(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useT must be used within a LocaleProvider')
  return ctx
}
