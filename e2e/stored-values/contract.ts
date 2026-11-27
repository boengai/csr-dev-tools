import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { BrowserContext, Locator, Page } from '@playwright/test'

/**
 * The stored-value contract (ADR-0032 Decision 8), as data, plus the helpers
 * the capture script and the persistence journeys share. See README.md.
 */

export type StoredReader =
  | 'codec-mode'
  | 'codec-source'
  | 'diagram'
  | 'fields'
  | 'handoff'
  | 'input'
  | 'markdown-table'
  | 'migration-source'
  | 'none'
  | 'value'
  | 'zustand'

export type StoredKey = {
  envelopeVersion?: number
  format: 'json' | 'text'
  key: string
  legacy?: boolean
  mode?: string
  modes?: Array<string>
  note?: string
  owner: string
  pattern?: string
  reader: StoredReader
  writer?: string
  written?: boolean | string
}

export type KeyList = {
  keys: Array<StoredKey>
  neverSaved: Array<{ keys?: Array<string>; note?: string; tool: string }>
  patterns: Array<{ name: string; note: string; pattern: string }>
}

/** Raw `localStorage` text by key; `null` means the key is absent. */
export type StorageSnapshot = Record<string, string | null>

export type GoldenEntry = {
  /** What both builds restore. A Dioxus test compares its restored value with this. */
  expected: unknown
  /** Hand-written: why `expected` differs from what React restores (ADR-0032 Decision 4). */
  deliberate?: string
  id: string
  key: string
  /** `written-by-react`: React wrote `stored` through the UI. `seeded`: hand-written input. */
  provenance: 'seeded' | 'written-by-react'
  /** JSON text of what React restores, when it differs from `expected`. */
  react?: string
  reader: StoredReader
  /** `handoff`: a value `main` writes (DB Diagram's export), seeded by hand because no UI path reaches it from here. */
  shape: 'current' | 'damaged' | 'handoff' | 'older'
  /** Every `csr-dev-tools-` key after the tool opened, when opening it writes (migrations, the handoff). */
  storageAfterOpen?: StorageSnapshot
  /** DB Diagram only: storage after one save over the restored store. */
  storageAfterWrite?: StorageSnapshot
  stored: StorageSnapshot
}

export type Golden = {
  capturedFrom: string
  defaults: Record<string, unknown>
  entries: Array<GoldenEntry>
  environment: { now: string; random: string; timezoneId: string }
}

const here = dirname(fileURLToPath(import.meta.url))

const KEY_LIST_PATH = join(here, 'keys.json')
export const GOLDEN_PATH = join(here, 'golden.json')

export const readKeyList = (): KeyList => JSON.parse(readFileSync(KEY_LIST_PATH, 'utf8')) as KeyList

export const readGolden = (): Golden => JSON.parse(readFileSync(GOLDEN_PATH, 'utf8')) as Golden

/** Fixed so a capture is repeatable: Timezone Converter's default depends on both. */
export const CAPTURE_ENVIRONMENT = {
  now: '2026-11-27T09:00:00.000Z',
  random: 'mulberry32(38)',
  timezoneId: 'Asia/Bangkok',
} as const

/** Text the journeys append in an edit. */
export const EDIT = ' edited'

const WRITES_KEY = 'stored-value-contract-writes'
/** Set in `sessionStorage` while the seed is written, so `recordWrites` leaves those writes out. */
const SEEDING_KEY = 'stored-value-contract-seeding'

/**
 * Seeds `localStorage` once per test, before the app's scripts run.
 * `addInitScript` runs again on every navigation, so a flag in
 * `sessionStorage` keeps a reload from writing the seed over an edit.
 */
export const seedStorage = async (context: BrowserContext | Page, stored: StorageSnapshot): Promise<void> => {
  await context.addInitScript(
    ({ seed, seedingKey }: { seed: StorageSnapshot; seedingKey: string }) => {
      if (sessionStorage.getItem('stored-value-contract-seeded') !== null) return
      sessionStorage.setItem('stored-value-contract-seeded', '1')
      sessionStorage.setItem(seedingKey, '1')
      try {
        for (const [key, raw] of Object.entries(seed)) {
          if (raw === null) localStorage.removeItem(key)
          else localStorage.setItem(key, raw)
        }
      } finally {
        sessionStorage.removeItem(seedingKey)
      }
    },
    { seed: stored, seedingKey: SEEDING_KEY },
  )
}

