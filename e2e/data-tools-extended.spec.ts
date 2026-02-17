import { expect, test } from '@playwright/test'

import { dataConversionData } from './helpers/fixtures'

test.describe('JSON to CSV Converter', () => {
  test('converts JSON array to CSV', async ({ page }) => {
    await page.goto('/tools/json-to-csv-converter')
    // Click the JSON → CSV button to open dialog
    await page.getByRole('button', { name: /JSON.*CSV/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(dataConversionData.jsonArray)

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('JSON to YAML Converter', () => {
  test('converts JSON to YAML', async ({ page }) => {
    await page.goto('/tools/json-to-yaml-converter')
    // Click the JSON → YAML button to open dialog
    await page.getByRole('button', { name: /JSON.*YAML/i }).first().click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(dataConversionData.jsonForYaml)

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('XML to JSON Converter', () => {
  test('converts XML to JSON', async ({ page }) => {
    await page.goto('/tools/xml-to-json-converter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(dataConversionData.xml)

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('TOML to JSON Converter', () => {
  test('converts TOML to JSON', async ({ page }) => {
    await page.goto('/tools/toml-to-json-converter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(dataConversionData.toml)

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('HTML to Markdown Converter', () => {
  test('converts HTML to Markdown', async ({ page }) => {
    await page.goto('/tools/html-to-markdown-converter')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea').first()
    await input.fill(dataConversionData.htmlForMd)

    const output = dialog.locator('textarea').nth(1)
    await expect(output).not.toHaveValue('', { timeout: 3000 })
  })
})

test.describe('Number Base Converter', () => {
  test('converts decimal to other bases', async ({ page }) => {
    await page.goto('/tools/number-base-converter')
    // No dialog - renders directly, fill decimal input
    const decimalInput = page.locator('input[name="decimal"]')
    await expect(decimalInput).toBeVisible({ timeout: 5000 })
    await decimalInput.fill('42')

    // Should show hex output "2a"
    const hexInput = page.locator('input[name="hex"]')
    await expect(hexInput).toHaveValue('2a', { timeout: 3000 })
  })
})
