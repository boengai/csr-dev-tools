import { expect, type Page, test } from '@playwright/test'

// Throwaway check for the spike's head helper (dioxus/app/src/head.rs): client-side
// navigation edits the stamped tags in place, so each kind stays single and
// matches what the stamped page for that tool carries.

const TAGS = [
  'title',
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:url"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
  'link[rel="canonical"]',
] as const

const readHead = (page: Page) =>
  page.evaluate(
    (selectors) =>
      selectors.map((s) => {
        const all = document.head.querySelectorAll(s)
        const el = all[0]
        const value = s === 'title' ? document.title : (el?.getAttribute('content') ?? el?.getAttribute('href') ?? null)
        return { count: all.length, selector: s, value }
      }),
    [...TAGS],
  )

/** The head a fresh load of `path` gets from the stamped HTML file. */
const stampedHead = async (page: Page, path: string) => {
  await page.goto(path)
  await expect(page.locator('h1')).toBeVisible()
  return readHead(page)
}

test('client-side navigation leaves exactly the stamped tags of the current page', async ({ page }) => {
  const hash = await stampedHead(page, '/tools/hash-generator/')
  const json = await stampedHead(page, '/tools/escaped-json-stringifier/')
  const home = await stampedHead(page, '/')

  for (const tag of [...hash, ...json, ...home]) expect(tag.count, tag.selector).toBe(1)
  expect(hash.find((t) => t.selector === 'title')?.value).toBe('Hash Generator - CSR Dev Tools')

  // Home → Hash Generator → Escaped JSON Stringifier → home, without a page load.
  await page.getByRole('link', { name: 'Hash Generator' }).click()
  await expect(page.locator('h1')).toHaveText('Hash Generator')
  expect(await readHead(page)).toEqual(hash)

  await page.evaluate(() => {
    history.pushState({}, '', '/tools/escaped-json-stringifier')
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.locator('h1')).toHaveText('Escaped JSON Stringifier')
  // The stamped file carries the canonical path with no trailing slash, as React's does.
  expect(await readHead(page)).toEqual(json)

  await page.getByRole('link', { name: 'Back to home' }).click()
  await expect(page.locator('h1')).toHaveText(/Dioxus spike/)
  expect(await readHead(page)).toEqual(home)
})

test('leaving a deep-linked tool restores the home page tags, not the tool page ones', async ({ page }) => {
  const home = await stampedHead(page, '/')
  await stampedHead(page, '/tools/image-converter/')
  await page.getByRole('link', { name: 'Back to home' }).click()
  await expect(page.locator('h1')).toHaveText(/Dioxus spike/)
  expect(await readHead(page)).toEqual(home)
})
