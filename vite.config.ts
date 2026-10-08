import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  // The ASP.NET backend; in development /api, /sessionHub and /js are forwarded to it.
  // Defaults to the mock backend (`npm run mock`).
  const backend = env.BACKEND_URL ?? 'http://localhost:5080'
  // Set WWWROOT to the ASP.NET project's wwwroot to build straight into it.
  const wwwroot = env.WWWROOT

  return {
    plugins: [react(), tailwindcss()],
    // onnxruntime-web loads its WebAssembly files itself; pre-bundling breaks those paths in dev.
    optimizeDeps: {
      exclude: ['onnxruntime-web'],
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      open: '/admin-dashboard.html',
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/sessionHub': { target: backend, changeOrigin: true, ws: true },
        '/js': { target: backend, changeOrigin: true },
      },
    },
    build: {
      outDir: wwwroot ? path.resolve(wwwroot) : 'dist',
      // Never wipe wwwroot: it also holds the backend's own files (e.g. /js/tafqit.min.js).
      emptyOutDir: !wwwroot,
      // A folder name of our own, so nothing else in wwwroot is overwritten.
      assetsDir: 'court-roll-assets',
      rollupOptions: {
        input: {
          'admin-dashboard': path.resolve(import.meta.dirname, 'admin-dashboard.html'),
          'clerk-panel': path.resolve(import.meta.dirname, 'clerk-panel.html'),
          'hearing-schedule': path.resolve(import.meta.dirname, 'hearing-schedule.html'),
        },
      },
    },
  }
})
