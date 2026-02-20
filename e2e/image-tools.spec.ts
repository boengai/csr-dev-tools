import { expect, test } from '@playwright/test'

// Non-dialog image tools
const nonDialogImageTools = [
  { name: 'Image Compressor', route: '/tools/image-compressor' },
  { name: 'Image Converter', route: '/tools/image-converter' },
]

for (const tool of nonDialogImageTools) {
  test.describe(tool.name, () => {
    test('shows upload area', async ({ page }) => {
      await page.goto(tool.route)
      await expect(page.getByRole('button', { name: /select/i }).first()).toBeVisible({ timeout: 5000 })
    })
  })
}

// Image tools with upload button visible on page (dialog opens after upload)
const uploadOnPageTools = [
  { name: 'Image Cropper', route: '/tools/image-cropper' },
  { name: 'Image Resizer', route: '/tools/image-resizer' },
]

for (const tool of uploadOnPageTools) {
  test.describe(tool.name, () => {
    test('shows upload button', async ({ page }) => {
      await page.goto(tool.route)
      await expect(page.getByRole('button', { name: /select/i }).first()).toBeVisible({ timeout: 5000 })
    })
  })
}

// Dialog auto-opens on these routes
const autoOpenDialogTools = [
  { name: 'Image to Base64', route: '/tools/image-to-base64' },
  { name: 'Favicon Generator', route: '/tools/favicon-generator' },
  { name: 'Image Color Picker', route: '/tools/image-color-picker' },
]

for (const tool of autoOpenDialogTools) {
  test.describe(tool.name, () => {
    test('opens dialog on route', async ({ page }) => {
      await page.goto(tool.route)
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    })
  })
}

test.describe('Base64 to Image', () => {
  test('shows textarea input in dialog', async ({ page }) => {
    await page.goto('/tools/base64-to-image')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.locator('textarea').first()).toBeVisible()
  })
})

test.describe('QR Code Generator', () => {
  test('generates QR code from text', async ({ page }) => {
    await page.goto('/tools/qr-code-generator')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('input, textarea').first()
    await input.fill('https://example.com')

    await expect(dialog.locator('canvas, img, svg').first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('SVG Viewer', () => {
  test('shows textarea for SVG input in dialog', async ({ page }) => {
    await page.goto('/tools/svg-viewer')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.locator('textarea').first()).toBeVisible()
  })
})

test.describe('Background Remover', () => {
  test('shows upload button for background removal', async ({ page }) => {
    await page.goto('/tools/background-remover')
    await expect(page.getByText('Select image to remove background')).toBeVisible({ timeout: 5000 })
  })
})
