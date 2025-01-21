import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/x-data-grid', '@mui/x-date-pickers'],
          charts: ['recharts'],
          utils: ['date-fns', 'html2canvas', 'jspdf']
        }
      }
    }
  },
  envPrefix: 'VITE_',
  server: {
    watch: {
      usePolling: true
    }
  }
})
