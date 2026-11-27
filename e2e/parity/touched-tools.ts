/**
 * Prints the Tool keys (comma-separated) whose own module a change touches:
 * the files under `src/components/feature/` that a `COMPONENT_LOADERS` entry
 * in `src/constants/tool-registry.ts` imports. A change to a shared shell or
 * component names no Tool; set `SCREENSHOT_TOOLS` by hand for those.
 *
 *   node e2e/parity/touched-tools.ts <base-ref>     # e.g. origin/main
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const base = process.argv[2]
if (!base) throw new Error('usage: node e2e/parity/touched-tools.ts <base-ref>')

const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)

const registry = readFileSync(new URL('../../src/constants/tool-registry.ts', import.meta.url), 'utf8')
const loader = /'([a-z0-9-]+)': loadNamed\(\s*\(\) => import\('@\/components\/feature\/([^']+)'\)/g
const touched = [...registry.matchAll(loader)]
  .filter(([, , module]) => {
    const path = `src/components/feature/${module}`
    return changed.some((file) => file.startsWith(`${path}.`) || file.startsWith(`${path}/`))
  })
  .map(([, key]) => key)

process.stdout.write(`${touched.join(',')}\n`)
