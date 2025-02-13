import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Enable sourcemaps for debugging
    minify: 'terser',
  },
  server: {
    port: 3000,
  },
  // Make env variables available
  define: {
    __BACKEND_URL__: JSON.stringify(env.VITE_BACKEND_URL),
    'process.env': {}
  }
}) 