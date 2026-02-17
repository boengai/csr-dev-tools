import { expect, test } from '@playwright/test'

test.describe('CSS Flexbox Playground', () => {
  test('shows flexbox preview and controls', async ({ page }) => {
    await page.goto('/tools/css-flexbox-playground')
    // No dialog - renders directly
    await expect(page.getByText(/flex/i).first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('CSS Grid Playground', () => {
  test('shows grid preview', async ({ page }) => {
    await page.goto('/tools/css-grid-playground')
    // No dialog - renders directly
    await expect(page.getByText(/grid/i).first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('CSS Animation Builder', () => {
  test('shows animation controls in dialog', async ({ page }) => {
    await page.goto('/tools/css-animation-builder')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await expect(dialog.getByText(/animation|keyframe|duration/i).first()).toBeVisible({ timeout: 3000 })
  })
})
