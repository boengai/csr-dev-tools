import { expect, test } from '@playwright/test'

import { card, copyButton, toast } from './helpers/selectors'

test.describe('Chmod Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/chmod-calculator')
    await expect(page.getByPlaceholder('755')).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'Chmod Calculator')).toBeVisible()
    await expect(
      page.getByText(
        'Convert between symbolic (rwxr-xr-x), octal (755), and visual chmod notations. Toggle permissions with an interactive checkbox grid and common presets.',
      ),
    ).toBeVisible()
  })

  test('enter octal "755" → symbolic shows "rwxr-xr-x", checkbox grid matches', async ({ page }) => {
    // Default is already 755, verify state
    await expect(page.getByPlaceholder('755')).toHaveValue('755')
    await expect(page.getByPlaceholder('rwxr-xr-x')).toHaveValue('rwxr-xr-x')

    // Verify owner has all permissions checked
    await expect(page.getByLabel('owner read permission')).toBeChecked()
    await expect(page.getByLabel('owner write permission')).toBeChecked()
    await expect(page.getByLabel('owner execute permission')).toBeChecked()

    // Verify group has read and execute
    await expect(page.getByLabel('group read permission')).toBeChecked()
    await expect(page.getByLabel('group write permission')).not.toBeChecked()
    await expect(page.getByLabel('group execute permission')).toBeChecked()
  })

  test('enter octal "644" → symbolic shows "rw-r--r--", checkbox grid matches', async ({ page }) => {
    const octalInput = page.getByPlaceholder('755')
    await octalInput.fill('644')

    await expect(page.getByPlaceholder('rwxr-xr-x')).toHaveValue('rw-r--r--')

    // Owner: read, write only
    await expect(page.getByLabel('owner read permission')).toBeChecked()
    await expect(page.getByLabel('owner write permission')).toBeChecked()
    await expect(page.getByLabel('owner execute permission')).not.toBeChecked()

    // Group: read only
    await expect(page.getByLabel('group read permission')).toBeChecked()
    await expect(page.getByLabel('group write permission')).not.toBeChecked()
    await expect(page.getByLabel('group execute permission')).not.toBeChecked()
  })

  test('toggle checkbox (uncheck owner execute on 755) → octal updates to "655", symbolic updates', async ({
    page,
  }) => {
    // Uncheck owner execute (currently checked for 755)
    await page.getByLabel('owner execute permission').uncheck()

    await expect(page.getByPlaceholder('755')).toHaveValue('655')
    await expect(page.getByPlaceholder('rwxr-xr-x')).toHaveValue('rw-r-xr-x')
  })

  test('click preset "777" → all checked, octal shows "777", symbolic shows "rwxrwxrwx"', async ({ page }) => {
    await page.getByRole('button', { name: '777' }).click()

    await expect(page.getByPlaceholder('755')).toHaveValue('777')
    await expect(page.getByPlaceholder('rwxr-xr-x')).toHaveValue('rwxrwxrwx')

    // All checkboxes checked
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked()
    }
  })

  test('click preset "400" → octal shows "400", symbolic shows "r--------", only owner-read checked', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '400' }).click()

    await expect(page.getByPlaceholder('755')).toHaveValue('400')
    await expect(page.getByPlaceholder('rwxr-xr-x')).toHaveValue('r--------')

    await expect(page.getByLabel('owner read permission')).toBeChecked()
    await expect(page.getByLabel('owner write permission')).not.toBeChecked()
    await expect(page.getByLabel('owner execute permission')).not.toBeChecked()
    await expect(page.getByLabel('group read permission')).not.toBeChecked()
    await expect(page.getByLabel('other read permission')).not.toBeChecked()
  })

  test('enter symbolic "rw-r--r--" → octal shows "644", checkbox grid matches (AC #3)', async ({ page }) => {
    const symbolicInput = page.getByPlaceholder('rwxr-xr-x')
    await symbolicInput.fill('rw-r--r--')

    await expect(page.getByPlaceholder('755')).toHaveValue('644')

    // Owner: read, write only
    await expect(page.getByLabel('owner read permission')).toBeChecked()
    await expect(page.getByLabel('owner write permission')).toBeChecked()
    await expect(page.getByLabel('owner execute permission')).not.toBeChecked()

    // Group: read only
    await expect(page.getByLabel('group read permission')).toBeChecked()
    await expect(page.getByLabel('group write permission')).not.toBeChecked()
    await expect(page.getByLabel('group execute permission')).not.toBeChecked()
  })

  test('human-readable description shows for "755"', async ({ page }) => {
    await expect(
      page.getByText('Owner: read, write, execute | Group: read, execute | Other: read, execute'),
    ).toBeVisible()
  })

  test('CopyButton on command preview copies "chmod 755 filename"', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await copyButton.byLabel(page, 'chmod command').click()
    await expect(toast.copied(page)).toBeVisible({ timeout: 3000 })
  })

  test('mobile viewport (375px) responsiveness', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.getByPlaceholder('755')).toBeVisible()
    await expect(page.getByPlaceholder('rwxr-xr-x')).toBeVisible()
    await expect(page.getByLabel('owner read permission')).toBeVisible()

    // Preset buttons should be visible
    await expect(page.getByRole('button', { name: '755' })).toBeVisible()
  })
})
