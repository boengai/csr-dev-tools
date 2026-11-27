import { expect, type Page } from '@playwright/test'

/**
 * Waits until the page has stopped arriving: the flying-saucer loading
 * indicator is gone and nothing is still fading or sliding in (cards animate
 * opacity and scale on mount). axe reads colours through opacity, and a
 * screenshot taken mid-fade is not evidence of anything.
 */
export const settle = async (page: Page): Promise<void> => {
  await expect(page.locator('img[src*="/1f6f8/"]'), 'the loading indicator is gone').toHaveCount(0, {
    timeout: 15_000,
  })
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
