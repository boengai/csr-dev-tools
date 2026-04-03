import { expect, test } from '@playwright/test'

const SAMPLE_PROTO = `syntax = "proto3";

message Person {
  string name = 1;
  int32 age = 2;
  bool active = 3;
}`

test.describe('Protobuf Codec', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/protobuf-codec')
  })

  test('action selection opens encode dialog', async ({ page }) => {
    await page.getByRole('button', { name: /^Encode$/ }).click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.getByText('Protobuf Encode')).toBeVisible()
  })

  test('action selection opens decode dialog', async ({ page }) => {
    await page.getByRole('button', { name: /^Decode$/ }).click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.getByText('Protobuf Decode')).toBeVisible()
  })

  test('schema parsing populates message type dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /^Encode$/ }).click()

    const schemaInput = page.locator('[role="dialog"] .cm-content')
    await schemaInput.click()
    await page.keyboard.type(SAMPLE_PROTO)

    const dropdown = page.locator('#message-type-select')
    await expect(dropdown).toBeVisible({ timeout: 5000 })
    await expect(dropdown.locator('option')).toHaveCount(1)
    await expect(dropdown.locator('option').first()).toHaveText('Person')
  })

  test('encode happy path produces output', async ({ page }) => {
    await page.getByRole('button', { name: /^Encode$/ }).click()

    const schemaInput = page.locator('[role="dialog"] .cm-content')
    await schemaInput.click()
    await page.keyboard.type(SAMPLE_PROTO)

    await expect(page.locator('#message-type-select')).toBeVisible({ timeout: 5000 })

    const sourceInput = page.locator('[role="dialog"] textarea').first()
    await sourceInput.fill('{"name": "Alice", "age": 30, "active": true}')

    const output = page.locator('[role="dialog"] pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 5000 })
  })

  test('decode happy path produces output', async ({ page }) => {
    // First encode to get valid data
    await page.getByRole('button', { name: /^Encode$/ }).click()

    const schemaInput = page.locator('[role="dialog"] .cm-content')
    await schemaInput.click()
    await page.keyboard.type(SAMPLE_PROTO)

    await expect(page.locator('#message-type-select')).toBeVisible({ timeout: 5000 })

    const sourceInput = page.locator('[role="dialog"] textarea').first()
    await sourceInput.fill('{"name": "Alice", "age": 30, "active": true}')

    const output = page.locator('[role="dialog"] pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 5000 })
    const encodedValue = await output.textContent()

    // Close dialog and open decode
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    await page.getByRole('button', { name: /^Decode$/ }).click()

    // Schema is shared state — already populated from encode step, no need to re-type
    const decodeSchemaInput = page.locator('[role="dialog"] .cm-content')
    await expect(decodeSchemaInput).toBeVisible()

    await expect(page.locator('#message-type-select')).toBeVisible({ timeout: 5000 })

    const decodeSourceInput = page.locator('[role="dialog"] textarea').first()
    await decodeSourceInput.fill(encodedValue ?? '')

    const decodeOutput = page.locator('[role="dialog"] pre[data-has-value]').first()
    await expect(decodeOutput).toBeVisible({ timeout: 5000 })
    await expect(decodeOutput).toContainText('Alice')
  })

  test('error toast on bad input', async ({ page }) => {
    await page.getByRole('button', { name: /^Decode$/ }).click()

    const schemaInput = page.locator('[role="dialog"] .cm-content')
    await schemaInput.click()
    await page.keyboard.type(SAMPLE_PROTO)

    await expect(page.locator('#message-type-select')).toBeVisible({ timeout: 5000 })

    const sourceInput = page.locator('[role="dialog"] textarea').first()
    await sourceInput.fill('!!!invalid-base64!!!')

    // Expect a toast error to appear
    const toast = page.locator('[role="status"]')
    await expect(toast).toBeVisible({ timeout: 5000 })
  })

  test('existing protobuf-to-json tool remains accessible', async ({ page }) => {
    await page.goto('/tools/protobuf-to-json')
    await expect(page.locator('text=Paste your .proto definition here')).toBeVisible({ timeout: 5000 })
  })

  test('encode dialog shows upload JSON button', async ({ page }) => {
    await page.getByRole('button', { name: /^Encode$/ }).click()
    await expect(page.getByRole('button', { name: /Upload JSON/ })).toBeVisible()
  })

  test('decode dialog shows upload .pb button', async ({ page }) => {
    await page.getByRole('button', { name: /^Decode$/ }).click()
    await expect(page.getByRole('button', { name: /Upload \.pb/ })).toBeVisible()
  })

  test('encode result shows download button when output exists', async ({ page }) => {
    await page.getByRole('button', { name: /^Encode$/ }).click()

    const schemaInput = page.locator('[role="dialog"] .cm-content')
    await schemaInput.click()
    await page.keyboard.type(SAMPLE_PROTO)

    await expect(page.locator('#message-type-select')).toBeVisible({ timeout: 5000 })

    const sourceInput = page.locator('[role="dialog"] textarea').first()
    await sourceInput.fill('{"name": "Alice", "age": 30, "active": true}')

    const output = page.locator('[role="dialog"] pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 5000 })

    const downloadBtn = page.getByRole('button', { name: /Download encoded result/ })
    await expect(downloadBtn).toBeEnabled()
  })

  test('decode result shows download button when output exists', async ({ page }) => {
    // First encode
    await page.getByRole('button', { name: /^Encode$/ }).click()

    const schemaInput = page.locator('[role="dialog"] .cm-content')
    await schemaInput.click()
    await page.keyboard.type(SAMPLE_PROTO)
    await expect(page.locator('#message-type-select')).toBeVisible({ timeout: 5000 })

    const sourceInput = page.locator('[role="dialog"] textarea').first()
    await sourceInput.fill('{"name": "Alice", "age": 30, "active": true}')

    const output = page.locator('[role="dialog"] pre[data-has-value]').first()
    await expect(output).toBeVisible({ timeout: 5000 })
    const encodedValue = await output.textContent()

    // Switch to decode
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    await page.getByRole('button', { name: /^Decode$/ }).click()

    await expect(page.locator('#message-type-select')).toBeVisible({ timeout: 5000 })

    const decodeSourceInput = page.locator('[role="dialog"] textarea').first()
    await decodeSourceInput.fill(encodedValue ?? '')

    const decodeOutput = page.locator('[role="dialog"] pre[data-has-value]').first()
    await expect(decodeOutput).toBeVisible({ timeout: 5000 })

    const downloadBtn = page.getByRole('button', { name: /Download decoded JSON/ })
    await expect(downloadBtn).toBeEnabled()
  })
})
