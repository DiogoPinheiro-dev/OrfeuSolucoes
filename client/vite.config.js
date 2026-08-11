import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-icons') || id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('@apollo') || id.includes('graphql')) return 'vendor-graphql'
          if (id.includes('react')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
  test: {
    setupFiles: './src/tests/setup.js',
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}', 'services/**/*.js'],
      exclude: ['src/tests/**', 'src/main.jsx'],
    },
  },
})
