import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { isDeepStrictEqual, parseArgs } from 'node:util'

import { type Browser, chromium, type Page } from '@playwright/test'

import {
  CAPTURE_ENVIRONMENT,
  GOLDEN_PATH,
  type Golden,
  type GoldenEntry,
  readKeyList,
  readStorage,
  seedStorage,
  type StorageSnapshot,
  type StoredKey,
} from './contract.ts'
import { DRIVERS, type Driver } from './drivers.ts'
import { SEEDS, type Seed } from './seeds.ts'

/**
 * Captures the golden values from the React build. Usage and method:
 * README.md. Needs the Vite dev server (`pnpm dev`), because it imports the
 * app's own restore code into the page.
 */

const { values: options } = parseArgs({
  options: { 'base-url': { default: 'http://localhost:5173', type: 'string' } },
})
const baseURL = options['base-url']

const { keys } = readKeyList()
const keyOf = new Map(keys.map((k) => [k.key, k]))
const stored = (key: string): StoredKey => {
  const found = keyOf.get(key)
  if (!found) throw new Error(`${key} is not on the key list`)
  return found
}
const driverOf = (key: string): Driver => {
  const owner = stored(key).owner
  const found = DRIVERS.find((d) => d.keys.includes(key)) ?? DRIVERS.find((d) => d.tool === owner)
  if (!found) throw new Error(`no driver writes ${key}`)
  return found
}

const RESTORE_JSON = '/src/utils/restore-json.ts'
const LAYOUT_STORE = '/src/hooks/persist/usePersistFeatureLayout.ts'
const SETTINGS_STORE = '/src/hooks/persist/usePersistSettings.ts'
const DIAGRAM_STORE = '/src/diagram/codecs/storage.ts'

/** A fresh browser context per run: empty storage, the fixed clock, zone and random source. */
const withPage = async <T>(
  browser: Browser,
  seed: StorageSnapshot | null,
  run: (page: Page) => Promise<T>,
): Promise<T> => {
  const context = await browser.newContext({ baseURL, timezoneId: CAPTURE_ENVIRONMENT.timezoneId })
  await context.clock.setFixedTime(new Date(CAPTURE_ENVIRONMENT.now))
  await context.addInitScript(() => {
    // mulberry32(38): DB Diagram's ids are random.
    let state = 38
    Math.random = () => {
      state = (state + 0x6d2b79f5) | 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  })
  if (seed) await seedStorage(context, seed)
  const page = await context.newPage()
  try {
    return await run(page)
  } finally {
    await context.close()
  }
}

/** Fires the `pagehide` flush, so a debounced write lands now. */
const flush = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event('pagehide')))

const open = async (page: Page, driver: Driver): Promise<void> => {
  await page.goto(driver.route)
  await driver.ready(page)
}

/** `main`'s `readJsonStorage`: `restoreJson` over the default, or the default when unreadable. Returns JSON text. */
const restoreInPage = (page: Page, raw: string | null, fallback: unknown): Promise<string> =>
  page.evaluate(
    async ({ fallback, raw, url }) => {
      const { restoreJson } = (await import(/* @vite-ignore */ url)) as {
        restoreJson: (stored: unknown, initial: unknown) => unknown
      }
      let value = fallback
      try {
        if (raw !== null) value = restoreJson(JSON.parse(raw), fallback)
      } catch {
        // unparseable: the default
      }
      return JSON.stringify(value)
    },
    { fallback, raw, url: RESTORE_JSON },
  )

/** The Zustand store as the app holds it, in the envelope it writes. */
const zustandInPage = (page: Page, key: StoredKey): Promise<string> =>
  page.evaluate(
    async ({ name, url, version }) => {
      const mod = (await import(/* @vite-ignore */ url)) as Record<string, { getState: () => { value: unknown } }>
      const store = mod[name]
      if (!store) throw new Error(`no ${name} in ${url}`)
      return JSON.stringify({ state: { value: store.getState().value }, version })
    },
    {
      ...(key.key === 'feature_layout'
        ? { name: 'usePersistFeatureLayout', url: LAYOUT_STORE }
        : { name: 'usePersistSettings', url: SETTINGS_STORE }),
      version: key.envelopeVersion ?? 0,
    },
  )

/** DB Diagram as the app reads it: the restored index, and each listed diagram restored. */
const diagramInPage = (page: Page): Promise<string> =>
  page.evaluate(async (url) => {
    const { loadDiagram, loadDiagramIndex } = (await import(/* @vite-ignore */ url)) as {
      loadDiagram: (id: string) => unknown
      loadDiagramIndex: () => Array<{ id: string }>
    }
    const index = loadDiagramIndex()
    return JSON.stringify({ diagrams: Object.fromEntries(index.map(({ id }) => [id, loadDiagram(id)])), index })
  }, DIAGRAM_STORE)

