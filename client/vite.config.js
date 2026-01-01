import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import packageJson from '../package.json'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version)
  },
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    fs: {
      allow: ['..']
    }
  }
})
