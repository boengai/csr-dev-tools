import { fileURLToPath } from 'node:url'

import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test'

import { CONTRACT, DIOXUS_ONLY } from './tags'

export type ParityBuild = 'dioxus' | 'react'

export type ParityConfigOptions = {
  /** Where the build under test is served. */
  baseURL: string
  /** Which build this is. The React run leaves out the `@dioxus-only` checks. */
  build: ParityBuild
  /**
   * The journeys (`e2e/*.spec.ts`, `e2e/platform/`) this build runs: the
   * React spec files, filtered to the ported Tools, never edited
   * (docs/ux/parity.md → The Playwright specs). Default: all of them.
   */
  journeys?: { grep?: RegExp; testMatch?: Array<string> }
  /** The Tool keys this build has. The harness runs over these only. Default: every Tool. */
  tools?: Array<string>
  /** Serves the build. Leave it out when `baseURL` is already up. */
  webServer?: PlaywrightTestConfig['webServer']
}

const E2E_DIR = fileURLToPath(new URL('..', import.meta.url))
const HARNESS = ['parity/layout-contract.spec.ts', 'parity/a11y.spec.ts', 'parity/loading.spec.ts']
const CLIPBOARD: Array<string> = ['clipboard-read', 'clipboard-write']

/** Matches a title that matches both. */
const both = (a: RegExp, b: RegExp): RegExp => new RegExp(`^(?=.*(?:${a.source}))(?=.*(?:${b.source}))`)

/**
 * The parity run for one build (docs/ux/parity.md → The parity harness):
 *
 * | Project          | Device                | Runs                                        |
 * |------------------|-----------------------|---------------------------------------------|
 * | `journeys`       | Desktop Chrome        | the journeys                                |
 * | `harness`        | Desktop Chrome        | layout contract, axe, loading check         |
 * | `phone-contract` | Pixel 7               | layout contract                             |
 * | `phone-journeys` | Pixel 7               | the journeys' mobile tests                  |
 * | `webkit`         | Desktop Safari        | layout contract                             |
 * | `screenshots`    | Desktop Chrome, Pixel 7 | the Tools in `SCREENSHOT_TOOLS` (CI evidence) |
 *
 * No retries: a flaky check is a finding, not noise. The React site's own
 * run (`playwright.config.ts`) keeps its retries.
 */
export const defineParityConfig = ({ baseURL, build, journeys = {}, tools, webServer }: ParityConfigOptions) => {
  // Read by the specs at collection time, in the runner and in every worker (each loads this config).
  process.env.PARITY_BUILD = build
  if (tools && !process.env.PARITY_TOOLS) process.env.PARITY_TOOLS = tools.join(',')

  const grepInvert = build === 'react' ? new RegExp(DIOXUS_ONLY) : undefined
  const journeyFiles = {
    testIgnore: ['parity/**', 'perf/**'],
    ...(journeys.testMatch ? { testMatch: journeys.testMatch } : {}),
  }
  const mobile = /mobile viewport/

  return defineConfig({
    forbidOnly: !!process.env.CI,
    fullyParallel: true,
    outputDir: fileURLToPath(new URL(`../../test-results/parity-${build}`, import.meta.url)),
    projects: [
      {
        ...journeyFiles,
        grep: journeys.grep,
        grepInvert,
        name: 'journeys',
        use: { ...devices['Desktop Chrome'], permissions: CLIPBOARD },
      },
      {
        grepInvert,
        name: 'harness',
        testMatch: HARNESS,
        use: { ...devices['Desktop Chrome'], permissions: CLIPBOARD },
      },
      {
        grep: new RegExp(CONTRACT),
        grepInvert,
        name: 'phone-contract',
        testMatch: 'parity/layout-contract.spec.ts',
        use: { ...devices['Pixel 7'], permissions: CLIPBOARD },
      },
      {
        ...journeyFiles,
        grep: journeys.grep ? both(mobile, journeys.grep) : mobile,
        grepInvert,
        name: 'phone-journeys',
        use: { ...devices['Pixel 7'], permissions: CLIPBOARD },
      },
      {
        grep: new RegExp(CONTRACT),
        grepInvert,
        name: 'webkit',
        testMatch: 'parity/layout-contract.spec.ts',
        // WebKit has no clipboard permissions to grant; the contract suite never copies.
        use: { ...devices['Desktop Safari'] },
      },
      {
        name: 'screenshots',
        testMatch: 'parity/screenshots.spec.ts',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
    reporter: process.env.CI
      ? [['list'], ['html', { open: 'never', outputFolder: `playwright-report-parity-${build}` }]]
      : [['list']],
    retries: 0,
    testDir: E2E_DIR,
    use: { baseURL, trace: 'retain-on-failure' },
    webServer,
    workers: process.env.CI ? 2 : undefined,
  })
}
