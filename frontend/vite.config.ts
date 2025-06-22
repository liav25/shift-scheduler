import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false // Don't auto-open browser since we'll run with npm run dev
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'shift-scheduler-production.up.railway.app',
      // Allow any Railway subdomain
      '.railway.app'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}) 