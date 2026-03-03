import { expect, test } from '@playwright/test'

/**
 * Helper: fill a CodeMirror editor identified by its wrapper data-testid.
 * Clicks the contenteditable `.cm-content` area and uses keyboard.insertText
 * to inject text (CodeMirror does not respond to normal .fill()).
 */
async function fillCodeInput(page: import('@playwright/test').Page, testId: string, text: string) {
  const cmEditor = page.getByTestId(testId).locator('.cm-content')
  await cmEditor.click()
  await page.keyboard.insertText(text)
}

/**
 * Helper: select a value in a Radix Select (combobox) that lives inside
 * the element identified by `parentTestId`.
 */
async function selectRadixOption(
  page: import('@playwright/test').Page,
  parentTestId: string,
  optionText: string,
) {
  const trigger = page.getByTestId(parentTestId).locator('[role="combobox"]')
  await trigger.click()
  await page.locator('[role="option"]').filter({ hasText: optionText }).click()
}

/**
 * Helper: clear the canvas by creating a new diagram via the diagram-list panel.
 * (The old `clear-all-btn` no longer exists.)
 */
async function createNewDiagram(page: import('@playwright/test').Page) {
  await page.getByTestId('diagrams-btn').click()
  await expect(page.getByTestId('diagram-list-panel')).toBeVisible()
  await page.getByTestId('new-diagram-btn').click()
}

