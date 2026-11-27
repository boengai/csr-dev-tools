import { expect, type Locator, type Page } from '@playwright/test'

import { EDIT, readStoredJson, recordedWriteLog, textOf, touchText, typeAtEnd } from './contract.ts'

/**
 * One driver per Tool (or app feature) that saves input. The capture script
 * and the persistence journeys both use them, so they cannot drift apart.
 *
 * A driver reads and edits the page only through the DOM contract of
 * `docs/ux/parity.md` (on `develop`): roles, accessible names, labels, `data-slot` values
 * and test ids. The journeys must run unchanged against the Dioxus build.
 */
export type Driver = {
  /** Journey: the stored values after the edit are right. `restored` is each key's golden current value. */
  checkEdited: (page: Page, restored: Restored) => Promise<void>
  /** Journey: one edit, made the way a visitor would. */
  edit: (page: Page, restored: Restored) => Promise<void>
  /** The keys this Tool writes. Its journey seeds each one's golden current value. */
  keys: Array<string>
  /** Codec only: the Tool's modes, in its own order. The first is the default. */
  modes?: Array<string>
  /** Codec only: the source the editor shows now. */
  readSource?: (page: Page) => Promise<string>
  /** Codec only: the mode the Tool opened in. */
  readMode?: (page: Page) => Promise<string>
  /** Waits until the Tool has read storage and shows its input. */
  ready: (page: Page) => Promise<void>
  route: string
  /** Journey: the seeded values show. */
  shows: (page: Page, restored: Restored) => Promise<void>
  tool: string
  /**
   * Capture, on empty storage: makes the Tool write back what it holds,
   * unchanged. What lands in storage is each key's default. Absent where the
   * default is read from the app's own module instead (the Zustand stores,
   * DB Diagram).
   */
  touch?: (page: Page) => Promise<void>
  /** Capture, on empty storage: writes every key with sample values. What lands is the current shape. */
  write: (page: Page) => Promise<void>
}

export type Restored = Record<string, unknown>

const P = 'csr-dev-tools-'

const textbox = (page: Page, name: string): Locator => page.getByRole('textbox', { exact: true, name })

const pick = async (page: Page, combobox: string, option: string): Promise<void> => {
  await page.getByRole('combobox', { exact: true, name: combobox }).click()
  await page.getByRole('option', { exact: true, name: option }).click()
}

const field = (value: unknown, name: string): unknown => (value as Record<string, unknown>)[name]

const replaceText = async (page: Page, locator: Locator, text: string): Promise<void> => {
  await locator.click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.insertText(text)
}

const expectText = async (locator: Locator, expected: string): Promise<void> => {
  await expect(locator).toBeVisible()
  // An editor's text may end in the newline of its last line.
  await expect.poll(async () => (await textOf(locator)).replace(/\n$/, '')).toBe(expected)
}

/** Polls until each key holds the expected JSON value. */
export const expectStored = async (page: Page, values: Restored): Promise<void> => {
  for (const [key, value] of Object.entries(values)) {
    await expect.poll(() => readStoredJson(page, key), { message: key }).toEqual(value)
  }
}

/** Checks that one saved field shows in its control. */
type ControlCheck = { field: string; shows: (page: Page, value: unknown) => Promise<void> }

/**
 * A select shows the label of its saved value. A native `<select>` shows its
 * selected option; another combobox (a Radix trigger) shows its own text.
 */
const selectShows = (field: string, name: string, labels: Record<string, string>): ControlCheck => ({
  field,
  shows: async (page, value) => {
    const label = labels[String(value)]
    if (label === undefined) throw new Error(`${name}: no label for ${String(value)}`)
    const select = page.getByRole('combobox', { exact: true, name })
    await expect(select).toBeVisible()
    await expect
      .poll(() =>
        select.evaluate((el) =>
          el instanceof HTMLSelectElement ? (el.selectedOptions[0]?.text ?? '') : (el as HTMLElement).innerText,
        ),
      )
      .toBe(label)
  },
})

const textShows = (field: string, name: string): ControlCheck => ({
  field,
  shows: (page, value) => expectText(textbox(page, name), String(value)),
})

const pressedShows = (field: string, name: string): ControlCheck => ({
  field,
  shows: (page, value) =>
    expect(page.getByRole('button', { exact: true, name })).toHaveAttribute('aria-pressed', String(Boolean(value))),
})

const checkedShows = (field: string, name: string): ControlCheck => ({
  field,
  shows: (page, value) =>
    expect(page.getByRole('checkbox', { exact: true, name })).toBeChecked({ checked: Boolean(value) }),
})

const INDENT = { 2: '2 spaces', 4: '4 spaces', tab: 'Tab' }
const FORMAT_MODE = { beautify: 'Beautify', minify: 'Minify' }

type TextToolOptions = {
  /** Journey: the Tool's other saved fields, each checked in its control. */
  controls?: Array<ControlCheck>
  /** The bag field the text control holds; absent when the whole value is the string. */
  field?: string
  key: string
  label: string
  route?: string
  sample: string
  tool: string
  /** Capture: sets the Tool's other controls away from their defaults. */
  writeControls?: (page: Page) => Promise<void>
  /** Other keys the Tool writes (written by `writeControls`). */
  otherKeys?: Array<string>
  /** Capture: writes the other keys back unchanged. */
  touchControls?: (page: Page) => Promise<void>
}

