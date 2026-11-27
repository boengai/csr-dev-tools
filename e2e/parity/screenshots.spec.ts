import { mkdirSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { deviceOptions, settle, TOOL_TIMEOUT } from './page'
import { parityTools } from './tools'

/**
 * A desktop and a phone screenshot of each Tool in `SCREENSHOT_TOOLS`
 * (comma-separated keys; CI passes the Tools a PR touches, from
 * `touched-tools.ts`). Evidence for the reviewer, not a gate: nothing here
 * compares pixels. Saved to `PARITY_SCREENSHOT_DIR`, default
 * `parity-screenshots/<build>/<key>-<device>.png`.
 */

const wanted = new Set(
  (process.env.SCREENSHOT_TOOLS ?? '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean),
)
const DIR = process.env.PARITY_SCREENSHOT_DIR ?? `parity-screenshots/${process.env.PARITY_BUILD ?? 'react'}`

const DEVICES = [
  ['desktop', deviceOptions('Desktop Chrome')],
  ['phone', deviceOptions('Pixel 7')],
] as const

for (const tool of parityTools().filter((t) => wanted.has(t.key))) {
  test(tool.key, async ({ browser }) => {
    mkdirSync(DIR, { recursive: true })
    for (const [label, device] of DEVICES) {
      const context = await browser.newContext({ ...device, baseURL: test.info().project.use.baseURL })
      const page = await context.newPage()
      await page.goto(tool.routePath)
      await expect(page.getByRole('heading', { exact: true, level: 1, name: tool.name })).toBeVisible({
        timeout: TOOL_TIMEOUT,
      })
      await settle(page)
      await page.screenshot({ fullPage: true, path: `${DIR}/${tool.key}-${label}.png` })
      await context.close()
    }
  })
}
