import { expect, test } from '@playwright/test'

test.describe('Box Shadow Generator', () => {
  test('renders with preview and CSS output', async ({ page }) => {
    await page.goto('/tools/box-shadow-generator')

    await expect(page.locator('code').filter({ hasText: 'box-shadow' })).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Border Radius Generator', () => {
  test('renders with preview and controls', async ({ page }) => {
    await page.goto('/tools/css-border-radius-generator')

    await expect(page.locator('pre').filter({ hasText: 'border-radius' })).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Gradient Generator', () => {
  test('renders with CSS gradient output', async ({ page }) => {
    await page.goto('/tools/css-gradient-generator')

    await expect(page.locator('code').filter({ hasText: 'gradient' })).toBeVisible({ timeout: 3000 })
  })
})