/** A Tool whose main input is one text control: the Transformer, Comparator and Input Tools. */
const textTool = ({
  controls = [],
  field: name,
  key,
  label,
  otherKeys = [],
  route,
  sample,
  tool,
  touchControls,
  writeControls,
}: TextToolOptions): Driver => {
  const control = (page: Page) => textbox(page, label)
  const held = (restored: Restored): string => String(name === undefined ? restored[key] : field(restored[key], name))
  return {
    checkEdited: (page, restored) => {
      const value = restored[key]
      const next = held(restored) + EDIT
      return expectStored(page, { [key]: name === undefined ? next : { ...(value as object), [name]: next } })
    },
    edit: (page) => typeAtEnd(page, control(page), EDIT),
    keys: [key, ...otherKeys],
    ready: (page) => expect(control(page)).toBeVisible(),
    route: route ?? `/tools/${tool}`,
    shows: async (page, restored) => {
      await expectText(control(page), held(restored))
      for (const check of controls) await check.shows(page, field(restored[key], check.field))
    },
    tool,
    touch: async (page) => {
      await touchText(page, control(page))
      await touchControls?.(page)
    },
    write: async (page) => {
      await typeAtEnd(page, control(page), sample)
      await writeControls?.(page)
    },
  }
}

type CodecMode = { button: string; key: string; sample: string }

const codecTool = (tool: string, modeKey: string, prefix: string | null, modes: Array<CodecMode>): Driver => {
  const sourceKey = (m: string) => (prefix ? `${P}${prefix}-${m}-source` : `${P}${m}-source`)
  const modeStorageKey = `${P}${modeKey}-mode`
  const source = (page: Page) => page.getByTestId('code-input-dialog-source').getByRole('textbox')
  const button = (page: Page, m: CodecMode) => page.getByRole('button', { exact: true, name: m.button })
  const current = (restored: Restored): CodecMode => {
    const found = modes.find((m) => m.key === restored[modeStorageKey])
    if (!found) throw new Error(`${tool}: golden mode ${String(restored[modeStorageKey])} is not a mode`)
    return found
  }
  const other = (restored: Restored): CodecMode => {
    const found = modes.find((m) => m.key !== current(restored).key)
    if (!found) throw new Error(`${tool}: needs two modes`)
    return found
  }
  return {
    checkEdited: async (page, restored) => {
      const at = current(restored)
      await expectStored(page, {
        [modeStorageKey]: other(restored).key,
        [sourceKey(at.key)]: String(restored[sourceKey(at.key)]) + EDIT,
      })
      // The other sources are untouched, and each mode shows its own.
      const untouched = modes.filter((m) => m.key !== at.key)
      await expectStored(page, Object.fromEntries(untouched.map((m) => [sourceKey(m.key), restored[sourceKey(m.key)]])))
      await expectText(source(page), String(restored[sourceKey(other(restored).key)]))
      for (const m of untouched.filter((u) => u.key !== other(restored).key)) {
        await button(page, m).click()
        await expectText(source(page), String(restored[sourceKey(m.key)]))
      }
    },
    edit: async (page, restored) => {
      await typeAtEnd(page, source(page), EDIT)
      await button(page, other(restored)).click()
    },
    keys: [modeStorageKey, ...modes.map((m) => sourceKey(m.key))],
    modes: modes.map((m) => m.key),
    readSource: async (page) => {
      await expect(source(page)).toBeVisible()
      return (await textOf(source(page))).replace(/\n$/, '')
    },
    readMode: async (page) => {
      for (const m of modes) {
        if ((await button(page, m).getAttribute('aria-pressed')) === 'true') return m.key
      }
      throw new Error(`${tool}: no mode is pressed`)
    },
    ready: (page) => expect(source(page)).toBeVisible(),
    route: `/tools/${tool}`,
    shows: async (page, restored) => {
      await expect(button(page, current(restored))).toHaveAttribute('aria-pressed', 'true')
      await expectText(source(page), String(restored[sourceKey(current(restored).key)]))
    },
    tool,
    // Visits every mode and ends on the first, which writes the mode key too.
    touch: async (page) => {
      for (const m of [...modes.slice(1), modes[0] as CodecMode]) {
        await button(page, m).click()
        await expect(button(page, m)).toHaveAttribute('aria-pressed', 'true')
        // Wait for the editor to swap in this mode's saved source, or the touch lands in the old one.
        const saved = await readStoredJson(page, sourceKey(m.key))
        if (typeof saved === 'string' && saved !== '') await expectText(source(page), saved)
        await touchText(page, source(page))
      }
    },
    // Ends on the second mode, so the saved mode is not the default.
    write: async (page) => {
      let previous: string | null = null
      for (const m of [...modes.slice(2), modes[0] as CodecMode, modes[1] as CodecMode]) {
        await button(page, m).click()
        await expect(button(page, m)).toHaveAttribute('aria-pressed', 'true')
        // The editor swaps in the new mode's source after the click; typing sooner lands in the old one.
        const before = previous
        if (before !== null) await expect.poll(() => textOf(source(page))).not.toContain(before)
        await typeAtEnd(page, source(page), m.sample)
        previous = m.sample
      }
    },
  }
}

