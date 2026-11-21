import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  optimizeDeps: {
    exclude: ['@mediapipe/hands'],
  },
  build: {
    rollupOptions: {
      // Tell Rollup that @mediapipe/hands is a global loaded via <script> tag
      // so it won't be bundled and won't cause "bare specifier" errors
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
