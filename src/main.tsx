import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Bundled locally, never a CDN. Invariant #1 is architectural: a rehab surface
// makes no remote request, so the CJK face ships in the bundle. Fontsource emits
// CJK as many small unicode-range subsets, so the browser fetches only the ranges
// the page actually uses.
import '@fontsource/noto-sans-tc/400.css'
import '@fontsource/noto-sans-tc/500.css'
import '@fontsource/noto-sans-tc/700.css'

// Load order is significant and must not be reordered casually:
// tokens (the palette) → base (reset, consumes tokens) → components.
import './styles/tokens.css'
import './styles/base.css'
import './styles/telemetry.css'
import './styles/rehab.css'

import { App } from './App'
import { LocaleProvider } from './i18n/LocaleContext'

const el = document.getElementById('root')
if (!el) throw new Error('#root missing')

createRoot(el).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
)
