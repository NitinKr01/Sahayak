import { existsSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// `npm run build` emits both entries; `npm run build:preview` emits only
// preview.html (as index.html) for sharing the UI without a backend.
/** Emit the preview entry as index.html so static hosts serve it by default. */
const previewAsIndex = {
  name: 'preview-as-index',
  closeBundle() {
    const dir = resolve(__dirname, 'dist-preview')
    const from = resolve(dir, 'preview.html')
    if (existsSync(from)) renameSync(from, resolve(dir, 'index.html'))
  },
}

export default defineConfig(({ mode }) => {
  const previewOnly = mode === 'preview'
  return {
    plugins: [react(), tailwindcss(), ...(previewOnly ? [previewAsIndex] : [])],
    // NB: shared components reference /logo.png and /header.png root-absolute,
    // so the preview bundle must be served from a domain root (Netlify Drop,
    // `npx serve dist-preview`) rather than a subpath.
    build: {
      outDir: previewOnly ? 'dist-preview' : 'dist',
      rollupOptions: {
        input: previewOnly
          ? resolve(__dirname, 'preview.html')
          : {
              main: resolve(__dirname, 'index.html'),
              preview: resolve(__dirname, 'preview.html'),
            },
      },
    },
    server: {
      proxy: {
        // FastAPI dev server (uvicorn backend.app.main:app --port 8501)
        '/api': 'http://localhost:8501',
      },
    },
  }
})
