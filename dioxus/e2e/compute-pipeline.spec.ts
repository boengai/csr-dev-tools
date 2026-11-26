import { expect, test } from '@playwright/test'

// The tool computation pipeline invariants (CONTEXT.md) that the spike's
// review found broken in the Dioxus shells: only the last value computes, an
// empty input clears at once, and a mode switch never computes one mode over
// the other mode's text.

const SHA256_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

test('typing back to the settled value cancels the value typed in between', async ({ page }) => {
  await page.goto('/tools/hash-generator/')
  const input = page.locator('textarea[name="dialog-source"]')
  const output = page.locator('[data-slot="tool-surface"] pre[data-has-value]')
  await input.fill('abc')
  await expect(output).toHaveText(SHA256_ABC)

  await input.press('End')
  await input.press('d')
  await input.press('Backspace')
  // Past the 300 ms debounce: "abcd" must never have settled.
  await page.waitForTimeout(700)
  await expect(output).toHaveText(SHA256_ABC)
})

test('clearing the input clears the output without waiting for the debounce', async ({ page }) => {
  await page.goto('/tools/hash-generator/')
  const input = page.locator('textarea[name="dialog-source"]')
  const output = page.locator('[data-slot="tool-surface"] pre[data-has-value]')
  await input.fill('abc')
  await expect(output).toHaveCount(1)
  await input.fill('')
  // Well inside the 300 ms debounce.
  await expect(output).toHaveCount(0, { timeout: 150 })
})

test('switching mode never shows the other mode’s input as an error', async ({ page }) => {
  await page.goto('/tools/escaped-json-stringifier/')
  await page.locator('.cm-content').click()
  await page.keyboard.insertText('{"name":"John"}')
  await expect(page.locator('pre[data-has-value]')).toHaveCount(1)

  // Record any alert that appears, however briefly.
  await page.evaluate(() => {
    const seen: Array<string> = []
    ;(window as unknown as { __alerts: Array<string> }).__alerts = seen
    new MutationObserver(() => {
      for (const el of document.querySelectorAll('[role="alert"]')) seen.push(el.textContent ?? '')
    }).observe(document.body, { childList: true, subtree: true, characterData: true })
  })
  await page.getByRole('button', { name: 'Parse Escaped JSON mode' }).click()
  await page.waitForTimeout(700)
  expect(await page.evaluate(() => (window as unknown as { __alerts: Array<string> }).__alerts)).toEqual([])
})
