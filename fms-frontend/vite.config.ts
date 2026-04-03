import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Keep in sync with fms-frontend/src/utils/localBackend.ts (DEFAULT_LOCAL_BACKEND_ORIGIN)
const DEFAULT_BACKEND_TARGET = 'http://127.0.0.1:8020'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = (env.VITE_API_BASE_URL || env.VITE_API_URL || DEFAULT_BACKEND_TARGET).replace(
    /\/+$/,
    ''
  )

  // eslint-disable-next-line no-console
  console.log(
    `\n[FMS] API proxy target: ${target}\n` +
      `     Vite forwards /api/* → this URL. It MUST match uvicorn (same port as --port).\n` +
      `     If you see ECONNREFUSED, edit VITE_API_BASE_URL in fms-frontend/.env and restart npm run dev.\n`
  )

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3001,
      open: true,
      // /api/* → FastAPI root paths (strip prefix). Target must match VITE_API_BASE_URL / uvicorn port.
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
