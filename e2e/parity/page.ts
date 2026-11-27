import { devices, expect, type Page } from '@playwright/test'

/** How long a Tool may take to appear once its page loads. */
export const TOOL_TIMEOUT = 15_000

// The loading indicators are Noto emoji images, kept in both builds (docs/ux/parity.md → The reference).
/** The flying saucer's Noto code point: shows until the page, or the Tool on its route, is ready. */
export const TOOL_LOADING_EMOJI = '1f6f8'
/** The robot's Noto code point: shows in a dashboard widget until its Tool fills it. */
export const WIDGET_LOADING_EMOJI = '1f916'
export const TOOL_LOADING = `img[src*="/${TOOL_LOADING_EMOJI}/"]`
export const WIDGET_LOADING = `img[src*="/${WIDGET_LOADING_EMOJI}/"]`

/** A device's options for `test.use` or `browser.newContext`, which take no browser type. */
export const deviceOptions = (name: string) => {
  const { defaultBrowserType: _browser, ...options } = devices[name]!
  return options
}

/**
 * Waits until the page has stopped arriving: the flying-saucer loading
 * indicator is gone, nothing is still fading or sliding in (cards and the
 * dialog animate opacity and scale on mount), and no loading skeleton or
 * spinner is still pulsing. axe reads colours through opacity, and a
 * screenshot taken mid-fade is not evidence of anything.
 */
export const settle = async (page: Page): Promise<void> => {
  await expect(page.locator(TOOL_LOADING), 'the loading indicator is gone').toHaveCount(0, { timeout: TOOL_TIMEOUT })
  // Two frames, so an animation that starts on mount exists before it is sampled.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
  // No animation still running, endless ones included: an endless one is a loading skeleton or
  // spinner (an editor still loading), not the settled page. A focused field's blinking caret, a
  // few pixels wide, is the one endless animation a settled page keeps.
  await page.waitForFunction(
    () =>
      document.getAnimations().every((a) => {
        if (a.playState !== 'running') return true
        const target = (a.effect as KeyframeEffect | null)?.target
        return target instanceof Element && target.getBoundingClientRect().width <= 4
      }),
    undefined,
    { timeout: TOOL_TIMEOUT },
  )
  await expect
    .poll(() =>
      page
        .locator('article, [role="dialog"]')
        .evaluateAll((surfaces) => surfaces.every((s) => getComputedStyle(s).opacity === '1')),
    )
    .toBe(true)
}
