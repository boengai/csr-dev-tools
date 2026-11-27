/**
 * Keeps the stored-value contract (ADR-0032 Decision 8,
 * `e2e/stored-values/README.md`) in step with the React source. A change on
 * `main` that adds, renames or drops a `localStorage` key fails here until
 * `keys.json` and `golden.json` follow it in the same change.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

type ContractKey = { key: string; legacy?: boolean; owner: string; reader: string }
type ContractEntry = {
  deliberate?: string
  expected: unknown
  id: string
  key: string
  react?: string
  shape: string
  storageAfterOpen?: Record<string, string | null>
  storageAfterWrite?: Record<string, string | null>
  stored: Record<string, string | null>
}

const ROOT = join(__dirname, '..', '..')
const CONTRACT_DIR = join(ROOT, 'e2e', 'stored-values')
const readJson = <T>(name: string): T => JSON.parse(readFileSync(join(CONTRACT_DIR, name), 'utf8')) as T

const keyList = readJson<{ keys: Array<ContractKey>; neverSaved: Array<{ keys?: Array<string>; tool: string }> }>(
  'keys.json',
)
const golden = readJson<{ defaults: Record<string, unknown>; entries: Array<ContractEntry> }>('golden.json')
const listed = new Set(keyList.keys.map(({ key }) => key))

const P = 'csr-dev-tools-'
/** Keys a Tool reads back. The rest are migration sources, the handoff and the diagram backup. */
const RESTORED = keyList.keys.filter(({ reader }) => !['handoff', 'migration-source', 'none'].includes(reader))

const sourceFiles = (dir: string): Array<string> =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile() && /\.tsx?$/.test(f.name) && !/\.spec\.tsx?$/.test(f.name))
    .map((f) => join(f.parentPath, f.name))

