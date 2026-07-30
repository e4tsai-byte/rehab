import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Bundled locally, never a CDN: the October appliance has no network. Fontsource
// ships CJK as many small unicode-range subsets, so the browser fetches only the
// ranges the page actually uses.
import '@fontsource/noto-sans-tc/400.css'
import '@fontsource/noto-sans-tc/500.css'
import '@fontsource/noto-sans-tc/700.css'

import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import './styles/print.css'

import { App } from './App'
import { DataSourceProvider } from './data/context'
import { FixtureDataSource } from './data/fixtures'

// The ONLY place a concrete data source is named. In October this line becomes
// `new LocalhostDataSource('http://127.0.0.1:8765')` and nothing else changes.
const source = new FixtureDataSource()

const el = document.getElementById('root')
if (!el) throw new Error('#root missing')

createRoot(el).render(
  <StrictMode>
    <DataSourceProvider source={source}>
      <App />
    </DataSourceProvider>
  </StrictMode>,
)
