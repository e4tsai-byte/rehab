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
    },
    server: {
      host: true, // Bind to all interfaces (e.g. 0.0.0.0) for phone previews
      port: 5173,
    },
  }
})
