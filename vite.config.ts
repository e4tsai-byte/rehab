import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the same bundle works from a GitHub Pages subpath, an
  // arbitrary static host, or file:// on the appliance. The October install has
  // no network and no known URL prefix, so absolute bases are a liability.
  base: './',
  build: {
    outDir: 'dist',
    // CJK font subsets are many small files; keep them as assets rather than
    // inlining, so the browser fetches only the unicode-ranges it needs.
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
  },
})
