import { expect, test } from '@playwright/test'

import { jwtData } from './helpers/fixtures'

test.describe('UUID Generator', () => {
  test('generates UUID on load', async ({ page }) => {
    await page.goto('/tools/uuid-generator')
    // No dialog - renders directly
    await expect(
      page.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i).first(),
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('JWT Decoder', () => {
  test('decodes JWT token', async ({ page }) => {
    await page.goto('/tools/jwt-decoder')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const input = dialog.locator('textarea, input').first()
    await input.fill(jwtData.token)

    await expect(dialog.getByText('John Doe').first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Regex Tester', () => {
  test('shows regex interface in dialog', async ({ page }) => {
    await page.goto('/tools/regex-tester')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Should have input fields for pattern and test string
    await expect(dialog.locator('input, textarea').first()).toBeVisible()
  })
})

test.describe('PX to REM', () => {
  test('converts px to rem', async ({ page }) => {
    await page.goto('/tools/px-to-rem')
    // No dialog - renders directly
    const input = page.locator('input').first()
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('16')

    await expect(page.getByText(/1/).first()).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Text Diff Checker', () => {
  test('shows diff interface in dialog', async ({ page }) => {
    await page.goto('/tools/text-diff-checker')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    const textareas = dialog.locator('textarea')
    await expect(textareas.first()).toBeVisible()
    await expect(textareas.nth(1)).toBeVisible()
  })
})

test.describe('String Escape/Unescape', () => {
  test('shows escape interface in dialog', async ({ page }) => {
    await page.goto('/tools/string-escape-unescape')
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await expect(dialog.locator('textarea').first()).toBeVisible()
  })
})

test.describe('Lorem Ipsum Generator', () => {
  test('generates lorem ipsum text on load', async ({ page }) => {
    await page.goto('/tools/lorem-ipsum-generator')
    // No dialog - renders directly
    await expect(page.getByText(/lorem|ipsum/i).first()).toBeVisible({ timeout: 5000 })
  })
})
