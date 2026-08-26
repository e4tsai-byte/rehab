import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
  const isHttps = mode === 'https'
  return {
    plugins: [react(), ...(isHttps ? [basicSsl()] : [])],
    // Relative base so the bundle works from GitHub Pages, a custom domain,
    // or local dev network previews.
    base: './',
    build: {
      outDir: 'dist',
      assetsInlineLimit: 0,
      // esbuild's default CSS minifier collapses paired `backdrop-filter` /
      // `-webkit-backdrop-filter` declarations, silently dropping the
      // unprefixed property from ~45 of 47 material rules in production
      // (rehab.css, base.css, telemetry.css) and flattening every glass
      // surface — cards, sheets, the header, the pacer — to an unblurred,
      // too-transparent panel. Source is correct; only the minifier is not.
      // Disabling CSS minification is the dependency-free fix: it guarantees
      // both declarations ship as authored. Revisit if bundle size becomes a
      // real concern — Lightning CSS (`css.transformer`/`build.cssMinify:
      // 'lightningcss'`) handles vendor-prefix pairs correctly and would let
      // minification come back on, but needs `npm install` to add the
      // dependency and regenerate package-lock.json, which this pass could
      // not run.
      cssMinify: false,
    },
    server: {
      host: true, // Bind to all interfaces (e.g. 0.0.0.0) for phone previews
      port: 5173,
    },
  }
})
