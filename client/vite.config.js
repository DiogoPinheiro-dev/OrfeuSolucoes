import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/graphql': 'http://localhost:3001',
      '/chamados': 'http://localhost:3001',
      '/projetos': 'http://localhost:3001',
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
