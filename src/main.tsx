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
import { LocalhostDataSource } from './data/LocalhostDataSource'
import type { SessionDataSource } from './data/SessionDataSource'

// The ONLY place a concrete data source is named. Defaults to the fixture
// source (unchanged demo behaviour, incl. the `S` scenario switcher) so the
// deployed demo URL keeps working without a camera. Append `?live=1` to talk
// to a real Python backend on http://127.0.0.1:8765 instead.
const live = new URLSearchParams(window.location.search).get('live') === '1'
const source: SessionDataSource = live
  ? new LocalhostDataSource('http://127.0.0.1:8765')
  : new FixtureDataSource()

const el = document.getElementById('root')
if (!el) throw new Error('#root missing')

createRoot(el).render(
  <StrictMode>
    <DataSourceProvider source={source}>
      <App />
    </DataSourceProvider>
  </StrictMode>,
)
