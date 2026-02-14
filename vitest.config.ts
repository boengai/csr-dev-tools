import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
    setupFiles: [],
  },
})
