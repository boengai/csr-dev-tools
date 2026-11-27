import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

import { toolSurface } from './helpers/selectors'

const fixturePath = (name: string): string =>
  fileURLToPath(new URL(`../src/test/fixtures/pdf/${name}`, import.meta.url))

/** Text of page 1, read back the way a PDF viewer would. */
const pageOneText = async (path: string): Promise<string> => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await readFile(path)), verbosity: 0 }).promise
  const content = await (await doc.getPage(1)).getTextContent()
  return content.items.map((item) => ('str' in item ? item.str : '')).join('')
}

test.describe('Combine PDF', () => {
  // #61: a file with only an owner password opens without one, so its
  // thumbnails always looked right. Only the downloaded pages were blank.
  for (const name of ['rc4-128.pdf', 'aes-256-objstm.pdf']) {
    test(`keeps the page content of ${name}, encrypted with an empty user password`, async ({ page }) => {
      await page.goto('/tools/combine-pdf')
      const dialog = toolSurface(page)
      await dialog.locator('input[type="file"]').setInputFiles(fixturePath(name))
      await expect(dialog.getByRole('img', { name: `${name} page 1` })).toBeVisible()

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        dialog.getByRole('button', { name: 'Download' }).click(),
      ])
      expect(await pageOneText(await download.path())).toBe('Encrypted fixture page one')
      await expect(dialog.getByText(/Skipped/)).toHaveCount(0)
    })
  }

  test('rejects a PDF that needs a password', async ({ page }) => {
    await page.goto('/tools/combine-pdf')
    const dialog = toolSurface(page)
    await dialog.locator('input[type="file"]').setInputFiles(fixturePath('locked.pdf'))
    await expect(dialog.getByText('Skipped 1 unsupported file: locked.pdf')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Download' })).toHaveCount(0)
  })
})
