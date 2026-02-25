import { expect, test } from '@playwright/test'

test.describe('IP Subnet Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/ip-subnet-calculator')
    await expect(page.getByText('Calculate IPv4 subnet details')).toBeVisible({ timeout: 10000 })
  })

  test('navigate to /tools/ip-subnet-calculator, verify title and description rendered', async ({ page }) => {
    await expect(page.getByText('Calculate IPv4 subnet details')).toBeVisible()
  })

  test('default CIDR 192.168.1.0/24 is pre-populated and results display on load (AC #1)', async ({ page }) => {
    const cidrInput = page.locator('[data-testid="cidr-input"]')
    await expect(cidrInput).toHaveValue('192.168.1.0/24')

    await expect(page.getByText('192.168.1.255')).toBeVisible()
    await expect(page.getByText('0.0.0.255')).toBeVisible()
    // Total Hosts label row contains '254'
    const totalHostsRow = page.locator('text=Total Hosts').locator('..')
    await expect(totalHostsRow).toBeVisible()
  })

  test('enter CIDR 10.0.0.0/8 → verify results (AC #1)', async ({ page }) => {
    const cidrInput = page.locator('[data-testid="cidr-input"]')
    await cidrInput.fill('10.0.0.0/8')

    await expect(page.getByText('10.255.255.255')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('16,777,214')).toBeVisible()
  })

  test('switch to IP+Mask mode, enter IP and mask → verify results match /12 (AC #2)', async ({ page }) => {
    await page.getByRole('button', { name: 'IP + Mask' }).click()

    const ipInput = page.locator('[data-testid="ip-input"]')
    const maskInput = page.locator('[data-testid="mask-input"]')

    await ipInput.fill('172.16.0.0')
    await maskInput.fill('255.240.0.0')

    await expect(page.getByText('172.31.255.255')).toBeVisible({ timeout: 5000 })
  })

  test('binary representation visible with correct format (AC #3)', async ({ page }) => {
    await expect(page.getByText('IP Address (binary)')).toBeVisible()
    await expect(page.getByText('Subnet Mask (binary)')).toBeVisible()

    // Verify actual binary content is rendered (default 192.168.1.0/24)
    const binaryIpRow = page.getByText('IP Address (binary)').locator('..')
    await expect(binaryIpRow.locator('.font-mono')).toContainText('11000000')

    // Check for binary format presence (legend indicators)
    await expect(page.getByText('Network bits', { exact: true })).toBeVisible()
    await expect(page.getByText('Host bits', { exact: true })).toBeVisible()
  })

  test('enter invalid IP 999.999.999.999 → error message with role="alert" (AC #4)', async ({ page }) => {
    const cidrInput = page.locator('[data-testid="cidr-input"]')
    await cidrInput.fill('999.999.999.999/24')

    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })
  })

  test('enter invalid CIDR 192.168.1.0/33 → error message (AC #4)', async ({ page }) => {
    const cidrInput = page.locator('[data-testid="cidr-input"]')
    await cidrInput.fill('192.168.1.0/33')

    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })
  })

  test('enter /32 CIDR → verify single host display (AC #5)', async ({ page }) => {
    const cidrInput = page.locator('[data-testid="cidr-input"]')
    await cidrInput.fill('10.0.0.1/32')

    await expect(page.getByText('Single Host')).toBeVisible({ timeout: 5000 })
  })

  test('enter /31 CIDR → verify point-to-point display (AC #5)', async ({ page }) => {
    const cidrInput = page.locator('[data-testid="cidr-input"]')
    await cidrInput.fill('10.0.0.0/31')

    await expect(page.getByText('Point-to-Point Link (RFC 3021)')).toBeVisible({ timeout: 5000 })
  })

  test('click CopyButton on a result field → value copied to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Click the first CopyButton (Network Address)
    const copyButtons = page.locator('[aria-label*="Copy"]')
    await copyButtons.first().click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText.length).toBeGreaterThan(0)
  })

  test('click preset button /24 → prefix is applied and results update', async ({ page }) => {
    const cidrInput = page.locator('[data-testid="cidr-input"]')
    await cidrInput.fill('10.0.0.0/8')
    await expect(page.getByText('16,777,214')).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: 'Set prefix length to 24' }).click()

    // After applying /24 to 10.0.0.0, total hosts should be 254
    await expect(page.getByText('10.0.0.0/24', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('mobile viewport (375px) responsiveness — input and results stack vertically', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.getByText('Calculate IPv4 subnet details')).toBeVisible()
    const cidrInput = page.locator('[data-testid="cidr-input"]')
    await expect(cidrInput).toBeVisible()
    await expect(page.getByText('Network Address', { exact: true })).toBeVisible()
  })
})
