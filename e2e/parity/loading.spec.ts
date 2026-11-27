import { type CDPSession, expect, type Page, test } from '@playwright/test'

import { SLOW_4G } from '../perf/throttle'
import {
  deviceOptions,
  NOTO_EMOJI_BASE,
  TOOL_LOADING,
  TOOL_LOADING_EMOJI,
  WIDGET_LOADING,
  WIDGET_LOADING_EMOJI,
} from './page'
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

// Each page fills in slot by slot: the home page arrives with the app shell, and each dashboard widget
// shows its own robot until its Tool fills it; on a Tool route, `main` shows the flying saucer until
// the Tool does. In every slot the indicator must be drawn (its image decoded), not just laid out,
// before that slot's content shows.
type LoadingPage = {
  /** What fills a slot, inside it. */
  content: string
  emoji: string
  indicator: string
  name: string
  path: string
  /** The parts of the page that load on their own, each with its own indicator. */
  slot: string
}

const PAGES: Array<LoadingPage> = [
  {
    content: 'article',
    emoji: WIDGET_LOADING_EMOJI,
    indicator: WIDGET_LOADING,
    name: 'home page',
    path: '/',
    slot: '[data-testid="dashboard-widget"]',
  },
  ...(routeTool
    ? [
        {
          content: '[data-slot="tool-surface"]',
          emoji: TOOL_LOADING_EMOJI,
          indicator: TOOL_LOADING,
          name: 'Tool route',
          path: routeTool.routePath,
          slot: 'main',
        },
      ]
    : []),
]

/** Per slot, in document order: when its indicator was visible, drawn, and when its content showed. */
type SlotRecord = { appAt: null | number; drawnAt: null | number; indicatorAt: null | number }
type LoadingRecord = { cls: number; slots: Array<SlotRecord> }

test.use(deviceOptions('Pixel 7'))

// A 1x1 GIF. The emoji come from Google's CDN, which a merge gate must not depend on: a slow or failed
// response would fail a healthy build. The stub answers only the Noto emoji URLs both builds must use
// (docs/ux/parity.md → The reference), so an indicator pointing anywhere else is still never drawn.
const EMOJI_STUB = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
const stubEmoji = (page: Page) =>
  page.route(`${NOTO_EMOJI_BASE}**`, (route) => route.fulfill({ body: EMOJI_STUB, contentType: 'image/gif' }))

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

/** Records, from the first byte, the layout shift and, per slot, when its indicator and content appear. */
const record = async (page: Page, { content, emoji, indicator, slot }: LoadingPage): Promise<void> => {
  await page.addInitScript(
    ({ base, content, emoji, indicator, slot }) => {
      const r: LoadingRecord = { cls: 0, slots: [] }
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
      // Drawn: the image's bytes have arrived and decoded, so the visitor sees the emoji, not an empty
      // box. `currentSrc` is the file actually drawn (a <picture> source can win over the <img> src), and it
      // must be that emoji from the source both builds use, not a stand-in from another host.
      const drawn = (el: Element | null) =>
        el instanceof HTMLImageElement &&
        seen(el) &&
        el.complete &&
        el.naturalWidth > 0 &&
        el.currentSrc.startsWith(`${base}${emoji}/`)
      // Seen or drawn only counts once it reaches a frame: the check is confirmed in the next animation
      // frame, which runs just before that frame paints, with the indicator still in the page. An
      // indicator the content replaces before then was never on screen.
      // One pending set per test, so a pending "seen" never swallows a "drawn".
      const pending = new Map<(el: Element) => boolean, WeakSet<Element>>([
        [seen, new WeakSet()],
        [drawn, new WeakSet()],
      ])
      const onScreen = (el: Element, holds: (el: Element) => boolean, mark: (at: number) => void) => {
        const waiting = pending.get(holds)!
        if (waiting.has(el)) return
        waiting.add(el)
        requestAnimationFrame((at) => {
          waiting.delete(el)
          if (el.isConnected && holds(el)) mark(at)
        })
      }
      const check = () => {
        document.querySelectorAll(slot).forEach((el, i) => {
          const s = (r.slots[i] ??= { appAt: null, drawnAt: null, indicatorAt: null })
          const shown = el.querySelector(indicator)
          if (shown && s.indicatorAt === null && seen(shown)) onScreen(shown, seen, (at) => (s.indicatorAt ??= at))
          if (shown && s.drawnAt === null && drawn(shown)) onScreen(shown, drawn, (at) => (s.drawnAt ??= at))
          if (s.appAt === null && el.querySelector(content)) s.appAt = performance.now()
        })
      }
      new MutationObserver(check).observe(document, { attributes: true, childList: true, subtree: true })
      // An image finishing its download is no DOM mutation; `load` does not bubble, so listen in capture.
      document.addEventListener('load', check, true)
    },
    { base: NOTO_EMOJI_BASE, content, emoji, indicator, slot },
  )
}

const readRecord = (page: Page): Promise<LoadingRecord> =>
  page.evaluate(() => (window as unknown as { __loading: LoadingRecord }).__loading)

if (!routeTool) {
  // Not silently dropped: a build with none of the budget's Tool pages yet has no Tool route to load.
  test.skip(`loading a Tool route (none of ${ROUTE_TOOLS.join(', ')} is in this run)`, () => {})
}

for (const loading of PAGES) {
  const { content, indicator, name, path, slot } = loading
  const app = `${slot} ${content}`
  test.describe(`loading the ${name}`, () => {
    test('shows the loading indicator first, then fills the root without a layout shift', async ({ page }) => {
      await stubEmoji(page)
      await throttle(page)
      await record(page, loading)
      await page.goto(path, { waitUntil: 'commit' })
      await expect(page.locator(app).first()).toBeVisible({ timeout: LOAD_TIMEOUT })
      await page.waitForLoadState('load', { timeout: LOAD_TIMEOUT })
      // Filled in: no indicator left (every widget on the home page). A build may fetch code after
      // `load`, so this, not `load`, ends the fill. Then late shifts (fonts) get a moment to land.
      await expect(page.locator(indicator), 'the page has filled in').toHaveCount(0, { timeout: LOAD_TIMEOUT })
      await page.waitForTimeout(2_000)

      const { cls, slots } = await readRecord(page)
      expect(slots.length, 'slots that loaded').toBe(await page.locator(slot).count())
      slots.forEach(({ appAt, drawnAt, indicatorAt }, i) => {
        const where = `${name}, slot ${i + 1} of ${slots.length}`
        expect(appAt, `${where}: its content showed`).not.toBeNull()
        expect(indicatorAt, `${where}: its loading indicator showed`).not.toBeNull()
        expect(indicatorAt!, `${where}: its loading indicator showed before its content`).toBeLessThan(appAt!)
        expect(drawnAt, `${where}: its loading indicator image was drawn`).not.toBeNull()
        expect(drawnAt!, `${where}: its loading indicator image was drawn before its content`).toBeLessThan(appAt!)
      })
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
