/**
 * Layout-shell migration bookkeeping (ADR-0027). Test-only: shared by the
 * layout guard (`layout-guard.spec.ts`) and the layout contract suites
 * (`src/components/common/<shell>/*.contract.dom.spec.tsx`).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import type { ToolLayout, ToolRegistryKey } from '@/types'

/** The shell component each non-`custom` layout is built from. */
export const LAYOUT_SHELL: Record<Exclude<ToolLayout, 'custom'>, string> = {
  codec: 'CodecShell',
  comparator: 'ComparatorShell',
  'file-processor': 'FileProcessorShell',
  generator: 'GeneratorShell',
  transformer: 'TransformerShell',
}

/**
 * Tools tagged with a layout whose shell they are not yet built from. The
 * guard and the contract suites skip these. The list may only shrink: the
 * guard fails when a listed tool already renders its shell, so moving a tool
 * means deleting its line here. See docs/ux/README.md → Migration.
 */
export const LAYOUT_MIGRATION_PENDING: ReadonlySet<ToolRegistryKey> = new Set<ToolRegistryKey>([
  // Empty: every Tool with a layout is built from its shell (2026-11-10).
])

const SRC_DIR = join(__dirname, '..')

/**
 * Reads the source of the module each tool's `COMPONENT_LOADERS` entry
 * imports. A directory module (e.g. `db-diagram/`) yields its non-spec files
 * concatenated.
 */
export const readToolSources = (): Map<ToolRegistryKey, string> => {
  const registry = readFileSync(join(SRC_DIR, 'constants', 'tool-registry.ts'), 'utf8')
  const loader = /'([a-z0-9-]+)': loadNamed\(\s*\(\) => import\('@\/components\/feature\/([^']+)'\)/g
  const sources = new Map<ToolRegistryKey, string>()
  for (const [, key, modulePath] of registry.matchAll(loader)) {
    const base = join(SRC_DIR, 'components', 'feature', modulePath as string)
    let source: string
    try {
      source = readFileSync(`${base}.tsx`, 'utf8')
    } catch {
      if (!statSync(base).isDirectory()) throw new Error(`No module for ${key}: ${base}`)
      source = readdirSync(base)
        .filter((f) => /\.tsx?$/.test(f) && !/\.spec\.tsx?$/.test(f))
        .map((f) => readFileSync(join(base, f), 'utf8'))
        .join('\n')
    }
    sources.set(key as ToolRegistryKey, source)
  }
  return sources
}
