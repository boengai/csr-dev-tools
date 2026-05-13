import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environmentMatchGlobs: [
      ['**/*.dom.spec.ts', 'jsdom'],
      ['**/*.dom.spec.tsx', 'jsdom'],
    ],
    environment: 'node',
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
  },
})
