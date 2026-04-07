import { bench, describe } from 'vitest'

// ---------------------------------------------------------------------------
// CSV Benchmarks
// ---------------------------------------------------------------------------

const smallJson = JSON.stringify(
  Array.from({ length: 10 }, (_, i) => ({ id: i, name: `user${i}`, email: `user${i}@test.com` })),
)
const largeJson = JSON.stringify(
  Array.from({ length: 10_000 }, (_, i) => ({ id: i, name: `user${i}`, email: `user${i}@test.com`, active: i % 2 === 0 })),
)

describe('CSV: jsonToCsv (10 rows)', () => {
  bench('WASM csv', async () => {
    const { jsonToCsv } = await import('../src/wasm/csv')
    await jsonToCsv(smallJson)
  })
})

describe('CSV: jsonToCsv (10,000 rows)', () => {
  bench('WASM csv', async () => {
    const { jsonToCsv } = await import('../src/wasm/csv')
    await jsonToCsv(largeJson)
  })
})

const smallCsv = 'id,name,email\n' + Array.from({ length: 10 }, (_, i) => `${i},user${i},user${i}@test.com`).join('\n')
const largeCsv = 'id,name,email,active\n' + Array.from({ length: 10_000 }, (_, i) => `${i},user${i},user${i}@test.com,${i % 2 === 0}`).join('\n')

describe('CSV: csvToJson (10 rows)', () => {
  bench('WASM csv', async () => {
    const { csvToJson } = await import('../src/wasm/csv')
    await csvToJson(smallCsv, 2)
  })
})

describe('CSV: csvToJson (10,000 rows)', () => {
  bench('WASM csv', async () => {
    const { csvToJson } = await import('../src/wasm/csv')
    await csvToJson(largeCsv, 2)
  })
})

// ---------------------------------------------------------------------------
// Diff Benchmarks
// ---------------------------------------------------------------------------

const smallOriginal = Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n') + '\n'
const smallModified = Array.from({ length: 10 }, (_, i) => (i === 5 ? 'changed line' : `line ${i}`)).join('\n') + '\n'

const largeOriginal = Array.from({ length: 10_000 }, (_, i) => `line ${i}`).join('\n') + '\n'
const largeModified = Array.from({ length: 10_000 }, (_, i) => {
  if (i === 2500) return 'changed line A'
  if (i === 5000) return 'changed line B'
  if (i === 7500) return 'changed line C'
  return `line ${i}`
}).join('\n') + '\n'

describe('Diff: diffLines (10 lines)', () => {
  bench('WASM diff', async () => {
    const { diffLines } = await import('../src/wasm/diff')
    await diffLines(smallOriginal, smallModified)
  })
})

describe('Diff: diffLines (10,000 lines)', () => {
  bench('WASM diff', async () => {
    const { diffLines } = await import('../src/wasm/diff')
    await diffLines(largeOriginal, largeModified)
  })
})

describe('Diff: createUnifiedDiff (10,000 lines)', () => {
  bench('WASM diff', async () => {
    const { createUnifiedDiff } = await import('../src/wasm/diff')
    await createUnifiedDiff(largeOriginal, largeModified, 3)
  })
})

describe('Diff: diffWords (single line)', () => {
  bench('WASM diff', async () => {
    const { diffWords } = await import('../src/wasm/diff')
    await diffWords('the quick brown fox jumps over the lazy dog', 'the slow brown cat jumps over the happy dog')
  })
})

// ---------------------------------------------------------------------------
// Color Benchmarks
// ---------------------------------------------------------------------------

describe('Color: convertColor single (hex → all)', () => {
  bench('WASM color', async () => {
    const { convertColor } = await import('../src/wasm/color')
    await convertColor('#3b82f6', 'hex')
  })
})

describe('Color: convertColor single (oklch → all)', () => {
  bench('WASM color', async () => {
    const { convertColor } = await import('../src/wasm/color')
    await convertColor('oklch(0.6655 0.0797 18.38)', 'oklch')
  })
})

describe('Color: convertColor batch (1,000 hex conversions)', () => {
  const colors = Array.from({ length: 1_000 }, (_, i) => {
    const r = (i * 7) % 256
    const g = (i * 13) % 256
    const b = (i * 19) % 256
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  })

  bench('WASM color', async () => {
    const { convertColor } = await import('../src/wasm/color')
    for (const hex of colors) {
      await convertColor(hex, 'hex')
    }
  })
})
