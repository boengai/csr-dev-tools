import { expect, test } from '@playwright/test'

import { card, toast } from './helpers/selectors'

test.describe('Placeholder Image Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/placeholder-image-generator')
    await expect(page.locator('input[name="placeholder-width"]')).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'Placeholder Image Generator')).toBeVisible()
    await expect(
      page.getByText('Generate placeholder images with custom dimensions, colors, and text.'),
    ).toBeVisible()
  })

  test('shows preview image with default dimensions', async ({ page }) => {
    const preview = page.locator('img[alt*="Placeholder image preview"]')
    await expect(preview).toBeVisible({ timeout: 3000 })
    await expect(preview).toHaveAttribute('alt', /800x600/)
  })

  test('updates preview when width and height are changed', async ({ page }) => {
    const widthInput = page.locator('input[name="placeholder-width"]')
    const heightInput = page.locator('input[name="placeholder-height"]')

    await widthInput.clear()
    await widthInput.fill('400')
    await heightInput.clear()
    await heightInput.fill('300')

    const preview = page.locator('img[alt*="Placeholder image preview"]')
    await expect(preview).toHaveAttribute('alt', /400x300/, { timeout: 3000 })
  })

  test('updates preview when background color is changed', async ({ page }) => {
    const bgPicker = page.getByLabel('Background color picker')
    await bgPicker.fill('#ff0000')

    const preview = page.locator('img[alt*="Placeholder image preview"]')
    await expect(preview).toHaveAttribute('alt', /background #ff0000/, { timeout: 3000 })
  })

  test('updates preview when custom text is entered', async ({ page }) => {
    const textInput = page.locator('input[name="placeholder-text"]')
    await textInput.fill('Hello World')

    const preview = page.locator('img[alt*="Placeholder image preview"]')
    await expect(preview).toHaveAttribute('alt', /Hello World/, { timeout: 3000 })
  })

  test('selects a preset and populates dimensions', async ({ page }) => {
    await page.locator('[role="combobox"]').click()
    await page.locator('[role="option"]').filter({ hasText: /^Banner/ }).click()

    const widthInput = page.locator('input[name="placeholder-width"]')
    const heightInput = page.locator('input[name="placeholder-height"]')

    await expect(widthInput).toHaveValue('1200', { timeout: 3000 })
    await expect(heightInput).toHaveValue('630', { timeout: 3000 })
  })

  test('Download PNG triggers download with toast', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download PNG' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('placeholder-800x600.png')
    await expect(toast.message(page, 'Downloaded placeholder-800x600.png')).toBeVisible({ timeout: 3000 })
  })

  test('Download SVG triggers download with toast', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download SVG' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('placeholder-800x600.svg')
    await expect(toast.message(page, 'Downloaded placeholder-800x600.svg')).toBeVisible({ timeout: 3000 })
  })

  test('mobile viewport shows responsive layout', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    const preview = page.locator('img[alt*="Placeholder image preview"]')
    await expect(preview).toBeVisible({ timeout: 3000 })

    const widthInput = page.locator('input[name="placeholder-width"]')
    await expect(widthInput).toBeVisible()
  })
})
