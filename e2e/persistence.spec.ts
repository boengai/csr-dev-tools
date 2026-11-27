import { expect, type Page, test } from '@playwright/test'

import { toolSurface } from './helpers/selectors'
import { EDIT, readGolden, readKeyList, readStorage, seedStorage, typeAtEnd } from './stored-values/contract.ts'
import { DRIVERS, expectStored } from './stored-values/drivers.ts'

/**
 * The persistence journeys of the stored-value contract (ADR-0032 Decision 8,
 * e2e/stored-values/README.md). Each seeds a value React wrote, checks it
 * shows, edits it, and checks the stored text keeps React's shape. They read
 * the page only through the DOM contract of docs/ux/parity.md (on develop), so they run
 * unchanged against the Dioxus build: that is the rollback proof.
 */

const golden = readGolden()
const { keys, neverSaved } = readKeyList()
const listed = new Set(keys.map(({ key }) => key))

const currentShape = (key: string) => {
  const entry = golden.entries.find((e) => e.key === key && e.shape === 'current')
  if (!entry) throw new Error(`golden.json has no current shape for ${key}`)
  return entry
}

/** A key the site writes must be on the key list. */
const expectOnlyListedKeys = async (page: Page): Promise<void> => {
  const written = Object.keys(await readStorage(page))
  expect(written.filter((key) => !listed.has(key))).toEqual([])
}

test.describe('Saved inputs', () => {
  for (const driver of DRIVERS) {
    test(`${driver.tool}: restores what React saved, and saves an edit in the same shape`, async ({ page }) => {
      const entries = driver.keys.map(currentShape)
      const restored = Object.fromEntries(entries.map((e) => [e.key, e.expected]))
      await seedStorage(page, Object.assign({}, ...entries.map((e) => e.stored)))

      await page.goto(driver.route)
      await driver.ready(page)
      await driver.shows(page, restored)

      await driver.edit(page, restored)
      await driver.checkEdited(page, restored)
      await expectOnlyListedKeys(page)
    })
  }

  test('mermaid-renderer: a DB Diagram handoff wins over the saved draft and is read once', async ({ page }) => {
    const handoff = 'erDiagram\n  users {\n    INT id\n  }'
    await seedStorage(page, {
      'csr-dev-tools-handoff-mermaid-renderer': handoff,
      'csr-dev-tools-mermaid-renderer': JSON.stringify({ source: 'flowchart LR\n  C --> D' }),
    })

    await page.goto('/tools/mermaid-renderer')
    const source = page.getByRole('textbox', { exact: true, name: 'Mermaid Syntax' })
    await expect(source).toContainText('erDiagram')
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('csr-dev-tools-handoff-mermaid-renderer')))
      .toBeNull()

    await typeAtEnd(page, source, EDIT)
    await expectStored(page, { 'csr-dev-tools-mermaid-renderer': { source: handoff + EDIT } })
    await expectOnlyListedKeys(page)
  })

  test('db-diagram: an unreadable store is backed up before the first save over it', async ({ page }) => {
    await seedStorage(page, { 'csr-dev-tools-db-diagrams': '{bad' })

    await page.goto('/tools/db-diagram')
    await page.getByTestId('add-table-btn').click()

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('csr-dev-tools-db-diagrams-corrupt-backup')), {
        timeout: 10_000,
      })
      .toBe('{bad')
    const store = await page.evaluate(
      () => JSON.parse(localStorage.getItem('csr-dev-tools-db-diagrams') ?? 'null') as unknown,
    )
    expect(store).toMatchObject({ diagrams: expect.any(Object), index: [expect.objectContaining({ tableCount: 1 })] })
    await expectOnlyListedKeys(page)
  })

  for (const { keys: allowed = [], tool } of neverSaved) {
    test(`${tool}: saves no input`, async ({ page }) => {
      await page.goto(`/tools/${tool}`)
      const surface = toolSurface(page)
      await expect(surface).toBeVisible()

      const fields = surface.getByRole('textbox')
      await expect(fields.first()).toBeVisible()
      for (const field of await fields.all()) {
        if (!(await field.isEditable())) continue
        await field.click()
        await page.keyboard.insertText('x')
      }
      // Leaving the page flushes any pending save.
      await page.goto('/')

      const written = Object.keys(await readStorage(page))
      expect(written.filter((key) => !allowed.includes(key))).toEqual([])
    })
  }
})
