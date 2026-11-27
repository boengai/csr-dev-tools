import { type CDPSession, expect, type Page, test } from '@playwright/test'

import { SLOW_4G } from '../perf/throttle'
import { deviceOptions, TOOL_LOADING, WIDGET_LOADING } from './page'
import { parityTools } from './tools'

/**
 * The loading check (docs/ux/parity.md → Waiting and loading), once per page
 * type, under the performance harness's slow-4G throttle on a phone (the pair
 * the perf harness measures). Both builds serve an empty root, so this checks
 * what a visitor sees while it fills in. Chromium only: the throttle is CDP.
 */

// Layout shift is budgeted at 0.01 (docs/perf/budgets.md); React measures 0.000.
const CLS_LIMIT = 0.01
const LOAD_TIMEOUT = 90_000

// The Tool route: the first of these this run has. They are the performance budget's Tool pages
// (docs/perf/budgets.md, on develop) that open on a field to focus, so the CLS budget applies to them.
const ROUTE_TOOLS = ['hash-generator', 'escaped-json-stringifier', 'json-diff-checker', 'number-base-converter']
const routeTool = ROUTE_TOOLS.map((key) => parityTools().find((tool) => tool.key === key)).find(Boolean)

// The home page arrives with the app shell, so its indicator is the robot in each widget until the
// widget's Tool fills it; on a Tool route, the flying saucer shows until the Tool does.
// The indicator must be drawn (its image decoded), not just laid out, before the app shows.
const PAGES: Array<{ app: string; indicator: string; name: string; path: string }> = [
  {
    app: '[data-testid="dashboard-widget"] article',
    indicator: WIDGET_LOADING,
    name: 'home page',
    path: '/',
  },
  ...(routeTool
    ? [
        {
          app: '[data-slot="tool-surface"]',
          indicator: TOOL_LOADING,
          name: 'Tool route',
          path: routeTool.routePath,
        },
      ]
    : []),
]

type LoadingRecord = { appAt: null | number; cls: number; indicatorAt: null | number; indicatorDrawnAt: null | number }

test.use(deviceOptions('Pixel 7'))

// A 1x1 GIF. The emoji come from Google's CDN, which a merge gate must not depend on: a slow or failed
// response would fail a healthy build. The stub answers only the Noto emoji URLs both builds must use
// (docs/ux/parity.md → The reference), so an indicator pointing anywhere else is still never drawn.
const EMOJI_STUB = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
const stubEmoji = (page: Page) =>
  page.route('https://fonts.gstatic.com/s/e/notoemoji/**', (route) =>
    route.fulfill({ body: EMOJI_STUB, contentType: 'image/gif' }),
  )

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
      const r: LoadingRecord = { appAt: null, cls: 0, indicatorAt: null, indicatorDrawnAt: null }
      Object.assign(window, { __loading: r })
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number }>)
          if (!entry.hadRecentInput) r.cls += entry.value
      }).observe({ buffered: true, type: 'layout-shift' })
      // The indicator counts once a visitor can see it: rendered with a size, not hidden or transparent.
      const seen = (el: Element | null) => {
        if (!el?.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false
        const box = el.getBoundingClientRect()
        return box.width > 0 && box.height > 0
      }
      const check = () => {
        const shown = document.querySelector(indicator)
        if (r.indicatorAt === null && seen(shown)) r.indicatorAt = performance.now()
        // Drawn: the image's bytes have arrived and decoded, so the visitor sees the emoji, not an empty box.
        if (
          r.indicatorDrawnAt === null &&
          seen(shown) &&
          shown instanceof HTMLImageElement &&
          shown.complete &&
          shown.naturalWidth > 0
        )
          r.indicatorDrawnAt = performance.now()
        if (r.appAt === null && document.querySelector(app)) r.appAt = performance.now()
      }
      new MutationObserver(check).observe(document, { attributes: true, childList: true, subtree: true })
      // An image finishing its download is no DOM mutation; `load` does not bubble, so listen in capture.
      document.addEventListener('load', check, true)
    },
    { app, indicator },
  )
}

const readRecord = (page: Page): Promise<LoadingRecord> =>
  page.evaluate(() => (window as unknown as { __loading: LoadingRecord }).__loading)

if (!routeTool) {
  // Not silently dropped: a build with none of the budget's Tool pages yet has no Tool route to load.
  test.skip(`loading a Tool route (none of ${ROUTE_TOOLS.join(', ')} is in this run)`, () => {})
}

for (const { app, indicator, name, path } of PAGES) {
  test.describe(`loading the ${name}`, () => {
    test('shows the loading indicator first, then fills the root without a layout shift', async ({ page }) => {
      await stubEmoji(page)
      await throttle(page)
      await record(page, app, indicator)
      await page.goto(path, { waitUntil: 'commit' })
      await expect(page.locator(app).first()).toBeVisible({ timeout: LOAD_TIMEOUT })
      await page.waitForLoadState('load', { timeout: LOAD_TIMEOUT })
      // Filled in: no indicator left (every widget on the home page). A build may fetch code after
      // `load`, so this, not `load`, ends the fill. Then late shifts (fonts) get a moment to land.
      await expect(page.locator(indicator), 'the page has filled in').toHaveCount(0, { timeout: LOAD_TIMEOUT })
      await page.waitForTimeout(2_000)

      const { appAt, cls, indicatorAt, indicatorDrawnAt } = await readRecord(page)
      expect(indicatorAt, 'the loading indicator showed').not.toBeNull()
      expect(appAt, 'the app showed').not.toBeNull()
      expect(indicatorAt!, 'the loading indicator showed before the app').toBeLessThan(appAt!)
      expect(indicatorDrawnAt, 'the loading indicator image was drawn').not.toBeNull()
      expect(indicatorDrawnAt!, 'the loading indicator image was drawn before the app').toBeLessThan(appAt!)
      expect(cls, 'cumulative layout shift').toBeLessThanOrEqual(CLS_LIMIT)
    })

    test('keys and clicks while it loads cause no console error, and the first field then takes focus', async ({
      page,
    }) => {
      const errors: Array<string> = []
      const origin = new URL(test.info().project.use.baseURL!).origin
      page.on('console', (message) => {
        // A third-party request that fails (the web font, the emoji images) is the network, not the app.
        const from = message.location().url
        if (message.type() === 'error' && (!from || from.startsWith(origin))) errors.push(message.text())
      })
      page.on('pageerror', (error) => errors.push(error.message))

      await stubEmoji(page)
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
