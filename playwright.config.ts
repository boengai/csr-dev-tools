import { defineConfig, devices } from '@playwright/test'

import { DIOXUS_ONLY } from './e2e/parity/tags'

export default defineConfig({
  testDir: './e2e',
  // The parity harness has its own run, with no retries: playwright.parity.config.ts.
  testIgnore: ['parity/**'],
  // A check a `ux-improvement` adds fails on React by design (docs/ux/parity.md → Improvements).
  grepInvert: new RegExp(DIOXUS_ONLY),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // CI has already built the WASM; `pnpm dev` would recompile it and time out.
    command: process.env.CI ? 'pnpm exec vite --port 5173' : 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
