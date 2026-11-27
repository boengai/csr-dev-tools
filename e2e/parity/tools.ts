/**
 * The Tools the parity harness runs over, read from the registry
 * (`src/constants/tool-routes.ts`), so a Tool joins the suites with no
 * per-Tool test work. `PARITY_TOOLS` (comma-separated keys, set by
 * `defineParityConfig`) narrows them to the Tools another build has ported.
 */
import { TOOL_ROUTES } from '../../src/constants/tool-routes'
import type { ToolLayout, ToolRoute } from '../../src/types/constants/tool-registry'
import type { ShellLayout } from './layout-fixtures'

/** The Tool keys this run is limited to, or `null` for every Tool. */
export const parityToolFilter = (): ReadonlySet<string> | null => {
  const raw = process.env.PARITY_TOOLS?.trim()
  if (!raw) return null
  return new Set(raw.split(',').map((key) => key.trim()))
}

/** Every Tool this run covers, in registry order. */
export const parityTools = (): Array<ToolRoute> => {
  const filter = parityToolFilter()
  if (!filter) return TOOL_ROUTES
  // A typo must not shrink the run unnoticed: every key has to name a Tool.
  const unknown = [...filter].filter((key) => !TOOL_ROUTES.some((tool) => tool.key === key))
  if (unknown.length > 0) throw new Error(`PARITY_TOOLS names no Tool: ${unknown.join(', ')}`)
  return TOOL_ROUTES.filter((tool) => filter.has(tool.key))
}

export const isShellLayout = (layout: ToolLayout): layout is ShellLayout => layout !== 'custom'

export const toolsWithLayout = (layout: ShellLayout): Array<ToolRoute> =>
  parityTools().filter((tool) => tool.layout === layout)

export const SHELL_LAYOUTS: ReadonlyArray<ShellLayout> = [
  'codec',
  'comparator',
  'file-processor',
  'generator',
  'transformer',
]