const dashboardWidget = (page: Page, name: string): Locator =>
  page
    .getByRole('main')
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { exact: true, name }) })

const backgroundSwitch = (page: Page): Locator => page.getByRole('switch', { name: /^Background animation/ })

/** Timezone Converter saves its bag and, under its own key, the favourite zones. */
const timezoneConverter: Driver = (() => {
  const favorites = `${P}timezone-favorites`
  const city = (zone: string) => (zone.split('/').pop() ?? zone).replace(/_/g, ' ')
  const base = textTool({
    field: 'source',
    key: `${P}timezone-converter`,
    label: 'Date and time',
    otherKeys: [favorites],
    sample: '2026-11-10 14:30',
    tool: 'timezone-converter',
    touchControls: async (page) => {
      await page.getByRole('button', { exact: true, name: 'Add UTC to favorites' }).click()
      await page.getByRole('button', { exact: true, name: 'Remove UTC from favorites' }).click()
    },
    writeControls: (page) => page.getByRole('button', { exact: true, name: 'Add UTC to favorites' }).click(),
  })
  return {
    ...base,
    checkEdited: async (page, restored) => {
      await base.checkEdited(page, restored)
      await expectStored(page, { [favorites]: [...(restored[favorites] as Array<string>), 'Europe/London'] })
    },
    edit: async (page, restored) => {
      await base.edit(page, restored)
      await page.getByRole('button', { exact: true, name: 'Add London to favorites' }).click()
    },
    shows: async (page, restored) => {
      await base.shows(page, restored)
      for (const zone of restored[favorites] as Array<string>) {
        await expect(
          page.getByRole('button', { exact: true, name: `Remove ${city(zone)} from favorites` }),
        ).toBeVisible()
      }
    },
  }
})()

/** What the AES journey types: a password, ciphertext in Decrypt, plain text in Encrypt. */
const AES_TYPED = ['secret-pass', 'U2FsdGVkX19jaXBoZXJ0ZXh0', 'plain-text'] as const

const PROTOBUF_FORMATS: Record<string, string> = { base64: 'Base64', binary: 'Binary', hex: 'Hex' }
const PROTOBUF_DECODE_INPUT = 'Paste encoded protobuf data...'

/** Closes the Encode dialog (Close keeps the input) and opens Decode. */
const openProtobufDecode = async (page: Page): Promise<void> => {
  await page.keyboard.press('Escape')
  await page.getByRole('button', { exact: true, name: 'Decode' }).click()
  await expect(textbox(page, PROTOBUF_DECODE_INPUT)).toBeVisible()
}

const pressedToggle = (page: Page, name: string): Locator => page.getByRole('button', { exact: true, name })

