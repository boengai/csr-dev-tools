import { bench, describe } from 'vitest'

// ---------------------------------------------------------------------------
// JSON Format Benchmarks
// ---------------------------------------------------------------------------

const smallJson = JSON.stringify({ id: 1, name: 'test', nested: { a: 1, b: [1, 2, 3] } })
const largeJson = JSON.stringify(
  Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    name: `user${i}`,
    email: `user${i}@test.com`,
    active: i % 2 === 0,
    meta: { created: '2024-01-01', role: i % 3 === 0 ? 'admin' : 'user' },
  })),
)

describe('JSON: formatJson (small)', () => {
  bench('WASM json-tools', async () => {
    const { formatJson } = await import('../src/wasm/json-tools')
    await formatJson(smallJson)
  })

  bench('JS JSON.parse+stringify (small, baseline)', () => {
    JSON.stringify(JSON.parse(smallJson), null, 2)
  })
})

describe('JSON: formatJson (10,000 objects)', () => {
  bench('WASM json-tools', async () => {
    const { formatJson } = await import('../src/wasm/json-tools')
    await formatJson(largeJson)
  })

  bench('JS JSON.parse+stringify (10k, baseline)', () => {
    JSON.stringify(JSON.parse(largeJson), null, 2)
  })
})

// ---------------------------------------------------------------------------
// JSON to TypeScript Benchmarks
// ---------------------------------------------------------------------------

const simpleJsonForTs = JSON.stringify({
  id: 1,
  name: 'Alice',
  email: 'alice@test.com',
  active: true,
  tags: ['admin', 'user'],
})

const complexJsonForTs = JSON.stringify({
  users: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `user${i}`,
    address: { street: `${i} Main St`, city: 'Testville', zip: `${10000 + i}` },
    scores: [i * 10, i * 20, i * 30],
    metadata: { created: '2024-01-01', role: i % 3 === 0 ? 'admin' : 'user', verified: i % 2 === 0 },
  })),
  pagination: { page: 1, perPage: 100, total: 5000 },
})

describe('JSON-to-TS: simple object', () => {
  bench('WASM json-tools', async () => {
    const { jsonToTypeScript } = await import('../src/wasm/json-tools')
    await jsonToTypeScript(simpleJsonForTs)
  })
})

describe('JSON-to-TS: complex nested (100 items)', () => {
  bench('WASM json-tools', async () => {
    const { jsonToTypeScript } = await import('../src/wasm/json-tools')
    await jsonToTypeScript(complexJsonForTs)
  })
})

// ---------------------------------------------------------------------------
// JSON Normalize (deep sort) Benchmarks
// ---------------------------------------------------------------------------

const unsortedSmall = JSON.stringify({ z: 1, a: 2, m: { z: 3, a: 4 }, b: [{ z: 5, a: 6 }] })
const unsortedLarge = JSON.stringify(
  Object.fromEntries(
    Array.from({ length: 1_000 }, (_, i) => {
      const key = String.fromCharCode(97 + (i % 26)) + i
      return [key, { nested: { z: i, a: i * 2, m: i * 3 }, value: `val${i}` }]
    }),
  ),
)

describe('JSON: normalizeJson (small)', () => {
  bench('WASM json-tools', async () => {
    const { normalizeJson } = await import('../src/wasm/json-tools')
    await normalizeJson(unsortedSmall)
  })
})

describe('JSON: normalizeJson (1,000 keys)', () => {
  bench('WASM json-tools', async () => {
    const { normalizeJson } = await import('../src/wasm/json-tools')
    await normalizeJson(unsortedLarge)
  })
})

// ---------------------------------------------------------------------------
// JSON Deep Sort Benchmarks
// ---------------------------------------------------------------------------

describe('JSON: deepSortJson (small)', () => {
  bench('WASM json-tools', async () => {
    const { deepSortJson } = await import('../src/wasm/json-tools')
    await deepSortJson(unsortedSmall)
  })
})

describe('JSON: deepSortJson (1,000 keys)', () => {
  bench('WASM json-tools', async () => {
    const { deepSortJson } = await import('../src/wasm/json-tools')
    await deepSortJson(unsortedLarge)
  })
})
