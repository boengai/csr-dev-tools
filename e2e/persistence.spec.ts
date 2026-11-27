import { expect, type Page, test } from '@playwright/test'

import { TOOL_ROUTES } from '../src/constants/tool-routes'
import { toolSurface } from './helpers/selectors'
import { APP_WIDE } from './parity/tags'
import { parityToolFilter } from './parity/tools'
import {
  EDIT,
  readGolden,
  readKeyList,
  readStorage,
  readStoredJson,
  recordedWriteLog,
  recordedWrites,
  recordWrites,
  seedStorage,
  textOf,
  typeAtEnd,
} from './stored-values/contract.ts'
import { DRIVERS, expectStored } from './stored-values/drivers.ts'

/**
 * The persistence journeys of the stored-value contract (ADR-0032 Decision 8,
 * e2e/stored-values/README.md). Each seeds a value React wrote, checks it
 * shows, edits it, and checks the stored text keeps React's shape. They read
 * the page only through the DOM contract of docs/ux/parity.md (on develop), so they run
 * unchanged against the Dioxus build: that is the rollback proof.
 */

/**
 * A journey's title starts with the Tool's name, so a parity run filtered to
 * the ported Tools (`journeys.grep`, e2e/parity/config.ts) picks it up.
 */
const nameOf = (key: string): string => {
  // App-wide: every build has them, so a parity run filtered by Tool name still runs them (APP_WIDE).
  const app: Record<string, string> = { dashboard: `Dashboard layout ${APP_WIDE}`, settings: `Settings ${APP_WIDE}` }
  const name = TOOL_ROUTES.find((tool) => tool.key === key)?.name ?? app[key]
  if (!name) throw new Error(`no Tool or app feature named ${key}`)
  return name
}

/**
 * Skips a journey unless every Tool it opens is in this run (`PARITY_TOOLS`,
 * set by `defineParityConfig`). A title naming two Tools matches either
 * Tool's `journeys.grep`, so the name filter alone is not enough. The
 * dashboard and settings are app-wide, so always run.
 */
const requirePorted = (...tools: Array<string>): void => {
  const filter = parityToolFilter()
  const missing = tools.filter((tool) => !['dashboard', 'settings'].includes(tool) && filter && !filter.has(tool))
  test.skip(missing.length > 0, `not in this build: ${missing.join(', ')}`)
}

const golden = readGolden()
const { keys, neverSaved } = readKeyList()
/**
 * Keys the site may write in a normal visit. A legacy key it only reads
 * (`written: false`) is not one, and neither is a key written only in one
 * case the list names (JSONPath's put-back after a failed migration, which
 * its own journey forces).
 */
const listed = new Set(keys.filter(({ written }) => written === undefined || written === true).map(({ key }) => key))

const currentShape = (key: string) => {
  const entry = golden.entries.find((e) => e.key === key && e.shape === 'current')
  if (!entry) throw new Error(`golden.json has no current shape for ${key}`)
  return entry
}

/** A key the site writes must be on the key list. */
const writtenKeys = async (page: Page): Promise<Array<string>> => [
  ...new Set([...Object.keys(await readStorage(page)), ...(await recordedWrites(page))]),
]

/** A key the site writes must be on the key list, even one it deletes again (see `recordWrites`). */
const expectOnlyListedKeys = async (page: Page): Promise<void> => {
  const written = await writtenKeys(page)
  expect(written.filter((key) => !listed.has(key))).toEqual([])
}

