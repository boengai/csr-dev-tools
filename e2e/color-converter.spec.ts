import { expect, test } from '@playwright/test'

import { colors } from './helpers/fixtures'
import { card, copyButton, errorMessage, toast, toolInput } from './helpers/selectors'

test.describe('Color Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/color-converter')
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'Color Converter')).toBeVisible()
    await expect(
      page.getByText('Convert colors between HEX, RGB, HSL, OKLCH, LAB, and LCH formats'),
    ).toBeVisible()
  })

  test('converts hex to other color formats', async ({ page }) => {
    const hexInput = toolInput.byLabel(page, 'Hex')
    await hexInput.fill(colors.valid.hex)

    // Wait for debounce (150ms) and conversion
    await expect(toolInput.byLabel(page, 'RGB')).not.toHaveValue('', { timeout: 2000 })
    await expect(toolInput.byLabel(page, 'HSL')).not.toHaveValue('')
    await expect(toolInput.byLabel(page, 'OKLCH')).not.toHaveValue('')
    await expect(toolInput.byLabel(page, 'LAB')).not.toHaveValue('')
    await expect(toolInput.byLabel(page, 'LCH')).not.toHaveValue('')
  })

  test('shows error for invalid hex input', async ({ page }) => {
    const hexInput = toolInput.byLabel(page, 'Hex')
    await hexInput.fill(colors.invalid.hex)

    await expect(errorMessage.withText(page, 'Enter a valid hex color')).toBeVisible({ timeout: 2000 })
  })

  test('copy button triggers toast notification', async ({ page }) => {
    // The tool starts with a random color, so CopyButton should have a value
    await copyButton.byLabel(page, 'Hex').click()

    await expect(toast.copied(page)).toBeVisible({ timeout: 2000 })
  })

  test('color picker updates all format inputs', async ({ page }) => {
    const picker = page.getByLabel('Color picker')
    await picker.fill('#ff0000')

    await expect(toolInput.byLabel(page, 'Hex')).toHaveValue('#ff0000', { timeout: 2000 })
    await expect(toolInput.byLabel(page, 'RGB')).not.toHaveValue('')
  })
})
