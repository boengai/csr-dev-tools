import { expect, test } from '@playwright/test'

import { copyButton, errorMessage, toast } from './helpers/selectors'

test.describe('Aspect Ratio Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/aspect-ratio-calculator')
    await expect(page.locator('input').first()).toBeVisible({ timeout: 5000 })
  })

  test('calculates height from width and ratio preset', async ({ page }) => {
    const widthInput = page.locator('input[name="width"]')
    await widthInput.fill('1920')

    // Select 16:9 preset
    await page.getByRole('button', { name: '16:9' }).click()

    const heightInput = page.locator('input[name="height"]')
    await expect(heightInput).toHaveValue('1080', { timeout: 3000 })
  })

  test('calculates ratio from width and height', async ({ page }) => {
    const widthInput = page.locator('input[name="width"]')
    const heightInput = page.locator('input[name="height"]')

    await widthInput.fill('1920')
    await heightInput.fill('1080')

    const ratioInput = page.locator('input[name="ratio"]')
    await expect(ratioInput).toHaveValue('16:9', { timeout: 3000 })
  })

  test('applies preset ratio', async ({ page }) => {
    const widthInput = page.locator('input[name="width"]')
    await widthInput.fill('1000')

    await page.getByRole('button', { name: '4:3' }).click()

    const heightInput = page.locator('input[name="height"]')
    await expect(heightInput).toHaveValue('750', { timeout: 3000 })
  })

  test('copy button triggers toast notification', async ({ page }) => {
    const widthInput = page.locator('input[name="width"]')
    await widthInput.fill('1920')

    await page.getByRole('button', { name: '16:9' }).click()
    await expect(page.locator('input[name="height"]')).toHaveValue('1080', { timeout: 3000 })

    await copyButton.byLabel(page, 'Height').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('locked dimension stays unchanged when ratio changes', async ({ page }) => {
    const widthInput = page.locator('input[name="width"]')
    const heightInput = page.locator('input[name="height"]')

    await widthInput.fill('1920')
    await page.getByRole('button', { name: '16:9' }).click()
    await expect(heightInput).toHaveValue('1080', { timeout: 3000 })

    // Lock width
    await page.getByTitle('Lock width').click()

    // Change ratio — width should stay 1920, height updates
    await page.getByRole('button', { name: '4:3' }).click()
    await expect(widthInput).toHaveValue('1920')
    await expect(heightInput).toHaveValue('1440', { timeout: 3000 })
  })

  test('shows error toast on invalid width', async ({ page }) => {
    const widthInput = page.locator('input[name="width"]')
    await widthInput.fill('abc')

    await expect(errorMessage.withText(page, 'Enter a valid width')).toBeVisible({ timeout: 3000 })
  })

  test('clearing width clears dependent fields', async ({ page }) => {
    const widthInput = page.locator('input[name="width"]')
    const heightInput = page.locator('input[name="height"]')

    await widthInput.fill('1920')
    await page.getByRole('button', { name: '16:9' }).click()
    await expect(heightInput).toHaveValue('1080', { timeout: 3000 })

    await widthInput.clear()
    await expect(heightInput).toHaveValue('')
  })
})