/** One save over the restored store, as any edit makes. */
const diagramWriteInPage = (page: Page): Promise<void> =>
  page.evaluate(async (url) => {
    const { loadDiagramIndex, saveDiagramIndex } = (await import(/* @vite-ignore */ url)) as {
      loadDiagramIndex: () => unknown
      saveDiagramIndex: (index: unknown) => void
    }
    saveDiagramIndex(loadDiagramIndex())
  }, DIAGRAM_STORE)

const snapshot = async (page: Page): Promise<StorageSnapshot> => sortKeys(await readStorage(page))

const sortKeys = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))

const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/

/** A Rust `String` cannot hold a lone surrogate, so `expected` must not carry one. */
const wellFormed = (value: unknown): boolean =>
  typeof value === 'string'
    ? !LONE_SURROGATE.test(value)
    : Array.isArray(value)
      ? value.every(wellFormed)
      : typeof value === 'object' && value !== null
        ? Object.entries(value).every(([name, field]) => wellFormed(name) && wellFormed(field))
        : true

const offList = (storage: StorageSnapshot): Array<string> => Object.keys(storage).filter((k) => !keyOf.has(k))

/** What React restores for `key`, as JSON text, with the tool already open on `page` where needed. */
const restore = async (page: Page, key: StoredKey, raw: string | null, defaults: Record<string, unknown>) => {
  switch (key.reader) {
    case 'codec-mode': {
      const driver = driverOf(key.key)
      if (!driver.readMode) throw new Error(`${driver.tool}: no readMode`)
      return JSON.stringify(await driver.readMode(page))
    }
    case 'diagram':
      return diagramInPage(page)
    case 'zustand':
      return zustandInPage(page, key)
    default:
      if (!(key.key in defaults)) throw new Error(`no default for ${key.key}`)
      return restoreInPage(page, raw, defaults[key.key])
  }
}

/** Readers that need the app running on a page rather than one pure call. */
const needsApp = (key: StoredKey): boolean => ['codec-mode', 'diagram', 'zustand'].includes(key.reader)

const problems: Array<string> = []

/** Runs `run` over `items`, `size` at a time. A failure is recorded under the item's name, and the rest go on. */
const pool = async <T>(items: Array<T>, size: number, name: (item: T) => string, run: (item: T) => Promise<void>) => {
  let next = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const item = items[next++] as T
        try {
          await run(item)
        } catch (error) {
          problems.push(`${name(item)}: ${(error instanceof Error ? error.message : String(error)).split('\n')[0]}`)
        }
      }
    }),
  )
}

const browser = await chromium.launch()

// The dev server compiles each route on its first visit, which can outlast an `expect` timeout.
await withPage(browser, null, async (page) => {
  for (const driver of DRIVERS) {
    for (let attempt = 1; ; attempt++) {
      try {
        await open(page, driver)
        break
      } catch (error) {
        if (attempt === 5) throw error
      }
    }
  }
})

// 1. Defaults: what each Tool holds and writes back on empty storage.
const defaults: Record<string, unknown> = {}
await pool(
  DRIVERS,
  4,
  (d) => `${d.tool} (default)`,
  (driver) =>
    withPage(browser, null, async (page) => {
      await open(page, driver)
      // Read from the app as it opens: the Zustand stores, DB Diagram, and the mode a Codec opens in.
      const opened: Record<string, unknown> = {}
      for (const key of driver.keys.map(stored).filter(needsApp)) {
        opened[key.key] = JSON.parse(await restore(page, key, null, defaults))
        if (key.reader !== 'codec-mode') defaults[key.key] = opened[key.key]
        if (key.reader === 'codec-mode' && JSON.stringify(key.modes) !== JSON.stringify(driver.modes)) {
          problems.push(`${key.key}: keys.json lists modes ${key.modes}, the driver ${driver.modes}`)
        }
      }
      if (!driver.touch) return
      await driver.touch(page)
      await flush(page)
      const storage = await readStorage(page)
      for (const key of driver.keys) {
        const raw = storage[key]
        if (raw === undefined) problems.push(`${driver.tool}: touching it did not write ${key}`)
        else defaults[key] = JSON.parse(raw)
        // A Codec's default mode is the one it opens in; touching it must save that one.
        if (key in opened && !isDeepStrictEqual(defaults[key], opened[key])) {
          problems.push(`${key}: opens in ${JSON.stringify(opened[key])} but touching it saved ${raw}`)
        }
      }
    }),
)

const entries: Array<GoldenEntry> = []