export const DRIVERS: Array<Driver> = [
  // --- Transformer tools ---
  textTool({
    field: 'source',
    key: `${P}json-formatter`,
    label: 'JSON Input',
    sample: '{"a":1}',
    tool: 'json-formatter',
  }),
  textTool({
    field: 'source',
    key: `${P}cron-expression-parser`,
    label: 'Cron Expression',
    sample: '*/5 * * * *',
    tool: 'cron-expression-parser',
  }),
  textTool({
    field: 'source',
    key: `${P}mermaid-renderer`,
    label: 'Mermaid Syntax',
    sample: 'flowchart TD\n  A --> B',
    tool: 'mermaid-renderer',
  }),
  textTool({
    field: 'source',
    key: `${P}text-case-converter`,
    label: 'Source',
    sample: 'hello world',
    tool: 'text-case-converter',
  }),
  textTool({
    field: 'source',
    key: `${P}user-agent-parser`,
    label: 'User Agent String',
    sample: 'Mozilla/5.0 (X11; Linux x86_64)',
    tool: 'user-agent-parser',
  }),
  textTool({ field: 'source', key: `${P}word-counter`, label: 'Text', sample: 'hello world', tool: 'word-counter' }),
  textTool({
    field: 'source',
    key: `${P}css-formatter`,
    controls: [selectShows('mode', 'Mode', FORMAT_MODE)],
    label: 'CSS Input',
    sample: 'a{color:red}',
    tool: 'css-formatter',
    writeControls: async (page) => {
      // Minify hides Indent, so Indent goes first.
      await pick(page, 'Indent', 'Tab')
      await pick(page, 'Mode', 'Minify')
    },
  }),
  textTool({
    field: 'source',
    key: `${P}html-formatter`,
    controls: [selectShows('mode', 'Mode', FORMAT_MODE), selectShows('indent', 'Indent', INDENT)],
    label: 'HTML Input',
    sample: '<p>hi</p>',
    tool: 'html-formatter',
    writeControls: (page) => pick(page, 'Indent', '4 spaces'),
  }),
  textTool({
    field: 'source',
    key: `${P}javascript-minifier`,
    controls: [selectShows('mode', 'Mode', FORMAT_MODE)],
    label: 'JavaScript Input',
    sample: 'const a = 1',
    tool: 'javascript-minifier',
    writeControls: (page) => pick(page, 'Mode', 'Beautify'),
  }),
  textTool({
    field: 'source',
    key: `${P}sql-formatter`,
    controls: [
      selectShows('dialect', 'Dialect', {
        bigquery: 'BigQuery',
        mysql: 'MySQL',
        postgresql: 'PostgreSQL',
        sql: 'Standard SQL',
        sqlite: 'SQLite',
      }),
      selectShows('indent', 'Indent', INDENT),
    ],
    label: 'SQL Input',
    sample: 'select 1',
    tool: 'sql-formatter',
    writeControls: async (page) => {
      await pick(page, 'Dialect', 'PostgreSQL')
      await pick(page, 'Indent', '4 spaces')
    },
  }),
  textTool({
    field: 'source',
    key: `${P}yaml-formatter`,
    controls: [selectShows('indent', 'Indent', INDENT), checkedShows('sortKeys', 'Sort Keys')],
    label: 'YAML Input',
    sample: 'b: 1\na: 2',
    tool: 'yaml-formatter',
    writeControls: async (page) => {
      await pick(page, 'Indent', '4 spaces')
      await page.getByRole('checkbox', { exact: true, name: 'Sort Keys' }).click()
    },
  }),
  textTool({
    field: 'source',
    key: `${P}json-to-typescript`,
    controls: [textShows('rootName', 'Root Name'), pressedShows('optionalProps', 'Make properties optional')],
    label: 'JSON Input',
    sample: '{"a":1}',
    tool: 'json-to-typescript',
    writeControls: async (page) => {
      await replaceText(page, textbox(page, 'Root Name'), 'Doc')
      await page.getByRole('button', { exact: true, name: 'Make properties optional' }).click()
    },
  }),
  textTool({
    field: 'source',
    key: `${P}json-schema-validator`,
    controls: [textShows('schema', 'JSON Schema')],
    label: 'JSON Data',
    sample: '{"a":1}',
    tool: 'json-schema-validator',
    writeControls: (page) => typeAtEnd(page, textbox(page, 'JSON Schema'), '{"type":"object"}'),
  }),
  textTool({
    field: 'source',
    key: `${P}jsonpath-evaluator-v2`,
    controls: [textShows('expression', 'JSONPath Expression')],
    label: 'JSON Input',
    sample: '{"a":1}',
    tool: 'jsonpath-evaluator',
    writeControls: (page) => replaceText(page, textbox(page, 'JSONPath Expression'), '$.a'),
  }),
  textTool({
    field: 'source',
    key: `${P}text-sort-dedupe`,
    controls: [
      selectShows('sortMode', 'Sort', {
        az: 'A → Z',
        'length-asc': 'Length ↑',
        'length-desc': 'Length ↓',
        numeric: 'Numeric',
        za: 'Z → A',
      }),
      pressedShows('removeDuplicates', 'Dedupe'),
    ],
    label: 'Input (one item per line)',
    sample: 'b\na\na',
    tool: 'text-sort-dedupe',
    writeControls: async (page) => {
      await pick(page, 'Sort', 'Z → A')
      await page.getByRole('button', { exact: true, name: 'Dedupe' }).click()
    },
  }),
  timezoneConverter,

  // --- Comparator tools ---
  textTool({
    field: 'original',
    key: `${P}json-diff`,
    controls: [textShows('modified', 'Modified')],
    label: 'Original',
    sample: '{"a":1}',
    tool: 'json-diff-checker',
    writeControls: (page) => typeAtEnd(page, textbox(page, 'Modified'), '{"a":2}'),
  }),
  textTool({
    field: 'original',
    key: `${P}text-diff`,
    controls: [textShows('modified', 'Modified')],
    label: 'Original',
    sample: 'a',
    tool: 'text-diff-checker',
    writeControls: (page) => typeAtEnd(page, textbox(page, 'Modified'), 'b'),
  }),

  // --- Generator tools ---
  {
    checkEdited: (page, restored) => {
      const key = `${P}color-palette-generator`
      return expectStored(page, { [key]: { ...(restored[key] as object), harmony: 'triadic' } })
    },
    edit: (page) => pick(page, 'Harmony type', 'Triadic'),
    keys: [`${P}color-palette-generator`],
    ready: (page) => expect(textbox(page, 'Hex Color')).toBeVisible(),
    route: '/tools/color-palette-generator',
    shows: async (page, restored) => {
      const value = restored[`${P}color-palette-generator`]
      await expectText(textbox(page, 'Hex Color'), String(field(value, 'hex')))
      const harmony = selectShows('harmony', 'Harmony type', {
        analogous: 'Analogous',
        complementary: 'Complementary',
        monochromatic: 'Monochromatic',
        'split-complementary': 'Split-Complementary',
        triadic: 'Triadic',
      })
      await harmony.shows(page, field(value, 'harmony'))
    },
    tool: 'color-palette-generator',
    // Leaves the harmony it opened with, whatever that is.
    touch: async (page) => {
      const opened = await page.getByRole('combobox', { exact: true, name: 'Harmony type' }).innerText()
      await pick(page, 'Harmony type', opened === 'Triadic' ? 'Analogous' : 'Triadic')
      await pick(page, 'Harmony type', opened)
    },
    write: async (page) => {
      await replaceText(page, textbox(page, 'Hex Color'), '#10b981')
      await pick(page, 'Harmony type', 'Complementary')
    },
  },
  {
    checkEdited: async (page, restored) => {
      const key = `${P}crontab-generator`
      await expectStored(page, { [key]: { ...(restored[key] as object), minute: { mode: 'every' } } })
    },
    edit: (page) => page.getByRole('button', { exact: true, name: 'Every' }).first().click(),
    keys: [`${P}crontab-generator`],
    ready: (page) => expect(page.getByRole('region', { name: 'Cron expression' })).toBeVisible(),
    route: '/tools/crontab-generator',
    // The golden current value has minute and hour on Interval; see `write`.
    shows: (page, restored) => {
      const { hour, minute } = restored[`${P}crontab-generator`] as Record<string, { interval?: number }>
      return expect(page.getByRole('region', { name: 'Cron expression' }).getByRole('definition').first()).toHaveText(
        `*/${minute?.interval} */${hour?.interval} * * *`,
      )
    },
    tool: 'crontab-generator',
    // The mode buttons show no pressed state, so this checks the expression is unchanged instead.
    touch: async (page) => {
      const expression = page.getByRole('region', { name: 'Cron expression' }).getByRole('definition').first()
      const opened = await expression.innerText()
      await page.getByRole('button', { exact: true, name: 'Every' }).first().click()
      const after = await expression.innerText()
      if (after !== opened) throw new Error(`crontab-generator: touching it changed ${opened} to ${after}`)
    },
    write: async (page) => {
      await page.getByRole('button', { exact: true, name: 'Interval' }).nth(0).click()
      await page.getByRole('button', { exact: true, name: 'Interval' }).nth(1).click()
    },
  },
  {
    checkEdited: (page, restored) => {
      const key = `${P}lorem-ipsum-generator`
      const value = restored[key] as Record<string, unknown>
      return expectStored(page, { [key]: { ...value, startWithLorem: !value.startWithLorem } })
    },
    edit: (page) => page.getByRole('checkbox', { name: /^Start with/ }).click(),
    keys: [`${P}lorem-ipsum-generator`],
    ready: (page) => expect(page.getByRole('checkbox', { name: /^Start with/ })).toBeVisible(),
    route: '/tools/lorem-ipsum-generator',
    shows: async (page, restored) => {
      const value = restored[`${P}lorem-ipsum-generator`]
      await expect(page.getByRole('checkbox', { name: /^Start with/ })).toBeChecked({
        checked: Boolean(field(value, 'startWithLorem')),
      })
      await selectShows('unit', 'Unit', { paragraphs: 'Paragraphs', sentences: 'Sentences', words: 'Words' }).shows(
        page,
        field(value, 'unit'),
      )
    },
    tool: 'lorem-ipsum-generator',
    touch: async (page) => {
      await page.getByRole('checkbox', { name: /^Start with/ }).click()
      await page.getByRole('checkbox', { name: /^Start with/ }).click()
    },
    write: async (page) => {
      await pick(page, 'Unit', 'Words')
      await page.getByRole('checkbox', { name: /^Start with/ }).click()
    },
  },
  {
    checkEdited: (page, restored) => {
      const key = `${P}markdown-table-generator`
      const value = restored[key] as { data: Array<Array<string>> }
      const [header = [], ...rest] = value.data
      const [first = '', ...cells] = header
      return expectStored(page, { [key]: { ...value, data: [[first + EDIT, ...cells], ...rest] } })
    },
    edit: (page) => typeAtEnd(page, textbox(page, 'Header column 1'), EDIT),
    keys: [`${P}markdown-table-generator`],
    ready: (page) => expect(textbox(page, 'Header column 1')).toBeVisible(),
    route: '/tools/markdown-table-generator',
    shows: (page, restored) => {
      const value = restored[`${P}markdown-table-generator`] as { data: Array<Array<string>> }
      return expectText(textbox(page, 'Header column 1'), value.data[0]?.[0] ?? '')
    },
    tool: 'markdown-table-generator',
    touch: (page) => touchText(page, textbox(page, 'Header column 1')),
    write: async (page) => {
      await typeAtEnd(page, textbox(page, 'Header column 1'), 'Name')
      await typeAtEnd(page, textbox(page, 'Row 1, column 1'), 'Ada')
    },
  },
  {
    checkEdited: (page, restored) => {
      const key = `${P}password-generator`
      const value = restored[key] as Record<string, unknown>
      return expectStored(page, { [key]: { ...value, uppercase: !value.uppercase } })
    },
    edit: (page) => pressedToggle(page, 'Toggle ABC').click(),
    keys: [`${P}password-generator`],
    ready: (page) => expect(pressedToggle(page, 'Toggle ABC')).toBeVisible(),
    route: '/tools/password-generator',
    // The golden current value turns digits off and sets the length; see `write`.
    shows: async (page, restored) => {
      const value = restored[`${P}password-generator`]
      await expect(pressedToggle(page, 'Toggle 123')).toHaveAttribute('aria-pressed', String(field(value, 'digits')))
      await expect(page.getByRole('spinbutton', { exact: true, name: 'Length' })).toHaveValue(
        String(field(value, 'length')),
      )
    },
    tool: 'password-generator',
    touch: async (page) => {
      await pressedToggle(page, 'Toggle ABC').click()
      await pressedToggle(page, 'Toggle ABC').click()
    },
    write: async (page) => {
      await pressedToggle(page, 'Toggle 123').click()
      await page.getByRole('spinbutton', { exact: true, name: 'Length' }).fill('24')
    },
  },
  textTool({
    field: 'text',
    key: `${P}placeholder-image-generator`,
    controls: [textShows('width', 'Width')],
    label: 'Custom Text',
    sample: 'Hello',
    tool: 'placeholder-image-generator',
    writeControls: (page) => replaceText(page, textbox(page, 'Width'), '640'),
  }),
  {
    checkEdited: (page, restored) => {
      const key = `${P}rsa-key-generator`
      const value = restored[key] as { keySize: number }
      return expectStored(page, { [key]: { ...value, keySize: value.keySize === 2048 ? 4096 : 2048 } })
    },
    edit: (page, restored) => {
      const { keySize } = restored[`${P}rsa-key-generator`] as { keySize: number }
      return pressedToggle(page, keySize === 2048 ? '4096 bits' : '2048 bits').click()
    },
    keys: [`${P}rsa-key-generator`],
    ready: (page) => expect(pressedToggle(page, '2048 bits')).toBeVisible(),
    route: '/tools/rsa-key-generator',
    shows: (page, restored) => {
      const { keySize } = restored[`${P}rsa-key-generator`] as { keySize: number }
      return expect(pressedToggle(page, `${keySize} bits`)).toHaveAttribute('aria-pressed', 'true')
    },
    tool: 'rsa-key-generator',
    // Leaves the key size it opened with.
    touch: async (page) => {
      const opened =
        (await pressedToggle(page, '4096 bits').getAttribute('aria-pressed')) === 'true' ? '4096 bits' : '2048 bits'
      await pressedToggle(page, opened === '2048 bits' ? '4096 bits' : '2048 bits').click()
      await pressedToggle(page, opened).click()
    },
    write: (page) => pressedToggle(page, '4096 bits').click(),
  },
  {
    checkEdited: (page, restored) => {
      const key = `${P}uuid-generator`
      return expectStored(page, { [key]: { ...(restored[key] as object), count: 5 } })
    },
    edit: (page) => page.getByRole('spinbutton', { exact: true, name: 'Count' }).fill('5'),
    keys: [`${P}uuid-generator`],
    ready: (page) => expect(page.getByRole('spinbutton', { exact: true, name: 'Count' })).toBeVisible(),
    route: '/tools/uuid-generator',
    shows: (page, restored) =>
      expect(page.getByRole('spinbutton', { exact: true, name: 'Count' })).toHaveValue(
        String(field(restored[`${P}uuid-generator`], 'count')),
      ),
    tool: 'uuid-generator',
    // Leaves the count it opened with.
    touch: async (page) => {
      const count = page.getByRole('spinbutton', { exact: true, name: 'Count' })
      const opened = await count.inputValue()
      await count.fill(opened === '2' ? '3' : '2')
      await count.fill(opened)
    },
    write: (page) => page.getByRole('spinbutton', { exact: true, name: 'Count' }).fill('3'),
  },

  // --- Single-string tools ---
  textTool({ key: `${P}html-to-pdf`, label: 'HTML Input', sample: '<h1>Hi</h1>', tool: 'html-to-pdf' }),
  textTool({ key: `${P}markdown-to-pdf`, label: 'Markdown Input', sample: '# Hi', tool: 'markdown-to-pdf' }),
  textTool({
    key: `${P}graphql-schema-viewer-input`,
    label: 'GraphQL SDL input',
    sample: 'type Query { a: Int }',
    tool: 'graphql-schema-viewer',
  }),
  textTool({
    key: `${P}protobuf-to-json-input`,
    label: 'Proto definition input',
    sample: 'syntax = "proto3";\nmessage A { string a = 1; }',
    tool: 'protobuf-to-json',
  }),

  // --- Codec tools ---
  codecTool('base64-codec', 'base64', 'base64', [
    { button: 'Base64 Encode mode', key: 'encode', sample: 'hi' },
    { button: 'Base64 Decode mode', key: 'decode', sample: 'aGk=' },
  ]),
  codecTool('url-encoder-decoder', 'url-encoder', 'url-encoder', [
    { button: 'URL Encode mode', key: 'encode', sample: 'a b' },
    { button: 'URL Decode mode', key: 'decode', sample: 'a%20b' },
  ]),
  codecTool('html-entity-converter', 'html-entity', 'html-entity', [
    { button: 'Encode HTML Entities mode', key: 'encode', sample: '<a>' },
    { button: 'Decode HTML Entities mode', key: 'decode', sample: '&lt;a&gt;' },
  ]),
  codecTool('escaped-json-stringifier', 'escaped-json', 'escaped-json', [
    { button: 'Stringify JSON mode', key: 'stringify', sample: '{"a":1}' },
    { button: 'Parse Escaped JSON mode', key: 'parse', sample: '"{\\"a\\":1}"' },
  ]),
  codecTool('string-escape-unescape', 'string-escape-unescape', 'string-escape', [
    { button: 'Escape mode', key: 'escape', sample: 'a"b' },
    { button: 'Unescape mode', key: 'unescape', sample: 'a\\"b' },
  ]),
  codecTool('json-to-csv-converter', 'json-to-csv', null, [
    { button: 'JSON → CSV mode', key: 'json-to-csv', sample: '[{"a":1}]' },
    { button: 'CSV → JSON mode', key: 'csv-to-json', sample: 'a\n1' },
  ]),
  codecTool('json-to-toml-converter', 'json-to-toml', null, [
    { button: 'TOML → JSON mode', key: 'toml-to-json', sample: 'a = 1' },
    { button: 'JSON → TOML mode', key: 'json-to-toml', sample: '{"a":1}' },
  ]),
  codecTool('json-to-xml-converter', 'json-to-xml', null, [
    { button: 'XML → JSON mode', key: 'xml-to-json', sample: '<a>1</a>' },
    { button: 'JSON → XML mode', key: 'json-to-xml', sample: '{"a":1}' },
  ]),
  codecTool('json-to-yaml-converter', 'json-to-yaml', null, [
    { button: 'JSON → YAML mode', key: 'json-to-yaml', sample: '{"a":1}' },
    { button: 'YAML → JSON mode', key: 'yaml-to-json', sample: 'a: 1' },
  ]),
  codecTool('html-to-markdown-converter', 'html-to-markdown', null, [
    { button: 'HTML → Markdown mode', key: 'html-to-markdown', sample: '<b>a</b>' },
    { button: 'Markdown → HTML mode', key: 'markdown-to-html', sample: '**a**' },
  ]),
  codecTool('env-file-converter', 'env-file-converter', null, [
    { button: '.env → JSON mode', key: 'env-to-json', sample: 'A=1' },
    { button: '.env → YAML mode', key: 'env-to-yaml', sample: 'B=2' },
    { button: 'JSON → .env mode', key: 'json-to-env', sample: '{"C":"3"}' },
    { button: 'YAML → .env mode', key: 'yaml-to-env', sample: 'D: 4' },
  ]),
  {
    // Only the mode is saved; the text and the password never are.
    checkEdited: async (page) => {
      await expectStored(page, { [`${P}aes-encrypt-decrypt-mode`]: 'encrypt' })
      // Leaving flushes any pending save, so the checks that follow see it.
      await page.goto('/')
      // No write ever held the password or the text, even under a listed key and overwritten later.
      const leaked = (await recordedWriteLog(page)).filter(({ value }) =>
        AES_TYPED.some((typed) => value.includes(typed)),
      )
      expect(leaked).toEqual([])
      // The mode key only ever held a mode.
      const modes = (await recordedWriteLog(page)).filter(({ key }) => key === `${P}aes-encrypt-decrypt-mode`)
      expect(modes.map(({ value }) => value).filter((v) => v !== '"encrypt"' && v !== '"decrypt"')).toEqual([])
    },
    // Types a password and text in both modes: it opens in Decrypt (the golden value), then switches.
    edit: async (page) => {
      const source = page.getByTestId('code-input-dialog-source').getByRole('textbox')
      // By label: a password input has no textbox role in ARIA.
      await page.getByLabel('Password', { exact: true }).fill(AES_TYPED[0])
      await typeAtEnd(page, source, AES_TYPED[1])
      await page.getByRole('button', { exact: true, name: 'Encrypt mode' }).click()
      await expect(page.getByRole('button', { exact: true, name: 'Encrypt mode' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await typeAtEnd(page, source, AES_TYPED[2])
    },
    keys: [`${P}aes-encrypt-decrypt-mode`],
    modes: ['encrypt', 'decrypt'],
    readMode: async (page) =>
      (await page.getByRole('button', { exact: true, name: 'Decrypt mode' }).getAttribute('aria-pressed')) === 'true'
        ? 'decrypt'
        : 'encrypt',
    ready: (page) => expect(page.getByRole('button', { exact: true, name: 'Encrypt mode' })).toBeVisible(),
    route: '/tools/aes-encrypt-decrypt',
    shows: (page) =>
      expect(page.getByRole('button', { exact: true, name: 'Decrypt mode' })).toHaveAttribute('aria-pressed', 'true'),
    tool: 'aes-encrypt-decrypt',
    touch: async (page) => {
      await page.getByRole('button', { exact: true, name: 'Decrypt mode' }).click()
      await page.getByRole('button', { exact: true, name: 'Encrypt mode' }).click()
    },
    write: (page) => page.getByRole('button', { exact: true, name: 'Decrypt mode' }).click(),
  },

  // --- Other tools ---
  {
    checkEdited: (page, restored) => {
      const key = `${P}protobuf-codec-input`
      const value = restored[key] as { schema: string }
      return expectStored(page, { [key]: { ...value, schema: value.schema + EDIT } })
    },
    edit: (page) => typeAtEnd(page, textbox(page, 'Proto schema input'), EDIT),
    keys: [`${P}protobuf-codec-input`],
    ready: async (page) => {
      await page.getByRole('button', { exact: true, name: 'Encode' }).click()
      await expect(textbox(page, 'Proto schema input')).toBeVisible()
    },
    route: '/tools/protobuf-codec',
    // Checks the Encode dialog, then the Decode dialog's own format and data.
    shows: async (page, restored) => {
      const value = restored[`${P}protobuf-codec-input`]
      await expectText(textbox(page, 'Proto schema input'), String(field(value, 'schema')))
      await expectText(textbox(page, 'JSON input'), String(field(value, 'encodeSource')))
      await openProtobufDecode(page)
      const format = PROTOBUF_FORMATS[String(field(value, 'decodeFormat'))]
      if (format === undefined) throw new Error(`protobuf-codec: no label for ${String(field(value, 'decodeFormat'))}`)
      await expect(page.getByRole('radio', { exact: true, name: format })).toBeChecked()
      await expectText(textbox(page, PROTOBUF_DECODE_INPUT), String(field(value, 'decodeSource')))
    },
    tool: 'protobuf-codec',
    touch: (page) => touchText(page, textbox(page, 'Proto schema input')),
    write: async (page) => {
      await typeAtEnd(page, textbox(page, 'Proto schema input'), 'syntax = "proto3";\nmessage A { int32 a = 1; }')
      await typeAtEnd(page, textbox(page, 'JSON input'), '{"a":1}')
      await openProtobufDecode(page)
      await page.getByRole('radio', { exact: true, name: 'Hex' }).click()
      await typeAtEnd(page, textbox(page, PROTOBUF_DECODE_INPUT), '0801')
    },
  },
  {
    // Rename saves at once. The store keeps its shape: same diagrams, the index entry renamed.
    checkEdited: async (page, restored) => {
      const key = `${P}db-diagrams`
      const before = restored[key] as { diagrams: Record<string, unknown>; index: Array<{ id: string; name: string }> }
      const [entry] = before.index
      if (!entry) throw new Error('db-diagram: the golden store has no diagram')
      // Every field of the entry keeps its value and type; only the name and the edit time change.
      await expect
        .poll(() => readStoredJson(page, key))
        .toEqual({
          diagrams: before.diagrams,
          index: [{ ...entry, name: entry.name + EDIT, updatedAt: expect.any(String) }],
        })
    },
    edit: async (page) => {
      await page.getByTestId('diagram-name').click()
      await typeAtEnd(page, textbox(page, 'Diagram name'), EDIT)
      await page.keyboard.press('Enter')
    },
    keys: [`${P}db-diagrams`],
    ready: (page) => expect(page.getByTestId('add-table-btn')).toBeVisible(),
    route: '/tools/db-diagram',
    shows: async (page, restored) => {
      const store = restored[`${P}db-diagrams`] as {
        diagrams: Record<string, { tables: Array<{ name: string }> }>
        index: Array<{ id: string; name: string }>
      }
      const [entry] = store.index
      if (!entry) throw new Error('db-diagram: the golden store has no diagram')
      await expect(page.getByTestId('diagram-name')).toHaveText(entry.name)
      for (const table of store.diagrams[entry.id]?.tables ?? []) {
        await expect(page.getByRole('button', { name: table.name }).first()).toBeVisible()
      }
    },
    tool: 'db-diagram',
    write: async (page) => {
      await page.getByTestId('add-table-btn').click()
      // Autosave runs 3 s after the last edit.
      await expect.poll(() => readStoredJson(page, `${P}db-diagrams`), { timeout: 10_000 }).toBeDefined()
    },
  },
  {
    checkEdited: (page, restored) => {
      const value = restored.feature_layout as { state: { value: Record<string, unknown> }; version: number }
      return expectStored(page, {
        feature_layout: { ...value, state: { ...value.state, value: { ...value.state.value, 0: null } } },
      })
    },
    edit: (page) => dashboardWidget(page, 'JSON Formatter').getByRole('button', { exact: true, name: 'Close' }).click(),
    keys: ['feature_layout'],
    ready: (page) => expect(page.getByRole('main')).toBeVisible(),
    route: '/',
    // The golden current layout is the default with UUID Generator's widget closed; see `write`.
    shows: async (page) => {
      for (const name of ['JSON Formatter', 'Base64 Codec', 'JWT Decoder', 'Unix Timestamp', 'Regex Tester']) {
        await expect(dashboardWidget(page, name)).toBeVisible()
      }
      await expect(dashboardWidget(page, 'UUID Generator')).toHaveCount(0)
    },
    tool: 'dashboard',
    write: (page) =>
      dashboardWidget(page, 'UUID Generator').getByRole('button', { exact: true, name: 'Close' }).click(),
  },
  {
    checkEdited: (page, restored) => {
      const value = restored.settings as { state: { value: { showBackgroundAnimation: boolean } }; version: number }
      const on = value.state.value.showBackgroundAnimation
      return expectStored(page, {
        settings: {
          ...value,
          state: { ...value.state, value: { ...value.state.value, showBackgroundAnimation: !on } },
        },
      })
    },
    edit: (page) => backgroundSwitch(page).click(),
    keys: ['settings'],
    ready: async (page) => {
      await page.getByRole('button', { exact: true, name: 'Settings' }).click()
      await expect(backgroundSwitch(page)).toBeVisible()
    },
    route: '/',
    shows: (page, restored) => {
      const value = restored.settings as { state: { value: { showBackgroundAnimation: boolean } } }
      return expect(backgroundSwitch(page)).toBeChecked({ checked: value.state.value.showBackgroundAnimation })
    },
    tool: 'settings',
    write: (page) => backgroundSwitch(page).click(),
  },
]
