import type { Page } from '@playwright/test'

import type { DomCondition, PerfPage } from './pages.ts'

export const WAIT_MS = 60_000

/** Lighthouse's mobile device. */
export const MOBILE = {
  deviceScaleFactor: 1.75,
  hasTouch: true,
  isMobile: true,
  viewport: { height: 823, width: 412 },
}

/** Resolves to the page's own clock (ms since navigation start) at the first frame where the condition holds. */
export const timeWhen = async (page: Page, condition: DomCondition): Promise<number> => {
  const handle = await page.waitForFunction(
    ({ count = 1, selector, text }) => {
      const matches = [...document.querySelectorAll<HTMLElement>(selector)].filter(
        (el) =>
          el.getClientRects().length > 0 &&
          !el.matches(':disabled') &&
          (text === undefined || (el instanceof HTMLInputElement ? el.value : (el.textContent ?? '')).includes(text)),
      )
      return matches.length >= count && performance.now()
    },
    condition,
    { polling: 'raf', timeout: WAIT_MS },
  )
  return Number(await handle.jsonValue())
}

export const assertOnPage = async (page: Page, target: PerfPage) => {
  if (target.heading) await page.getByRole('heading', { exact: true, level: 1, name: target.heading }).waitFor()
}
