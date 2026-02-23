import { expect, test } from '@playwright/test'

import { card, toast } from './helpers/selectors'

test.describe('Data URI Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/data-uri-generator')
    await expect(page.getByRole('button', { name: /select file to encode/i })).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'Data URI Generator')).toBeVisible()
    await expect(
      page.getByText('Convert files to data URIs and decode data URIs back to files.'),
    ).toBeVisible()
  })

  test('upload a small PNG image → dialog opens, data URI displayed, file size shown', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /select file to encode/i }).click()
    const fileChooser = await fileChooserPromise

    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    await fileChooser.setFiles({
      buffer: Buffer.from(pngBase64, 'base64'),
      mimeType: 'image/png',
      name: 'test.png',
    })

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByText('test.png — image/png')).toBeVisible()
    await expect(dialog.locator('textarea').first()).toBeVisible()
  })

  test('upload an image → HTML <img> tag section visible', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /select file to encode/i }).click()
    const fileChooser = await fileChooserPromise

    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    await fileChooser.setFiles({
      buffer: Buffer.from(pngBase64, 'base64'),
      mimeType: 'image/png',
      name: 'test.png',
    })

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByText('HTML <img> Tag')).toBeVisible()
  })

  test('upload an image → CSS url() section visible', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /select file to encode/i }).click()
    const fileChooser = await fileChooserPromise

    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    await fileChooser.setFiles({
      buffer: Buffer.from(pngBase64, 'base64'),
      mimeType: 'image/png',
      name: 'test.png',
    })

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByText('CSS url()')).toBeVisible()
  })

  test('click Decode button → dialog opens, paste data URI → MIME type and size displayed', async ({ page }) => {
    await page.getByRole('button', { name: /decode data uri/i }).click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const textarea = dialog.locator('textarea').first()
    await textarea.fill('data:text/plain;base64,SGVsbG8=')

    await expect(dialog.getByText('text/plain')).toBeVisible({ timeout: 3000 })
    await expect(dialog.getByText('base64')).toBeVisible()
  })

  test('paste image data URI in decode → image preview shown', async ({ page }) => {
    await page.getByRole('button', { name: /decode data uri/i }).click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const pngDataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const textarea = dialog.locator('textarea').first()
    await textarea.fill(pngDataUri)

    await expect(dialog.locator('img').first()).toBeVisible({ timeout: 3000 })
  })

  test('decode mode → click Download → download triggers with toast', async ({ page }) => {
    await page.getByRole('button', { name: /decode data uri/i }).click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const textarea = dialog.locator('textarea').first()
    await textarea.fill('data:text/plain;base64,SGVsbG8=')

    await expect(dialog.getByText('text/plain')).toBeVisible({ timeout: 3000 })

    const downloadPromise = page.waitForEvent('download')
    await dialog.getByRole('button', { name: /download/i }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('decoded.txt')
    await expect(toast.message(page, 'Downloaded decoded.txt')).toBeVisible({ timeout: 3000 })
  })

  test('upload a file larger than 30KB → warning toast shown', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /select file to encode/i }).click()
    const fileChooser = await fileChooserPromise

    const largeBuffer = Buffer.alloc(31 * 1024, 0)
    await fileChooser.setFiles({
      buffer: largeBuffer,
      mimeType: 'application/octet-stream',
      name: 'large-file.bin',
    })

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(
      toast.message(page, 'File exceeds 30 KB — consider using a regular file reference for better performance'),
    ).toBeVisible({ timeout: 3000 })
  })

  test('mobile viewport responsiveness', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.getByRole('button', { name: /select file to encode/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /decode data uri/i })).toBeVisible()
  })
})
