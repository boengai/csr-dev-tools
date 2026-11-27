import { devices, expect, type Page } from '@playwright/test'

/** How long a Tool may take to appear once its page loads. */
export const TOOL_TIMEOUT = 15_000

// The loading indicators are Noto emoji images, kept in both builds (docs/ux/parity.md → The reference).
/** The flying saucer (1f6f8): shows until the page, or the Tool on its route, is ready. */
export const TOOL_LOADING = 'img[src*="/1f6f8/"]'
/** The robot (1f916): shows in a dashboard widget until its Tool fills it. */
export const WIDGET_LOADING = 'img[src*="/1f916/"]'

/** A device's options for `test.use` or `browser.newContext`, which take no browser type. */
export const deviceOptions = (name: string) => {
  const { defaultBrowserType: _browser, ...options } = devices[name]!
  return options
}

/**
 * Waits until the page has stopped arriving: the flying-saucer loading
 * indicator is gone and nothing is still fading or sliding in (cards animate
 * opacity and scale on mount). axe reads colours through opacity, and a
 * screenshot taken mid-fade is not evidence of anything.
 */
export const settle = async (page: Page): Promise<void> => {
  await expect(page.locator(TOOL_LOADING), 'the loading indicator is gone').toHaveCount(0, { timeout: TOOL_TIMEOUT })
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().endTime === Infinity),
    undefined,
    { timeout: 10_000 },
  )
  await expect
    .poll(() => page.locator('article').evaluateAll((cards) => cards.every((c) => getComputedStyle(c).opacity === '1')))
    .toBe(true)
}