/** Every key the React source can write, read from its literals. */
const keysInSource = (): Map<string, string> => {
  const found = new Map<string, string>()
  const add = (key: string, file: string) => found.set(key, relative(ROOT, file))
  for (const file of sourceFiles(join(ROOT, 'src'))) {
    if (file.includes(`${join('src', 'test')}`)) continue
    const text = readFileSync(file, 'utf8')
    for (const [, key] of text.matchAll(/['"`](csr-dev-tools-[a-z0-9-]*[a-z0-9])['"`]/g)) add(key as string, file)
    // A literal key handed to the shared persistence helpers, prefixed or not. A template
    // literal (`csr-dev-tools-${…}`) is a pattern, read from its parts below.
    const shared =
      /(?:\b(?:readJsonStorage|useInputLocalStorage|writeJsonStorage)(?:<[^>]*>)?\(|\bstorageKey(?:=\{?|:)\s*)\s*['"`]([^'"`]+)['"`]/g
    for (const [, key] of text.matchAll(shared)) if (!(key as string).includes('${')) add(key as string, file)
    // A Codec derives its keys from `modeStorageKey`, `sourceKeyPrefix` and its modes.
    const modeKey = /modeStorageKey="([a-z0-9-]+)"/.exec(text)?.[1]
    if (modeKey) {
      add(`${P}${modeKey}-mode`, file)
      if (!text.includes('persistSource={false}')) {
        const prefix = /sourceKeyPrefix="([a-z0-9-]+)"/.exec(text)?.[1]
        for (const [, mode] of text.matchAll(/^\s+key: '([a-z0-9-]+)',$/gm)) {
          add(prefix ? `${P}${prefix}-${mode}-source` : `${P}${mode}-source`, file)
        }
      }
    }
    // A Zustand `persist` store, wherever it lives, is keyed by its `name`.
    if (text.includes("from 'zustand/middleware'")) {
      for (const [, name] of text.matchAll(/\bname:\s*['"`]([^'"`]+)['"`]/g)) add(name as string, file)
    }
  }
  const channels = readFileSync(join(ROOT, 'src', 'types', 'utils', 'tool-handoff.ts'), 'utf8')
  for (const [, channel] of channels.matchAll(/'([a-z0-9-]+)'/g)) add(`${P}handoff-${channel}`, 'HandoffChannel')
  return found
}

/** Comments stripped, so a comment that mentions localStorage is not a caller. */
const code = (text: string): string => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')

/**
 * The files that call `localStorage` directly. A new one fails the spec until
 * its keys are on the key list and it is added here.
 */
const STORAGE_CALLERS = [
  join('src', 'components', 'feature', 'code', 'JsonpathEvaluator.tsx'),
  join('src', 'components', 'feature', 'code', 'MermaidRenderer.tsx'),
  join('src', 'diagram', 'codecs', 'storage.ts'),
  join('src', 'hooks', 'persist', 'jsonStorage.ts'),
  join('src', 'utils', 'tool-handoff.ts'),
]

describe('stored-value contract', () => {
  it('knows every file that calls localStorage directly', () => {
    const callers = sourceFiles(join(ROOT, 'src'))
      .filter((file) => !file.includes(join('src', 'test')))
      .filter((file) => /\blocalStorage\s*(\.|\[)/.test(code(readFileSync(file, 'utf8'))))
      .map((file) => relative(ROOT, file))
    expect(callers.sort()).toEqual([...STORAGE_CALLERS].sort())
  })

  it('lists every literal key passed to localStorage, with or without the prefix', () => {
    const unlisted: Array<string> = []
    for (const file of sourceFiles(join(ROOT, 'src'))) {
      const text = code(readFileSync(file, 'utf8'))
      for (const [, key] of text.matchAll(/localStorage\.(?:getItem|removeItem|setItem)\(\s*['"`]([^'"`]+)['"`]/g)) {
        if (!listed.has(key as string)) unlisted.push(`${key} (${relative(ROOT, file)})`)
      }
    }
    expect(unlisted).toEqual([])
  })

  it('lists each key once', () => {
    expect(keyList.keys.length).toBe(listed.size)
  })

  it('lists exactly the keys the React source can write', () => {
    const inSource = keysInSource()
    expect(
      [...inSource.keys()].filter((key) => !listed.has(key)).map((key) => `${key} (${inSource.get(key)})`),
    ).toEqual([])
    expect([...listed].filter((key) => !inSource.has(key))).toEqual([])
  })

  it('lists no key for a Tool that never saves, beyond the ones it names', () => {
    for (const { keys: allowed = [], tool } of keyList.neverSaved) {
      expect(keyList.keys.filter((k) => k.owner === tool && !allowed.includes(k.key)).map((k) => k.key)).toEqual([])
    }
  })

  it('has golden values only for listed keys', () => {
    expect(golden.entries.filter((e) => !listed.has(e.key)).map((e) => e.id)).toEqual([])
  })

  it('names only listed keys in every snapshot of storage', () => {
    const offList = golden.entries.flatMap((e) =>
      [e.stored, e.storageAfterOpen ?? {}, e.storageAfterWrite ?? {}]
        .flatMap((snapshot) => Object.keys(snapshot))
        .filter((key) => !listed.has(key))
        .map((key) => `${e.id}: ${key}`),
    )
    expect(offList).toEqual([])
  })

  it.each(RESTORED.map(({ key }) => key))('has a current shape and a default for %s', (key) => {
    expect(golden.entries.some((e) => e.key === key && e.shape === 'current')).toBe(true)
    expect(Object.hasOwn(golden.defaults, key)).toBe(true)
  })

  it('records what React restores beside every deliberate difference', () => {
    for (const entry of golden.entries.filter((e) => e.deliberate !== undefined)) {
      expect(typeof entry.react, entry.id).toBe('string')
      expect(JSON.parse(entry.react ?? 'null'), entry.id).not.toEqual(entry.expected)
    }
  })

  it('expects no lone surrogate, which a Rust String cannot hold', () => {
    const lone = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/
    // Walks parsed names and values: JSON.stringify escapes a lone surrogate, which would hide it.
    const holdsLone = (value: unknown): boolean =>
      typeof value === 'string'
        ? lone.test(value)
        : typeof value === 'object' &&
          value !== null &&
          Object.entries(value).some(([name, field]) => holdsLone(name) || holdsLone(field))
    expect(holdsLone({ source: 'a\ud83d' })).toBe(true)
    expect(holdsLone({ 'a\ud83d': '' })).toBe(true)
    // Anywhere in the file: one would make all of it unreadable to serde_json.
    expect(golden.entries.filter((e) => holdsLone(e)).map((e) => e.id)).toEqual([])
    expect(holdsLone(golden.defaults)).toBe(false)
  })
})
