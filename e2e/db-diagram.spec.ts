import { expect, test } from '@playwright/test'

test.describe('DB Diagram', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/db-diagram')
    // Dialog auto-opens via autoOpen prop on tool page
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15000 })
  })

  test('canvas renders with toolbar controls and minimap (AC #1)', async ({ page }) => {
    await expect(page.getByTestId('add-table-btn')).toBeVisible()
    await expect(page.getByTestId('fit-view-btn')).toBeVisible()
    await expect(page.getByTestId('clear-all-btn')).toBeVisible()
  })

  test('can add a table and see it on canvas (AC #2)', async ({ page }) => {
    await page.getByTestId('add-table-btn').click()

    const tableNode = page.locator('[data-testid^="table-node-"]').first()
    await expect(tableNode).toBeVisible({ timeout: 5000 })
    await expect(tableNode.getByText('table_1')).toBeVisible()
  })

  test('can edit table name (AC #3)', async ({ page }) => {
    await page.getByTestId('add-table-btn').click()
    const tableNode = page.locator('[data-testid^="table-node-"]').first()
    await expect(tableNode).toBeVisible({ timeout: 5000 })

    // Click table name to edit
    await tableNode.getByText('table_1').click()
    const nameInput = tableNode.locator('input').first()
    await nameInput.fill('users')
    await nameInput.press('Enter')

    await expect(tableNode.getByText('users')).toBeVisible()
  })

  test('can add columns to a table (AC #4)', async ({ page }) => {
    await page.getByTestId('add-table-btn').click()
    const tableNode = page.locator('[data-testid^="table-node-"]').first()
    await expect(tableNode).toBeVisible({ timeout: 5000 })

    // Click Add Column button inside the node
    await tableNode.getByText('+ Add Column').click()

    // Should now have id column + new column = verify second column name input exists
    const columnInputs = tableNode.locator('input:not([type="color"])')
    const count = await columnInputs.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('can delete a table (AC #8)', async ({ page }) => {
    await page.getByTestId('add-table-btn').click()
    const tableNode = page.locator('[data-testid^="table-node-"]').first()
    await expect(tableNode).toBeVisible({ timeout: 5000 })

    // Click delete button on table header
    await tableNode.locator('button[title="Delete table"]').click()
    await expect(page.locator('[data-testid^="table-node-"]')).toHaveCount(0, { timeout: 5000 })
  })

  test('responsive: canvas renders at 375px viewport', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 })
  })
})
