import { defineConfig, devices } from '@playwright/test'

import { defineParityConfig } from './e2e/parity/config'
import { DIOXUS_ONLY } from './e2e/parity/tags'
import type { ToolRegistryKey } from './src/types/constants/tool-registry'

// The Dioxus run, under the post-migration CSP (docs/quality/gates.md → "CSP").
//   crates/gates/scripts/build-dioxus.sh . dist-dioxus && pnpm exec playwright test -c playwright.dioxus.config.ts
// Every spec it runs gets the CSP fixture: e2e/tsconfig.dioxus.json maps
// `@playwright/test` to e2e/parity/csp.ts.

// The Dioxus spec filter (docs/ux/parity.md): a `port` PR adds its Tool's key
// to PORTED, and its spec files and test titles to JOURNEYS.
const PORTED: Array<ToolRegistryKey> = []
const JOURNEYS: { grep?: RegExp; testMatch: Array<string> } = { testMatch: [] }

const PORT = 4174
const url = `http://localhost:${PORT}`
const webServer = {
  command: `node crates/gates/scripts/serve-dioxus.mjs dist-dioxus ${PORT} docs/quality/post-migration-csp.txt`,
  reuseExistingServer: false,
  url,
}

// The parity projects need at least one ported Tool; until then only the CSP project runs.
const parity =
  PORTED.length > 0
    ? defineParityConfig({ baseURL: url, build: 'dioxus', journeys: JOURNEYS, tools: PORTED, webServer })
    : undefined

export default defineConfig({
  forbidOnly: !!process.env.CI,
  outputDir: 'test-results/parity-dioxus',
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-parity-dioxus' }]]
    : [['list']],
  retries: 0,
  testDir: './e2e',
  use: { baseURL: url, trace: 'retain-on-failure' },
  webServer,
  ...parity,
  // The CSP fixture's own checks, and the alias that hands the fixture to every spec, hold for every run.
  projects: [
    {
      grep: new RegExp(DIOXUS_ONLY),
      name: 'csp',
      testMatch: 'parity/csp.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(parity?.projects ?? []),
  ],
  tsconfig: './e2e/tsconfig.dioxus.json',
})
