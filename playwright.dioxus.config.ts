import { defineConfig, devices } from '@playwright/test'

import { DIOXUS_ONLY } from './e2e/parity/tags'

// The Dioxus run, under the post-migration CSP (docs/quality/gates.md → "CSP").
//   dx build (see .github/workflows/dioxus.yml) && pnpm exec playwright test -c playwright.dioxus.config.ts
// Every spec it runs gets the CSP fixture: e2e/tsconfig.dioxus.json maps
// `@playwright/test` to e2e/parity/csp.ts.
//
// No Tool is ported yet, so it runs the fixture's own checks only. The first
// `port` or `shell` PR moves it onto `defineParityConfig` (e2e/parity/config.ts),
// with its Tool in the Dioxus spec filter.
const PORT = 4174
const url = `http://localhost:${PORT}`

export default defineConfig({
  forbidOnly: !!process.env.CI,
  grep: new RegExp(DIOXUS_ONLY),
  outputDir: 'test-results/parity-dioxus',
  projects: [{ name: 'csp', testMatch: 'parity/csp.spec.ts', use: { ...devices['Desktop Chrome'] } }],
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-parity-dioxus' }]]
    : [['list']],
  retries: 0,
  testDir: './e2e',
  tsconfig: './e2e/tsconfig.dioxus.json',
  use: { baseURL: url, trace: 'retain-on-failure' },
  webServer: {
    command: `node crates/gates/scripts/serve-dioxus.mjs dist-dioxus ${PORT} docs/quality/post-migration-csp.txt`,
    reuseExistingServer: false,
    url,
  },
})
