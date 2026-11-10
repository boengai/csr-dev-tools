import { expect, test } from '@playwright/test'

import { codeInputIn, toolSurface } from './helpers/selectors'

// File Processor tools (FileProcessorShell): the route opens the dialog on its
// upload area, which holds the picker. The tile itself is a plain button.
const fileProcessorTools = [
  { name: 'Background Remover', route: '/tools/background-remover', upload: 'Select image to remove background' },
  { name: 'Favicon Generator', route: '/tools/favicon-generator', upload: 'Select image to generate favicons' },
  { name: 'Image Compressor', route: '/tools/image-compressor', upload: 'Select JPEG or WebP image' },
  { name: 'Image Converter', route: '/tools/image-converter', upload: 'Select images from your device' },
  { name: 'Image Cropper', route: '/tools/image-cropper', upload: 'Select image to crop' },
  { name: 'Image Resizer', route: '/tools/image-resizer', upload: 'Select images from your device' },
  { name: 'Image to Base64', route: '/tools/image-to-base64', upload: 'Select image to encode' },
  {
    name: 'Splash Screen Generator',
    route: '/tools/splash-screen-generator',
    upload: 'Select image to generate splash screens',
  },
]

for (const tool of fileProcessorTools) {
  test.describe(tool.name, () => {
    test('opens on the upload area', async ({ page }) => {
      await page.goto(tool.route)
      const dialog = toolSurface(page)
      await expect(dialog).toBeVisible({ timeout: 5000 })
      const area = dialog.getByRole('region', { name: 'Upload area' })
      await expect(area).toBeVisible()
      await expect(area.getByRole('button', { name: tool.upload })).toBeVisible()
    })
  })
}

// Dialog auto-opens on these routes
const autoOpenDialogTools = [{ name: 'Image Color Picker', route: '/tools/image-color-picker' }]

for (const tool of autoOpenDialogTools) {
  test.describe(tool.name, () => {
    test('opens dialog on route', async ({ page }) => {
      await page.goto(tool.route)
      await expect(toolSurface(page)).toBeVisible({ timeout: 5000 })
    })
  })
}

test.describe('Base64 to Image', () => {
  test('shows the decoded image with its size as a notice', async ({ page }) => {
    await page.goto('/tools/base64-to-image')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 1×1 transparent PNG.
    await dialog
      .locator('textarea')
      .first()
      .fill('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
    await expect(dialog.locator('[data-slot="tool-output"] img')).toBeVisible({ timeout: 5000 })
    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('status')).toContainText('1×1 PNG')
  })

  test('shows bad Base64 in the status slot', async ({ page }) => {
    await page.goto('/tools/base64-to-image')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.locator('textarea').first().fill('!!!not-base64!!!')
    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('alert')).toHaveText(
      'Invalid Base64 image data',
      { timeout: 5000 },
    )
  })
})

test.describe('QR Code Generator', () => {
  test('generates QR code from text, with Copy SVG and Download in the label', async ({ page }) => {
    await page.goto('/tools/qr-code-generator')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.locator('input[name="dialog-source"]').fill('https://example.com')

    const output = dialog.locator('[data-slot="tool-output"]')
    await expect(output.getByRole('img', { name: 'QR Code' })).toBeVisible({ timeout: 3000 })
    await expect(output.getByRole('button', { name: 'Copy SVG to clipboard' })).toBeEnabled()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      output.getByRole('button', { name: 'Download QR Code' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('qr-code.png')
  })
})

test.describe('SVG Viewer', () => {
  test('previews pasted SVG and optimizes it', async ({ page }) => {
    await page.goto('/tools/svg-viewer')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.locator('.cm-editor').first()).toBeVisible()

    await codeInputIn.fill(
      page,
      dialog,
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">\n  <!-- a comment -->\n  <rect width="10" height="10"/>\n</svg>',
    )
    const output = dialog.locator('[data-slot="tool-output"]')
    // Not `rect` alone: the label's icons are SVG too.
    await expect(output.locator('rect[width="10"]')).toHaveCount(1, { timeout: 5000 })

    await dialog.getByRole('button', { name: 'Optimize' }).click()
    await expect(dialog.getByText(/^Optimized:/)).toBeVisible()
  })

  test('shows non-SVG input in the status slot', async ({ page }) => {
    await page.goto('/tools/svg-viewer')
    const dialog = toolSurface(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await codeInputIn.fill(page, dialog, '<div>not svg</div>')
    await expect(dialog.locator('[data-slot="tool-status"]').getByRole('alert')).toContainText('No <svg> element', {
      timeout: 5000,
    })
  })
})
