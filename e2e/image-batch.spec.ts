import { expect, type Page, test } from '@playwright/test'

/** Draw a solid `width`×`height` PNG in the page and hand its bytes back to Node. */
const makePng = async (page: Page, width: number, height: number, color: string) => {
  const base64 = await page.evaluate(
    ([w, h, c]) => {
      const canvas = document.createElement('canvas')
      canvas.width = w as number
      canvas.height = h as number
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no 2d context')
      ctx.fillStyle = c as string
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/png').split(',')[1] ?? ''
    },
    [width, height, color] as const,
  )
  return Buffer.from(base64, 'base64')
}

const pickImages = async (page: Page, inputName: string, files: Array<{ name: string; buffer: Buffer }>) => {
  await page
    .locator(`input[name="${inputName}"]`)
    .setInputFiles(files.map((f) => ({ buffer: f.buffer, mimeType: 'image/png', name: f.name })))
}

test.describe('Image Resizer batch', () => {
  test('fits several images within the box and offers per-file + ZIP downloads', async ({ page }) => {
    const errors: Array<string> = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/tools/image-resizer')

    const wide = await makePng(page, 400, 200, '#e11d48')
    const tall = await makePng(page, 100, 300, '#2563eb')
    const small = await makePng(page, 50, 50, '#16a34a')

    await pickImages(page, 'images', [
      { buffer: wide, name: 'wide.png' },
      { buffer: tall, name: 'tall.png' },
    ])
    await pickImages(page, 'images-add', [{ buffer: small, name: 'small.png' }])

    const queue = page.getByRole('list', { name: 'Selected images' })
    await expect(queue.getByRole('listitem')).toHaveCount(3)
    await expect(page.getByRole('region', { name: 'Live preview' }).getByText(/^wide.png · 400 × 200 ·/)).toBeVisible()

    const run = page.getByRole('button', { name: 'Resize 3 images' })
    await expect(run).toBeDisabled()
    await page.getByLabel('Max width').fill('200')
    await page.getByLabel('Max height').fill('150')

    // Live preview follows the settings and the selected row before anything runs.
    const preview = page.getByRole('region', { name: 'Live preview' })
    await expect(preview.getByText(/^200 × 100 ·/)).toBeVisible()
    await page.getByRole('button', { name: 'Preview tall.png' }).click()
    await expect(preview.getByText(/^50 × 150 ·/)).toBeVisible()
    await page.getByLabel('Max height').fill('60')
    await expect(preview.getByText(/^20 × 60 ·/)).toBeVisible()
    await page.getByLabel('Max height').fill('150')
    await expect(preview.getByText(/^50 × 150 ·/)).toBeVisible()

    await run.click()

    const results = page.getByRole('list', { name: 'Results' })
    await expect(results.getByRole('listitem')).toHaveCount(3)
    await expect(results.getByText(/^200 × 100 ·/)).toBeVisible() // wide: width-bound
    await expect(results.getByText(/^50 × 150 ·/)).toBeVisible() // tall: height-bound
    await expect(results.getByText(/^50 × 50 ·/)).toBeVisible() // small: not enlarged

    const one = page.waitForEvent('download')
    await results.getByRole('button', { name: /^Download csr-dev-tools_wide_\d+\.png$/ }).click()
    expect((await one).suggestedFilename()).toMatch(/^csr-dev-tools_wide_\d+\.png$/)

    const zip = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download ZIP' }).click()
    expect((await zip).suggestedFilename()).toMatch(/^csr-dev-tools_resized_\d+\.zip$/)

    expect(errors).toEqual([])
  })
})

test.describe('Image Resizer exact size', () => {
  test('crops every image to exactly W×H, whatever its shape', async ({ page }) => {
    const errors: Array<string> = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/tools/image-resizer')

    await pickImages(page, 'images', [
      { buffer: await makePng(page, 400, 200, '#e11d48'), name: 'wide.png' },
      { buffer: await makePng(page, 100, 300, '#2563eb'), name: 'tall.png' },
    ])
    await page.getByRole('combobox', { name: 'Resize mode' }).click()
    await page.getByRole('option', { name: 'Exact — crop to fill' }).click()
    await page.getByLabel('Width', { exact: true }).fill('150')
    await page.getByLabel('Height', { exact: true }).fill('150')

    await expect(page.getByRole('region', { name: 'Live preview' }).getByText(/^150 × 150 ·/)).toBeVisible()
    await page.getByRole('button', { name: 'Resize 2 images' }).click()

    const results = page.getByRole('list', { name: 'Results' })
    await expect(results.getByText(/^150 × 150 ·/)).toHaveCount(2)
    expect(errors).toEqual([])
  })
})

test.describe('Image Converter batch', () => {
  test('converts several images, skips a broken one, and lists each result', async ({ page }) => {
    const errors: Array<string> = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/tools/image-converter')

    const a = await makePng(page, 120, 80, '#f59e0b')
    const b = await makePng(page, 60, 60, '#8b5cf6')

    await pickImages(page, 'images', [
      { buffer: a, name: 'a.png' },
      { buffer: Buffer.from('not really a png'), name: 'broken.png' },
    ])
    await pickImages(page, 'images-add', [{ buffer: b, name: 'b.png' }])
    await expect(page.getByRole('list', { name: 'Selected images' }).getByRole('listitem')).toHaveCount(3)

    await page.getByRole('button', { name: 'Convert 3 images' }).click()

    const results = page.getByRole('list', { name: 'Results' })
    await expect(results.getByRole('listitem')).toHaveCount(3)
    await expect(page.getByText(/2 of 3 images ready · 1 failed/)).toBeVisible()
    await expect(results.getByText(/^Failed:/)).toBeVisible()
    await expect(results.getByRole('button', { name: /^Download csr-dev-tools_a_\d+\.webp$/ })).toBeVisible()

    const zip = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download ZIP' }).click()
    expect((await zip).suggestedFilename()).toMatch(/^csr-dev-tools_converted_\d+\.zip$/)

    // Back to settings keeps the queue for another run.
    await page.getByRole('button', { name: 'Change settings' }).click()
    await expect(page.getByRole('list', { name: 'Selected images' }).getByRole('listitem')).toHaveCount(3)

    expect(errors).toEqual([])
  })
})