const entry = (
  id: string,
  key: StoredKey,
  shape: GoldenEntry['shape'],
  seed: StorageSnapshot,
  reactText: string,
  extra: Partial<Omit<GoldenEntry, 'deliberate'>> & { deliberate?: Seed['deliberate'] },
): GoldenEntry => {
  const react: unknown = JSON.parse(reactText)
  const { deliberate, ...rest } = extra
  if (!deliberate && !wellFormed(react)) problems.push(`${id}: React keeps a lone surrogate; mark it deliberate`)
  if (deliberate && isDeepStrictEqual(deliberate.expected, react)) problems.push(`${id}: deliberate, but React agrees`)
  if (deliberate && !wellFormed(deliberate.expected))
    problems.push(`${id}: the deliberate value holds a lone surrogate`)
  return {
    id,
    key: key.key,
    reader: key.reader,
    shape,
    provenance: shape === 'current' ? 'written-by-react' : 'seeded',
    stored: seed,
    expected: deliberate ? deliberate.expected : react,
    ...(deliberate ? { deliberate: deliberate.why, react: reactText } : {}),
    ...rest,
  }
}

// 2. The current shape of every key: written by React through the UI.
await pool(
  DRIVERS,
  4,
  (d) => `${d.tool} (current)`,
  async (driver) => {
    const written = await withPage(browser, null, async (page) => {
      await open(page, driver)
      await driver.write(page)
      await flush(page)
      return snapshot(page)
    })
    for (const k of offList(written)) problems.push(`${driver.tool}: wrote ${k}, which is not on the key list`)
    for (const k of driver.keys) {
      if (written[k] === undefined) problems.push(`${driver.tool}: writing it did not write ${k}`)
    }
    const seed = Object.fromEntries(
      driver.keys.filter((k) => written[k] !== undefined).map((k) => [k, written[k] ?? null]),
    )
    for (const k of Object.keys(seed)) {
      const key = stored(k)
      const raw = seed[k] ?? null
      const reactText = await withPage(browser, needsApp(key) ? seed : null, async (page) => {
        if (needsApp(key)) await open(page, driver)
        else await page.goto('/')
        return restore(page, key, raw, defaults)
      })
      if (key.reader !== 'diagram' && !isDeepStrictEqual(JSON.parse(reactText), JSON.parse(raw ?? 'null'))) {
        problems.push(`${k}: React does not restore its own current shape (${raw} -> ${reactText})`)
      }
      entries.push(entry(`${k}/current`, key, 'current', { [k]: raw }, reactText, {}))
    }
  },
)

// 3. The seeds: older shapes and damaged values.
await pool(
  SEEDS,
  4,
  (s) => s.id,
  (seed) => {
    const key = stored(seed.key)
    const driver = driverOf(seed.key)
    return withPage(browser, seed.open ? seed.stored : null, async (page) => {
      if (!seed.open) {
        await page.goto('/')
        const reactText = await restore(page, key, seed.stored[seed.key] ?? null, defaults)
        entries.push(entry(seed.id, key, seed.shape, seed.stored, reactText, { deliberate: seed.deliberate }))
        return
      }
      await open(page, driver)
      const storageAfterOpen = await snapshot(page)
      const opening = isDeepStrictEqual(storageAfterOpen, sortKeys(seed.stored)) ? {} : { storageAfterOpen }
      let reactText: string
      if (needsApp(key)) {
        reactText = await restore(page, key, null, defaults)
      } else {
        // What the open Tool holds, migration or handoff included: it writes it back unchanged.
        if (!driver.touch) throw new Error(`${driver.tool}: no touch`)
        await driver.touch(page)
        await flush(page)
        reactText = (await readStorage(page))[seed.key] ?? 'null'
      }
      let writing = {}
      if (key.reader === 'diagram') {
        await diagramWriteInPage(page)
        writing = { storageAfterWrite: await snapshot(page) }
      }
      entries.push(
        entry(seed.id, key, seed.shape, seed.stored, reactText, {
          deliberate: seed.deliberate,
          ...opening,
          ...writing,
        }),
      )
    })
  },
)

await browser.close()

// Every key a Tool restores has a current shape.
for (const key of keys.filter((k) => !['handoff', 'migration-source', 'none'].includes(k.reader))) {
  if (!entries.some((e) => e.key === key.key && e.shape === 'current')) problems.push(`${key.key}: no current shape`)
}

if (problems.length > 0) {
  process.stderr.write(`${problems.join('\n')}\n`)
  process.exit(1)
}

// The main commit the React source comes from: a branch commit would not survive a squash merge.
const git = (...args: Array<string>) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const commit = git('rev-parse', '--short', git('merge-base', 'HEAD', 'origin/main'))
const golden: Golden = {
  capturedFrom: `React main, ${commit}`,
  defaults: sortKeys(defaults),
  entries: entries.sort((a, b) => a.id.localeCompare(b.id)),
  environment: CAPTURE_ENVIRONMENT,
}
writeFileSync(GOLDEN_PATH, `${JSON.stringify(golden, null, 2)}\n`)
process.stdout.write(`${entries.length} entries, ${Object.keys(defaults).length} defaults -> ${GOLDEN_PATH}\n`)
