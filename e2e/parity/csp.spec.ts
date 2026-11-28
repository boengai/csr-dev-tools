import { expect, test } from '@playwright/test'

import { DIOXUS_ONLY } from './tags'

// The CSP fixture's own checks (docs/quality/gates.md → "CSP"). The Dioxus run
// resolves `@playwright/test` to the fixture (e2e/parity/csp.ts); the React
// run leaves these out by their tag.

test(`the app shell loads under the post-migration CSP ${DIOXUS_ONLY}`, async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self' 'wasm-unsafe-eval'")
  await expect(page.locator('#app-shell')).toBeAttached()
})

// The must-fail check: an inline script is a violation, so the fixture must fail this test.
// Its body asserts nothing, so the fixture is the only thing that can fail it: if the CSP
// ever let the script run, or the fixture stopped reporting, the test would pass, and
// `test.fail()` would fail the run.
test(`the fixture fails a test that sees a violation ${DIOXUS_ONLY}`, async ({ page }) => {
  test.fail()
  await page.goto('/')
  // Returns once the page has seen the violation (or after a second without one). The
  // fixture's listener runs first, so its report is on the wire before this returns.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        document.addEventListener('securitypolicyviolation', () => resolve(), { once: true })
        setTimeout(resolve, 1000)
        const script = document.createElement('script')
        script.textContent = 'void 0'
        document.head.append(script)
      }),
  )
})
