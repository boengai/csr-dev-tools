import { defineConfig } from 'vitest/config'

// The spec filename selects the environment: `*.dom.spec.ts[x]` runs under
// jsdom, everything else under node. A `@vitest-environment` docblock still
// overrides the project default for one-off cases.
const DOM_SPECS = ['**/*.dom.spec.ts', '**/*.dom.spec.tsx']
const EXCLUDE = ['e2e/**', 'node_modules/**']

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          environment: 'node',
          exclude: [...EXCLUDE, ...DOM_SPECS],
          include: ['**/*.spec.ts', '**/*.spec.tsx'],
          name: 'node',
        },
      },
      {
        extends: true,
        test: {
          environment: 'jsdom',
          exclude: EXCLUDE,
          include: DOM_SPECS,
          name: 'jsdom',
        },
      },
    ],
    setupFiles: ['src/test/setup.ts'],
  },
})
