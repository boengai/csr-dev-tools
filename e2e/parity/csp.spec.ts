import { expect, test } from '@playwright/test'

import { DIOXUS_ONLY } from './tags'

// The CSP fixture's own checks (docs/quality/gates.md → "CSP"). The Dioxus run
// resolves `@playwright/test` to the fixture (e2e/parity/csp.ts); the React
// run leaves these out by their tag.

test(`the app shell loads under the post-migration CSP ${DIOXUS_ONLY}`, async ({ page }) => {
  // Without the header, the must-fail test below would fail on its own assertion, not on the fixture.
  const response = await page.goto('/')
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self' 'wasm-unsafe-eval'")
  await expect(page.locator('#app-shell')).toBeAttached()
})

// The must-fail fixture: an inline script is a violation, so the fixture must fail this test.
test(`the fixture fails a test that sees a violation ${DIOXUS_ONLY}`, async ({ page }) => {
  test.fail()
  await page.goto('/')
  await page.evaluate(() => {
    const script = document.createElement('script')
    script.textContent = 'window.inlineRan = true'
    document.head.append(script)
  })
  await expect.poll(() => page.evaluate(() => 'inlineRan' in window)).toBe(false)
})
