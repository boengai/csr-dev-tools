import { defineConfig, devices } from '@playwright/test'

// Runs the React site's own journeys for the three spike tools, unchanged,
// against the built Dioxus site (issue 18), plus the spike's own checks.
//   pnpm exec playwright test -c dioxus/playwright.config.ts
// Build first: dioxus/scripts/build.sh
const PORT = 5174

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      grep: /Hash Generator|Escaped JSON Stringifier|Image Converter/,
      name: 'react-journeys',
      testDir: '../e2e',
      testMatch: ['crypto-tools.spec.ts', 'escaped-json-stringifier.spec.ts', 'image-tools.spec.ts', 'image-batch.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    { name: 'spike', testDir: './e2e', use: { ...devices['Desktop Chrome'] } },
  ],
  reporter: [['list']],
  // No retries: a flaky journey is a finding, not noise.
  retries: 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node dioxus/scripts/serve.ts dioxus/dist ${PORT}`,
    cwd: '..',
    reuseExistingServer: !process.env.CI,
    url: `http://localhost:${PORT}`,
  },
})