/** One `localStorage` write, as `recordWrites` saw it. */
/** `value` is `null` for a removal (`removeItem`, or `clear` for each key it held). */
export type RecordedWrite = { key: string; value: string | null }

/**
 * Records every `localStorage` write and removal, key and value, for the
 * rest of the test. That includes writes a Tool deletes or overwrites before the test
 * reads storage. The log lives in `sessionStorage`, so it survives
 * navigation within the tab. On a context, it also covers the tabs a page
 * opens. The seed's own writes (`seedStorage`) are left out, whichever init
 * script runs first: Playwright sets no order between them.
 */
export const recordWrites = async (target: BrowserContext | Page): Promise<void> => {
  await target.addInitScript(
    ({ logKey, seedingKey }: { logKey: string; seedingKey: string }) => {
      const { clear, removeItem, setItem } = Storage.prototype
      const log = (entries: Array<{ key: string; value: string | null }>) => {
        if (sessionStorage.getItem(seedingKey) !== null) return
        const before = JSON.parse(sessionStorage.getItem(logKey) ?? '[]') as Array<unknown>
        setItem.call(sessionStorage, logKey, JSON.stringify([...before, ...entries]))
      }
      Storage.prototype.setItem = function (key: string, value: string) {
        if (this === localStorage) log([{ key, value: String(value) }])
        setItem.call(this, key, value)
      }
      Storage.prototype.removeItem = function (key: string) {
        if (this === localStorage && localStorage.getItem(key) !== null) log([{ key, value: null }])
        removeItem.call(this, key)
      }
      Storage.prototype.clear = function () {
        if (this === localStorage) log(Object.keys(localStorage).map((key) => ({ key, value: null })))
        clear.call(this)
      }
    },
    { logKey: WRITES_KEY, seedingKey: SEEDING_KEY },
  )
}

/** Every write `recordWrites` has seen, in order. */
export const recordedWriteLog = (page: Page): Promise<Array<RecordedWrite>> =>
  page.evaluate((logKey) => JSON.parse(sessionStorage.getItem(logKey) ?? '[]') as Array<RecordedWrite>, WRITES_KEY)

/** The keys `recordWrites` has seen written (not removed), in order. */
export const recordedWrites = async (page: Page): Promise<Array<string>> =>
  (await recordedWriteLog(page)).filter(({ value }) => value !== null).map(({ key }) => key)

/** Every `localStorage` entry, as raw text. */
export const readStorage = (page: Page): Promise<Record<string, string>> =>
  page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))

export const readStoredJson = async (page: Page, key: string): Promise<unknown> =>
  page.evaluate((k) => {
    const raw = localStorage.getItem(k)
    return raw === null ? undefined : (JSON.parse(raw) as unknown)
  }, key)

/** What a text control holds: an input's or a textarea's value, or an editable element's text. */
export const textOf = (locator: Locator): Promise<string> =>
  locator.evaluate((el) =>
    el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value : (el as HTMLElement).innerText,
  )

/** Puts the caret at the end of a text control and types there. */
export const typeAtEnd = async (page: Page, locator: Locator, text: string): Promise<void> => {
  await locator.click()
  // An input or a textarea takes its caret from the DOM; an editor from its own end-of-document key.
  const native = await locator.evaluate((el) => {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false
    el.setSelectionRange(el.value.length, el.value.length)
    return true
  })
  if (!native) await page.keyboard.press('ControlOrMeta+End')
  // Not `type`: an editor's Enter would auto-indent the next line.
  await page.keyboard.insertText(text)
}

/** Types a character and deletes it: the tool writes back what it holds, unchanged. */
export const touchText = async (page: Page, locator: Locator): Promise<void> => {
  await typeAtEnd(page, locator, 'x')
  await page.keyboard.press('Backspace')
}