test.describe('Saved inputs', () => {
  for (const driver of DRIVERS) {
    test(`${nameOf(driver.tool)}: restores what React saved, and saves an edit in the same shape`, async ({ page }) => {
      requirePorted(driver.tool)
      const entries = driver.keys.map(currentShape)
      const restored = Object.fromEntries(entries.map((e) => [e.key, e.expected]))
      await recordWrites(page)
      await seedStorage(page, Object.assign({}, ...entries.map((e) => e.stored)))

      await page.goto(driver.route)
      await driver.ready(page)
      await driver.shows(page, restored)

      await driver.edit(page, restored)
      await driver.checkEdited(page, restored)
      await expectOnlyListedKeys(page)
    })
  }

  test(`${nameOf('json-formatter')}: a field the Tool does not name is kept and saved back`, async ({ page }) => {
    requirePorted('json-formatter')
    const driver = DRIVERS.find((d) => d.tool === 'json-formatter')
    const entry = golden.entries.find((e) => e.id === 'json-formatter/extra-field')
    if (!driver || !entry) throw new Error('needs the json-formatter driver and its extra-field golden entry')
    const restored = { [entry.key]: entry.expected }
    expect(entry.expected).toHaveProperty('extra')
    await seedStorage(page, entry.stored)

    await page.goto(driver.route)
    await driver.ready(page)
    await driver.shows(page, restored)

    await driver.edit(page, restored)
    // The whole bag is compared, so a dropped `extra` fails here.
    await driver.checkEdited(page, restored)
  })

  test(`${nameOf('db-diagram')}: Open in ${nameOf('mermaid-renderer')} hands the diagram over through storage`, async ({
    context,
    page,
  }) => {
    requirePorted('db-diagram', 'mermaid-renderer')
    await recordWrites(context)
    await page.goto('/tools/db-diagram')
    await page.getByTestId('add-table-btn').click()
    await page.getByTestId('export-dropdown-btn').click()
    await page.getByTestId('export-mermaid-btn').click()
    await expect(page.getByTestId('mermaid-panel-output')).toContainText('erDiagram')
    const exported = await textOf(page.getByTestId('mermaid-panel-output'))
    const handoffKey = 'csr-dev-tools-handoff-mermaid-renderer'

    const [renderer] = await Promise.all([
      context.waitForEvent('page'),
      page.getByTestId('open-mermaid-renderer-btn').click(),
    ])
    // The renderer opens on the exported diagram, and the handoff is gone once read.
    // Line by line, so a handoff that loses the line breaks fails; indentation may differ.
    const lines = (text: string) =>
      text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    const source = renderer.getByRole('textbox', { exact: true, name: 'Mermaid Syntax' })
    await expect(source).toBeVisible()
    expect(lines(exported).length).toBeGreaterThan(1)
    await expect.poll(async () => lines(await textOf(source))).toEqual(lines(exported))
    // It is saved as the renderer's draft at once, before any edit.
    await expect
      .poll(async () => {
        const draft = (await readStoredJson(renderer, 'csr-dev-tools-mermaid-renderer')) as
          | { source?: string }
          | undefined
        return lines(draft?.source ?? '')
      })
      .toEqual(lines(exported))
    await expect.poll(() => renderer.evaluate((k) => localStorage.getItem(k), handoffKey)).toBeNull()
    // DB Diagram itself wrote the handoff, as the exported text: not the renderer's draft directly.
    const handoffWrites = (await recordedWriteLog(page)).filter(({ key }) => key === handoffKey)
    expect(handoffWrites.map(({ value }) => lines(value))).toEqual([lines(exported)])
    const draftWrites = (await recordedWriteLog(page)).filter(({ key }) => key === 'csr-dev-tools-mermaid-renderer')
    expect(draftWrites).toEqual([])
    await expectOnlyListedKeys(page)
    await expectOnlyListedKeys(renderer)
  })

  test(`${nameOf('mermaid-renderer')}: a ${nameOf('db-diagram')} handoff wins over the saved draft and is read once`, async ({
    page,
  }) => {
    requirePorted('mermaid-renderer')
    const handoff = 'erDiagram\n  users {\n    INT id\n  }'
    await seedStorage(page, {
      'csr-dev-tools-handoff-mermaid-renderer': handoff,
      'csr-dev-tools-mermaid-renderer': JSON.stringify({ source: 'flowchart LR\n  C --> D' }),
    })

    await recordWrites(page)
    await page.goto('/tools/mermaid-renderer')
    const source = page.getByRole('textbox', { exact: true, name: 'Mermaid Syntax' })
    await expect(source).toContainText('erDiagram')
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('csr-dev-tools-handoff-mermaid-renderer')))
      .toBeNull()
    // The handed-over diagram is saved as the draft at once, so a reload keeps it.
    await expectStored(page, { 'csr-dev-tools-mermaid-renderer': { source: handoff } })
    await page.reload()
    await expect(source).toContainText('erDiagram')

    await typeAtEnd(page, source, EDIT)
    await expectStored(page, { 'csr-dev-tools-mermaid-renderer': { source: handoff + EDIT } })
    await expectOnlyListedKeys(page)
  })

  test(`${nameOf('jsonpath-evaluator')}: when the migrated write fails, the old draft is put back`, async ({
    page,
  }) => {
    requirePorted('jsonpath-evaluator')
    const driver = DRIVERS.find((d) => d.tool === 'jsonpath-evaluator')
    const legacy = golden.entries.find((e) => e.id === 'jsonpath-evaluator/legacy-bag')
    if (!driver || !legacy) throw new Error('needs the jsonpath-evaluator driver and its legacy-bag golden entry')
    const legacyKey = 'csr-dev-tools-jsonpath-evaluator'
    await seedStorage(page, legacy.stored)
    // Storage refuses the new key, as a full quota would.
    await page.addInitScript(() => {
      const setItem = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if (this === localStorage && key === 'csr-dev-tools-jsonpath-evaluator-v2') {
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
        }
        setItem.call(this, key, value)
      }
    })

    await page.goto(driver.route)
    await driver.ready(page)
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), legacyKey)).toBe(legacy.stored[legacyKey])
    expect(await page.evaluate(() => localStorage.getItem('csr-dev-tools-jsonpath-evaluator-v2'))).toBeNull()
  })

  test(`${nameOf('base64-codec')}: a saved mode it does not know opens the first mode, with that mode's saved source`, async ({
    page,
  }) => {
    requirePorted('base64-codec')
    const driver = DRIVERS.find((d) => d.tool === 'base64-codec')
    const mode = golden.entries.find((e) => e.id === 'base64-codec/unknown-mode')
    const source = golden.entries.find((e) => e.id === 'base64-codec/unknown-mode-with-source')
    if (!driver || !mode || !source)
      throw new Error('needs the base64-codec driver and its unknown-mode golden entries')
    await seedStorage(page, source.stored)

    // Issue 15: this used to open the first mode with its saved source hidden.
    await page.goto(driver.route)
    await driver.ready(page)
    await driver.shows(page, { [mode.key]: mode.expected, [source.key]: source.expected })
  })

  test(`${nameOf('db-diagram')}: an unreadable store is backed up before the first save over it`, async ({ page }) => {
    requirePorted('db-diagram')
    await recordWrites(page)
    const unreadable = '{bad'
    await seedStorage(page, { 'csr-dev-tools-db-diagrams': unreadable })
    // Records the order of writes, so the backup is seen to land before the store is replaced.
    // Init scripts run in no set order, so the seed's own write may be recorded too; it is skipped.
    await page.addInitScript((seed: string) => {
      const setItem = Storage.prototype.setItem
      const order: Array<string> = []
      Object.defineProperty(window, 'storedValueWrites', { value: order })
      Storage.prototype.setItem = function (key: string, value: string) {
        if (this === localStorage && !(key === 'csr-dev-tools-db-diagrams' && value === seed)) order.push(key)
        setItem.call(this, key, value)
      }
    }, unreadable)
    const diagramWrites = () =>
      page.evaluate(() =>
        (window as unknown as { storedValueWrites: Array<string> }).storedValueWrites.filter((k) =>
          k.startsWith('csr-dev-tools-db-diagrams'),
        ),
      )

    await page.goto('/tools/db-diagram')
    await page.getByTestId('add-table-btn').click()

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('csr-dev-tools-db-diagrams-corrupt-backup')), {
        timeout: 10_000,
      })
      .toBe(unreadable)
    await expect.poll(diagramWrites).toContain('csr-dev-tools-db-diagrams')
    expect((await diagramWrites())[0]).toBe('csr-dev-tools-db-diagrams-corrupt-backup')
    const store = await page.evaluate(
      () => JSON.parse(localStorage.getItem('csr-dev-tools-db-diagrams') ?? 'null') as unknown,
    )
    expect(store).toMatchObject({ diagrams: expect.any(Object), index: [expect.objectContaining({ tableCount: 1 })] })
    await expectOnlyListedKeys(page)
  })

  for (const { keys: allowed = [], tool } of neverSaved) {
    test(`${nameOf(tool)}: saves no input`, async ({ page }) => {
      requirePorted(tool)
      await recordWrites(page)
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

      // Includes any write the Tool deleted again before leaving.
      const written = await writtenKeys(page)
      expect(written.filter((key) => !allowed.includes(key))).toEqual([])
    })
  }
})
