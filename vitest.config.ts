import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['**/*.dom.spec.{ts,tsx}', 'jsdom'],
    ],
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
    setupFiles: ['./vitest.setup.dom.ts'],
  },
})
