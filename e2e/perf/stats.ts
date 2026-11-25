export type Spread = { max: number; median: number; min: number; runs: Array<number> }

export const spread = (runs: Array<number>): Spread => {
  const sorted = [...runs].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const upper = sorted[middle] ?? Number.NaN
  const lower = sorted.length % 2 === 0 ? (sorted[middle - 1] ?? Number.NaN) : upper
  return { max: sorted.at(-1) ?? Number.NaN, median: (lower + upper) / 2, min: sorted[0] ?? Number.NaN, runs }
}

export const RESOURCE_KINDS = ['html', 'css', 'js', 'wasm', 'font', 'image', 'other'] as const

export type ResourceKind = (typeof RESOURCE_KINDS)[number]

export const kindOfMime = (mime: string): ResourceKind => {
  if (mime.includes('wasm')) return 'wasm'
  if (mime.includes('javascript')) return 'js'
  if (mime.startsWith('text/html')) return 'html'
  if (mime.startsWith('text/css')) return 'css'
  if (mime.startsWith('font/') || mime.includes('font-')) return 'font'
  if (mime.startsWith('image/')) return 'image'
  return 'other'
}
