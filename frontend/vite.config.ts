import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    setupFiles: ['./src/test/setup.ts'],
  },
})