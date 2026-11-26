import { expect, test } from '@playwright/test'

// Issue 35: a tool page starts its WebAssembly downloads before the loader's
// JavaScript has arrived, and every engine downloads each module once. WebKit
// does not hand a `<link rel="preload" as="fetch">` response to the loader's
// `fetch()`, so with preload tags it downloaded every preloaded module twice.
// Runs in Chromium and in WebKit (dioxus/playwright.config.ts).

const PAGES = [
  { heading: 'Hash Generator', path: '/tools/hash-generator/' },
  { heading: 'Escaped JSON Stringifier', path: '/tools/escaped-json-stringifier/' },
  { heading: 'Image Converter', path: '/tools/image-converter/' },
]

/** Long enough that a preload and the loader's own request are in flight together. */
const HOLD_MS = 400
const hold = () => new Promise((resolve) => setTimeout(resolve, HOLD_MS))

for (const { heading, path } of PAGES) {
  test(`${heading} downloads each WebAssembly module once, the main one before the loader arrives`, async ({ page }) => {
    const requests: Array<string> = []
    let loaderArrived = false
    let mainStartedEarly = false
    page.on('request', (request) => {
      const { pathname } = new URL(request.url())
      if (!pathname.endsWith('.wasm')) return
      requests.push(pathname)
      if (/\/csr-dev-tools-dioxus_bg-[^/]*\.wasm$/.test(pathname) && !loaderArrived) mainStartedEarly = true
    })
    // Held responses keep both requests of a double download in flight, so
    // neither can be answered from the other's cache entry. Holding the loader
    // tells a download started by the page apart from one the loader started.
    await page.route(/\.wasm$/, async (route) => {
      await hold()
      await route.continue()
    })
    await page.route(/\/csr-dev-tools-dioxus-[^/]*\.js$/, async (route) => {
      await hold()
      loaderArrived = true
      await route.continue()
    })

    await page.goto(path)
    await expect(page.locator('h1')).toHaveText(heading)
    await expect(page.locator('[data-slot="tool-surface"]')).toBeVisible()
    await page.waitForLoadState('networkidle')

    const counts = Object.fromEntries([...new Set(requests)].map((url) => [url, requests.filter((r) => r === url).length]))
    expect(Object.keys(counts).some((url) => /\/module_\d+_route/.test(url)), 'the route module loaded').toBe(true)
    expect(mainStartedEarly, 'the main module was requested before the loader arrived').toBe(true)
    expect(counts).toEqual(Object.fromEntries(Object.keys(counts).map((url) => [url, 1])))
  })
}
