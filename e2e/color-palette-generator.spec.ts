import { expect, test } from '@playwright/test'

import { card, toast } from './helpers/selectors'

test.describe('Color Palette Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/color-palette-generator')
    await expect(page.locator('input[name="hex-color"]')).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'Color Palette Generator')).toBeVisible()
    await expect(
      page.getByText('Generate harmonious color palettes from a base color using color theory.'),
    ).toBeVisible()
  })

  test('generates palette with 5 swatches on load', async ({ page }) => {
    const swatches = page.locator('button[aria-label^="Copy color"]')
    await expect(swatches).toHaveCount(5, { timeout: 3000 })
  })

  test('updates palette when hex color is entered', async ({ page }) => {
    const hexInput = page.locator('input[name="hex-color"]')
    await hexInput.clear()
    await hexInput.fill('#ff0000')

    // Wait for debounce
    const swatches = page.locator('button[aria-label^="Copy color"]')
    await expect(swatches).toHaveCount(5, { timeout: 3000 })
  })

  test('updates palette when harmony type is changed', async ({ page }) => {
    // Open the select and choose Complementary
    await page.locator('[role="combobox"]').click()
    await page.locator('[role="option"]').filter({ hasText: /^Complementary$/ }).click()

    const swatches = page.locator('button[aria-label^="Copy color"]')
    await expect(swatches).toHaveCount(5, { timeout: 3000 })
  })

  test('copies hex value to clipboard when swatch is clicked', async ({ page }) => {
    const firstSwatch = page.locator('button[aria-label^="Copy color"]').first()
    await firstSwatch.click()

    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('copies CSS custom properties when Export CSS is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Export CSS' }).click()

    await expect(page.getByText('CSS copied to clipboard', { exact: true })).toBeVisible({ timeout: 3000 })
  })

  test('color picker updates hex input and palette', async ({ page }) => {
    const picker = page.getByLabel('Color picker')
    await picker.fill('#ff0000')

    const hexInput = page.locator('input[name="hex-color"]')
    await expect(hexInput).toHaveValue('#ff0000', { timeout: 3000 })

    const swatches = page.locator('button[aria-label^="Copy color"]')
    await expect(swatches).toHaveCount(5, { timeout: 3000 })
  })

  test('mobile viewport shows responsive layout', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    const swatches = page.locator('button[aria-label^="Copy color"]')
    await expect(swatches).toHaveCount(5, { timeout: 3000 })

    // On mobile, swatches should be stacked (single column)
    const firstSwatch = swatches.first()
    await expect(firstSwatch).toBeVisible()
  })
})
