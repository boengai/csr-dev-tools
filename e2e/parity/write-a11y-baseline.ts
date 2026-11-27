/**
 * Writes the a11y baseline (`e2e/parity/a11y-baseline.json`) from a recording
 * run of `a11y.spec.ts` (`PARITY_A11Y_RECORD=1`), which leaves one `a11y.json`
 * per page in the run's output folder. Run through `pnpm test:parity:a11y-baseline`,
 * against React only: the baseline is what React fails today.
 */
import { globSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const OUTPUT = fileURLToPath(new URL('../../test-results/parity-react', import.meta.url))
const BASELINE = fileURLToPath(new URL('./a11y-baseline.json', import.meta.url))

// Per page, the rules it fails and on how many elements.
const pages: Record<string, Record<string, number>> = {}
for (const file of globSync('**/a11y.json', { cwd: OUTPUT })) {
  Object.assign(pages, JSON.parse(readFileSync(`${OUTPUT}/${file}`, 'utf8')))
}
if (Object.keys(pages).length === 0) throw new Error(`No a11y.json under ${OUTPUT}; run the recording first.`)

// Only pages that fail something: a page that is missing has an empty baseline.
const failing = Object.fromEntries(
  Object.entries(pages)
    .filter(([, rules]) => Object.keys(rules).length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([page, rules]) => [page, Object.fromEntries(Object.entries(rules).sort(([a], [b]) => a.localeCompare(b)))]),
)
writeFileSync(BASELINE, `${JSON.stringify(failing, null, 2)}\n`)
process.stdout.write(
  `a11y baseline: ${Object.keys(failing).length} of ${Object.keys(pages).length} pages fail a rule.\n`,
)