test.describe('DB Diagram', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/db-diagram')
    // Dialog auto-opens via autoOpen prop on tool page
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15000 })
  })

  test('canvas renders with toolbar controls and minimap (AC #1)', async ({ page }) => {
    await expect(page.getByTestId('add-table-btn')).toBeVisible()
    await expect(page.getByTestId('fit-view-btn')).toBeVisible()
    await expect(page.getByTestId('diagrams-btn')).toBeVisible()
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

    // Click table name button to enter editing mode
    await tableNode.getByText('table_1').click()
    const nameInput = tableNode.locator('input[name="table-name"]')
    await expect(nameInput).toBeVisible({ timeout: 2000 })
    await nameInput.fill('users')
    // Blur the input to commit the name by clicking an innocuous toolbar button
    await page.getByTestId('fit-view-btn').click({ force: true })

    await expect(tableNode.getByText('users')).toBeVisible()
  })

  test('can add columns to a table (AC #4)', async ({ page }) => {
    await page.getByTestId('add-table-btn').click()
    const tableNode = page.locator('[data-testid^="table-node-"]').first()
    await expect(tableNode).toBeVisible({ timeout: 5000 })

    // Click Add Column button inside the node
    await tableNode.getByText('+ Add Column').click()

    // Should now have id column + new column = verify second column name input exists
    const columnInputs = tableNode.locator('input[name="column-name"]')
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

    // Open SQL panel via Export dropdown
    await page.getByTestId('export-dropdown-btn').click()
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

    // Open SQL panel via Export dropdown
    await page.getByTestId('export-dropdown-btn').click()
    await page.getByTestId('export-sql-btn').click()
    await expect(page.getByTestId('sql-panel')).toBeVisible()

    // Default is PostgreSQL -- check for CREATE TABLE
    const pgSql = await page.getByTestId('sql-output').textContent()
    expect(pgSql).toContain('CREATE TABLE')

    // Switch to MySQL via Radix Select
    await selectRadixOption(page, 'sql-panel', 'MySQL')
    const mysqlSql = await page.getByTestId('sql-output').textContent()
    expect(mysqlSql).toContain('ENGINE=InnoDB')

    // Switch to SQLite via Radix Select
    await selectRadixOption(page, 'sql-panel', 'SQLite')
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
    const nameInput = tableNode.locator('input[name="table-name"]')
    await expect(nameInput).toBeVisible({ timeout: 2000 })
    await nameInput.fill('persisted_table')
    // Blur the input to commit the name by clicking an innocuous toolbar button
    await page.getByTestId('fit-view-btn').click({ force: true })
    await expect(tableNode.getByText('persisted_table')).toBeVisible({ timeout: 3000 })

    // Wait for autosave to complete (3s debounce + confirmation toast)
    await expect(page.getByText('Diagram saved', { exact: true })).toBeVisible({ timeout: 8000 })

    // Reload page
    await page.reload()
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15000 })

    // Verify the table with the persisted name is restored on the canvas
    const restoredNode = page.locator('[data-testid^="table-node-"]').first()
    await expect(restoredNode).toBeVisible({ timeout: 5000 })
    await expect(restoredNode.getByText('persisted_table')).toBeVisible({ timeout: 5000 })
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
    const diagramNameInput = page.locator('input[name="diagram-name"]')
    await expect(diagramNameInput).toBeVisible({ timeout: 2000 })
    await diagramNameInput.fill('My Custom Name')
    // Blur the input to commit the name by clicking an innocuous toolbar button
    await page.getByTestId('fit-view-btn').click({ force: true })

    await expect(page.getByTestId('diagram-name')).toHaveText('My Custom Name')
  })

  // Story 27.3 E2E Tests

  test('can import SQL and see tables appear on canvas (AC #1, #2)', async ({ page }) => {
    await page.getByTestId('import-dropdown-btn').click()
    await page.getByTestId('import-sql-btn').click()
    await expect(page.getByTestId('import-sql-panel')).toBeVisible()

    await fillCodeInput(
      page,
      'code-input-import-sql-input',
      'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));\nCREATE TABLE posts (id INT PRIMARY KEY, user_id INT, FOREIGN KEY (user_id) REFERENCES users(id));',
    )
    await page.getByTestId('import-sql-submit').click()

    // Two table nodes should appear
    await expect(page.locator('[data-testid^="table-node-"]')).toHaveCount(2, { timeout: 5000 })
  })

  test('import SQL with errors shows partial results + error message (AC #4)', async ({ page }) => {
    await page.getByTestId('import-dropdown-btn').click()
    await page.getByTestId('import-sql-btn').click()
    await expect(page.getByTestId('import-sql-panel')).toBeVisible()

    await fillCodeInput(
      page,
      'code-input-import-sql-input',
      'CREATE TABLE valid_table (id INT PRIMARY KEY);\nTHIS IS INVALID SQL;',
    )
    await page.getByTestId('import-sql-submit').click()

    // Should import the valid table
    await expect(page.locator('[data-testid^="table-node-"]')).toHaveCount(1, { timeout: 5000 })

    // Should show errors
    await expect(page.getByTestId('import-sql-errors')).toBeVisible()
  })

  test('can export Mermaid and see valid output (AC #6)', async ({ page }) => {
    // Add a table first
    await page.getByTestId('add-table-btn').click()
    await expect(page.locator('[data-testid^="table-node-"]').first()).toBeVisible({ timeout: 5000 })

    // Open Mermaid panel via Export dropdown
    await page.getByTestId('export-dropdown-btn').click()
    await page.getByTestId('export-mermaid-btn').click()
    await expect(page.getByTestId('mermaid-panel')).toBeVisible()
    await expect(page.getByTestId('mermaid-output')).toBeVisible()

    const mermaidText = await page.getByTestId('mermaid-output').textContent()
    expect(mermaidText).toContain('erDiagram')
  })

  test('can export TypeScript and see valid output (AC #8)', async ({ page }) => {
    // Add a table first
    await page.getByTestId('add-table-btn').click()
    await expect(page.locator('[data-testid^="table-node-"]').first()).toBeVisible({ timeout: 5000 })

    // Open TypeScript panel via Export dropdown
    await page.getByTestId('export-dropdown-btn').click()
    await page.getByTestId('export-typescript-btn').click()
    await expect(page.getByTestId('typescript-panel')).toBeVisible()
    await expect(page.getByTestId('typescript-output')).toBeVisible()

    const tsText = await page.getByTestId('typescript-output').textContent()
    expect(tsText).toContain('export type')
  })

  test('can import JSON Schema and see tables appear on canvas (AC #10)', async ({ page }) => {
    await page.getByTestId('import-dropdown-btn').click()
    await page.getByTestId('import-json-schema-btn').click()
    await expect(page.getByTestId('import-json-schema-panel')).toBeVisible()

    await fillCodeInput(
      page,
      'code-input-import-json-schema-input',
      JSON.stringify({
        definitions: {
          User: {
            properties: { email: { type: 'string' }, id: { type: 'integer' }, name: { type: 'string' } },
            required: ['id', 'email'],
            type: 'object',
          },
        },
      }),
    )
    await page.getByTestId('import-json-schema-submit').click()

    await expect(page.locator('[data-testid^="table-node-"]')).toHaveCount(1, { timeout: 5000 })
  })

  test('import SQL with merge adds tables alongside existing (AC #5)', async ({ page }) => {
    // Add a table manually first
    await page.getByTestId('add-table-btn').click()
    await expect(page.locator('[data-testid^="table-node-"]')).toHaveCount(1, { timeout: 5000 })

    // Open import SQL panel via Import dropdown and enable merge
    await page.getByTestId('import-dropdown-btn').click()
    await page.getByTestId('import-sql-btn').click()
    await expect(page.getByTestId('import-sql-panel')).toBeVisible()
    await page.locator('#import-sql-merge').check()

    await fillCodeInput(
      page,
      'code-input-import-sql-input',
      'CREATE TABLE imported_table (id INT PRIMARY KEY);',
    )
    await page.getByTestId('import-sql-submit').click()

    // Should now have 2 tables (1 existing + 1 imported)
    await expect(page.locator('[data-testid^="table-node-"]')).toHaveCount(2, { timeout: 5000 })
  })

  test('can export and import JSON (AC #12, #13)', async ({ page }) => {
    // Add a table
    await page.getByTestId('add-table-btn').click()
    const tableNode = page.locator('[data-testid^="table-node-"]').first()
    await expect(tableNode).toBeVisible({ timeout: 5000 })

    // Rename the table for identification
    await tableNode.getByText('table_1').click()
    const nameInput = tableNode.locator('input[name="table-name"]')
    await expect(nameInput).toBeVisible({ timeout: 2000 })
    await nameInput.fill('export_test')
    // Blur the input to commit the name by clicking an innocuous toolbar button
    await page.getByTestId('fit-view-btn').click({ force: true })
    await expect(tableNode.getByText('export_test')).toBeVisible({ timeout: 3000 })

    // Export JSON via Export dropdown -- capture download
    await page.getByTestId('export-dropdown-btn').click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-json-btn').click(),
    ])
    const path = await download.path()
    expect(path).toBeTruthy()

    // Clear canvas by creating a new diagram
    await createNewDiagram(page)
    await expect(page.locator('[data-testid^="table-node-"]')).toHaveCount(0)

    // Import the downloaded JSON via Import dropdown
    await page.getByTestId('import-dropdown-btn').click()
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByTestId('import-json-btn').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(path!)

    // Verify table is restored
    await expect(page.locator('[data-testid^="table-node-"]').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid^="table-node-"]').first().getByText('export_test')).toBeVisible()
  })
})
