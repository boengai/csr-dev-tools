import { type CDPSession, devices, expect, type Page, test } from '@playwright/test'

import { SLOW_4G } from '../perf/throttle'

/**
 * The loading check (docs/ux/parity.md → Waiting and loading), once per page
 * type, under the performance harness's slow-4G throttle on a phone (the pair
 * the perf harness measures). Both builds serve an empty root, so this checks
 * what a visitor sees while it fills in. Chromium only: the throttle is CDP.
 */

// Layout shift is budgeted at 0.01 (docs/perf/budgets.md); React measures 0.000.
const CLS_LIMIT = 0.01
const LOAD_TIMEOUT = 90_000

// The loading indicators are Noto emoji images, kept in both builds (docs/ux/parity.md → The reference).
// The home page arrives with the app shell, so its indicator is the robot in each widget until the
// widget's Tool fills it; on a Tool route, the flying saucer shows until the Tool does.
const PAGES = [
  {
    app: '[data-testid="dashboard-widget"] article',
    indicator: 'img[src*="/1f916/"]',
    name: 'home page',
    path: '/',
  },
  {
    app: '[data-slot="tool-surface"]',
    indicator: 'img[src*="/1f6f8/"]',
    name: 'Tool route',
    path: '/tools/json-formatter',
  },
] as const

type LoadingRecord = { appAt: null | number; cls: number; indicatorAt: null | number }

const { defaultBrowserType: _browser, ...pixel7 } = devices['Pixel 7']
test.use(pixel7)

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== 'chromium', 'the slow-4G throttle is applied through CDP')
  test.setTimeout(LOAD_TIMEOUT + 30_000)
})

const throttle = async (page: Page): Promise<CDPSession> => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    downloadThroughput: (SLOW_4G.downloadKbps * 1024) / 8,
    latency: SLOW_4G.latencyMs,
    offline: false,
    uploadThroughput: (SLOW_4G.uploadKbps * 1024) / 8,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: SLOW_4G.cpuSlowdown })
  return cdp
}

/** Records, from the first byte, when the indicator and the app first appear and the layout shift. */
const record = async (page: Page, app: string, indicator: string): Promise<void> => {
  await page.addInitScript(
    ({ app, indicator }) => {
      const r: LoadingRecord = { appAt: null, cls: 0, indicatorAt: null }
      Object.assign(window, { __loading: r })
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number }>)
          if (!entry.hadRecentInput) r.cls += entry.value
      }).observe({ buffered: true, type: 'layout-shift' })
      const check = () => {
        if (r.indicatorAt === null && document.querySelector(indicator)) r.indicatorAt = performance.now()
        if (r.appAt === null && document.querySelector(app)) r.appAt = performance.now()
      }
      new MutationObserver(check).observe(document, { childList: true, subtree: true })
    },
    { app, indicator },
  )
}

const readRecord = (page: Page): Promise<LoadingRecord> =>
  page.evaluate(() => (window as unknown as { __loading: LoadingRecord }).__loading)

for (const { app, indicator, name, path } of PAGES) {
  test.describe(`loading the ${name}`, () => {
    test('shows the loading indicator first, then fills the root without a layout shift', async ({ page }) => {
      await throttle(page)
      await record(page, app, indicator)
      await page.goto(path, { waitUntil: 'commit' })
      await expect(page.locator(app).first()).toBeVisible({ timeout: LOAD_TIMEOUT })
      await page.waitForLoadState('load', { timeout: LOAD_TIMEOUT })
      // Late shifts (fonts, tiles filling in) land after `load`.
      await page.waitForTimeout(2_000)

      const { appAt, cls, indicatorAt } = await readRecord(page)
      expect(indicatorAt, 'the loading indicator showed').not.toBeNull()
      expect(appAt, 'the app showed').not.toBeNull()
      expect(indicatorAt!, 'the loading indicator showed before the app').toBeLessThan(appAt!)
      expect(cls, 'cumulative layout shift').toBeLessThanOrEqual(CLS_LIMIT)
    })

    test('keys and clicks while it loads cause no console error, and the first field then takes focus', async ({
      page,
    }) => {
      const errors: Array<string> = []
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      page.on('pageerror', (error) => errors.push(error.message))

      await throttle(page)
      await page.goto(path, { waitUntil: 'commit' })
      const appShown = page.locator(app).first()
      const viewport = page.viewportSize()!
      const deadline = Date.now() + LOAD_TIMEOUT
      // A visitor taps and types before anything is there. The header's middle is empty on both pages,
      // so a tap there never lands on a control once the app is up.
      while (!(await appShown.isVisible())) {
        expect(Date.now(), 'the app showed').toBeLessThan(deadline)
        await page.keyboard.press('a')
        await page.keyboard.press('Tab')
        await page.keyboard.press('Escape')
        await page.mouse.click(viewport.width / 2, 24)
        await page.waitForTimeout(100)
      }
      await page.waitForLoadState('load', { timeout: LOAD_TIMEOUT })

      if (path === '/') {
        // No field on the home page: the first control takes focus from the keyboard.
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
        await page.keyboard.press('Tab')
        await expect(page.locator(':focus')).toBeVisible()
      } else {
        const field = page
          .locator(app)
          .locator('[contenteditable="true"], textarea, input:not([type="hidden"]):not([type="file"])')
          .first()
        await field.click()
        await expect(field).toBeFocused()
      }
      expect(errors, 'console errors').toEqual([])
    })
  })
}
