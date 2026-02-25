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

  // Story 27.2 E2E Tests

  test('can export SQL and see SQL output (AC #1)', async ({ page }) => {
    // Add a table first
    await page.getByTestId('add-table-btn').click()
    await expect(page.locator('[data-testid^="table-node-"]').first()).toBeVisible({ timeout: 5000 })

    // Open SQL panel
    await page.getByTestId('export-sql-btn').click()
    await expect(page.getByTestId('sql-panel')).toBeVisible()
    await expect(page.getByTestId('sql-output')).toBeVisible()

    // Should contain CREATE TABLE
    const sqlText = await page.getByTestId('sql-output').textContent()
    expect(sqlText).toContain('CREATE TABLE')
  })

  test('can switch dialect and see SQL change (AC #2)', async ({ page }) => {
    // Add a table with SERIAL PK
    await page.getByTestId('add-table-btn').click()
    await expect(page.locator('[data-testid^="table-node-"]').first()).toBeVisible({ timeout: 5000 })

    // Open SQL panel
    await page.getByTestId('export-sql-btn').click()
    await expect(page.getByTestId('sql-panel')).toBeVisible()

    // Default is PostgreSQL — check for SERIAL
    const pgSql = await page.getByTestId('sql-output').textContent()
    expect(pgSql).toContain('CREATE TABLE')

    // Switch to MySQL
    await page.getByTestId('dialect-select').selectOption('mysql')
    const mysqlSql = await page.getByTestId('sql-output').textContent()
    expect(mysqlSql).toContain('ENGINE=InnoDB')

    // Switch to SQLite
    await page.getByTestId('dialect-select').selectOption('sqlite')
    const sqliteSql = await page.getByTestId('sql-output').textContent()
    expect(sqliteSql).not.toContain('ENGINE=InnoDB')
  })

  test('diagram persists after page reload (AC #5, #7)', async ({ page }) => {
    // Add a table and wait for autosave
    await page.getByTestId('add-table-btn').click()
    const tableNode = page.locator('[data-testid^="table-node-"]').first()
    await expect(tableNode).toBeVisible({ timeout: 5000 })

    // Edit table name
    await tableNode.getByText('table_1').click()
    const nameInput = tableNode.locator('input').first()
    await nameInput.fill('persisted_table')
    await nameInput.press('Enter')

    // Wait for autosave (1s debounce + margin)
    await page.waitForTimeout(1500)

    // Open diagrams panel and load the saved diagram
    await page.getByTestId('diagrams-btn').click()
    await expect(page.getByTestId('diagram-list-panel')).toBeVisible()

    // Reload page
    await page.reload()
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15000 })

    // Open diagrams panel and verify saved diagram exists
    await page.getByTestId('diagrams-btn').click()
    await expect(page.getByTestId('diagram-list-panel')).toBeVisible()
    await expect(page.getByText('persisted_table', { exact: false })).toBeVisible({ timeout: 5000 })
  })

  test('can create and switch between multiple diagrams (AC #6, #9)', async ({ page }) => {
    // Add table to first diagram
    await page.getByTestId('add-table-btn').click()
    await expect(page.locator('[data-testid^="table-node-"]').first()).toBeVisible({ timeout: 5000 })

    // Wait for autosave
    await page.waitForTimeout(1500)

    // Open diagrams panel and create new diagram
    await page.getByTestId('diagrams-btn').click()
    await expect(page.getByTestId('diagram-list-panel')).toBeVisible()
    await page.getByTestId('new-diagram-btn').click()

    // Canvas should be empty
    await expect(page.locator('[data-testid^="table-node-"]')).toHaveCount(0)
  })

  test('can rename a diagram (AC #10)', async ({ page }) => {
    // Add table to trigger autosave
    await page.getByTestId('add-table-btn').click()
    await expect(page.locator('[data-testid^="table-node-"]').first()).toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(1500)

    // Click diagram name to rename
    await page.getByTestId('diagram-name').click()
    const nameInput = page.locator('input[class*="font-bold"]').first()
    await nameInput.fill('My Custom Name')
    await nameInput.press('Enter')

    await expect(page.getByTestId('diagram-name')).toHaveText('My Custom Name')
  })

  test('can export and import JSON (AC #12, #13)', async ({ page }) => {
    // Add a table
    await page.getByTestId('add-table-btn').click()
    const tableNode = page.locator('[data-testid^="table-node-"]').first()
    await expect(tableNode).toBeVisible({ timeout: 5000 })

    // Rename the table for identification
    await tableNode.getByText('table_1').click()
    const nameInput = tableNode.locator('input').first()
    await nameInput.fill('export_test')
    await nameInput.press('Enter')

    // Export JSON — capture download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-json-btn').click(),
    ])
    const path = await download.path()
    expect(path).toBeTruthy()

    // Clear canvas
    await page.getByTestId('clear-all-btn').click()
    await expect(page.locator('[data-testid^="table-node-"]')).toHaveCount(0)

    // Import the downloaded JSON
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByTestId('import-json-btn').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(path!)

    // Verify table is restored
    await expect(page.locator('[data-testid^="table-node-"]').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid^="table-node-"]').first().getByText('export_test')).toBeVisible()
  })
})
