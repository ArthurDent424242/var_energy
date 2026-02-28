import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/var_energy/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/entsoe': {
        target: 'https://web-api.tp.entsoe.eu/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/entsoe/, ''),
      },
    },
  },
})
