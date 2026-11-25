export type Spread = { max: number; median: number; min: number; runs: Array<number> }

export const spread = (runs: Array<number>): Spread => {
  const sorted = [...runs].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const [min, max, upper] = [sorted[0], sorted.at(-1), sorted[middle]]
  const lower = sorted.length % 2 === 0 ? sorted[middle - 1] : upper
  if (min === undefined || max === undefined || upper === undefined || lower === undefined) {
    throw new Error('no runs to summarise')
  }
  if (!runs.every(Number.isFinite)) throw new Error(`not all numbers: ${runs.join(', ')}`)
  return { max, median: (lower + upper) / 2, min, runs }
}

/** One spread per key, over samples that all have the same keys. */
export const spreadByKey = (samples: Array<Record<string, number>>): Record<string, Spread> =>
  Object.fromEntries(
    Object.keys(samples[0] ?? {}).map((key) => [key, spread(samples.map((sample) => sample[key] ?? Number.NaN))]),
  )
