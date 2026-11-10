/**
 * Layout guard (ADR-0027). Keeps tools from drifting back to hand-built
 * layouts: every tool declares a `layout` in `tool-routes.ts`, and a tool that
 * is not `custom` and not pending migration must render its layout shell and
 * must not build its own dialog.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { TOOL_ROUTES } from '@/constants/tool-routes'

import { LAYOUT_MIGRATION_PENDING, LAYOUT_SHELL, readToolSources } from './layout-migration'

const ADR_DIR = join(__dirname, '..', '..', 'docs', 'adr')
const HAND_BUILT_FRAME = /<(ToolDialogFrame|UploadDialogFrame|ToolDialogShell)\b/
const sources = readToolSources()

const rendersShell = (source: string, shell: string) => new RegExp(`<${shell}\\b`).test(source)

describe('layout guard', () => {
  it('resolves a source module for every tool', () => {
    expect([...sources.keys()].sort()).toEqual(TOOL_ROUTES.map((r) => r.key).sort())
  })

  it.each(TOOL_ROUTES.filter((r) => r.layout === 'custom').map((r) => [r.key, r.layoutOptOutAdr] as const))(
    '%s opts out with an ADR that exists (%s)',
    (_key, adr) => {
      expect(adr).toMatch(/^ADR-\d{4}$/)
      const number = (adr as string).slice(4)
      expect(readdirSync(ADR_DIR).some((f) => f.startsWith(`${number}-`))).toBe(true)
    },
  )

  it('sets layoutOptOutAdr only on custom tools', () => {
    const stray = TOOL_ROUTES.filter((r) => r.layout !== 'custom' && r.layoutOptOutAdr !== undefined)
    expect(stray.map((r) => r.key)).toEqual([])
  })

  it('never lists a custom tool as pending migration', () => {
    const custom = TOOL_ROUTES.filter((r) => r.layout === 'custom' && LAYOUT_MIGRATION_PENDING.has(r.key))
    expect(custom.map((r) => r.key)).toEqual([])
  })

  it('lists only real tools as pending migration', () => {
    const known = new Set(TOOL_ROUTES.map((r) => r.key))
    expect([...LAYOUT_MIGRATION_PENDING].filter((k) => !known.has(k))).toEqual([])
  })

  const migrated = TOOL_ROUTES.filter((r) => r.layout !== 'custom' && !LAYOUT_MIGRATION_PENDING.has(r.key))

  it.each(migrated.map((r) => [r.key, r.layout] as const))('%s renders its %s shell', (key, layout) => {
    const shell = LAYOUT_SHELL[layout as keyof typeof LAYOUT_SHELL]
    expect(rendersShell(sources.get(key) ?? '', shell)).toBe(true)
  })

  it.each(migrated.map((r) => [r.key] as const))('%s does not build its own dialog', (key) => {
    expect(sources.get(key) ?? '').not.toMatch(HAND_BUILT_FRAME)
  })

  // Ratchet: the pending list may only shrink.
  it.each([...LAYOUT_MIGRATION_PENDING].map((k) => [k] as const))(
    '%s is still pending (remove it from LAYOUT_MIGRATION_PENDING once it renders its shell)',
    (key) => {
      const route = TOOL_ROUTES.find((r) => r.key === key)
      const shell = LAYOUT_SHELL[route?.layout as keyof typeof LAYOUT_SHELL]
      expect(rendersShell(sources.get(key) ?? '', shell)).toBe(false)
    },
  )

  // Custom tools opt out of a shell, not of the error rule: input errors go in
  // <ToolStatus>, never in a hand-built banner or an off-theme colour class
  // (`text-red-400` and friends don't exist in this theme and render white).
  const custom = TOOL_ROUTES.filter((r) => r.layout === 'custom')

  it.each(custom.map((r) => [r.key] as const))('%s shows errors through ToolStatus, not ErrorBanner', (key) => {
    expect(sources.get(key) ?? '').not.toMatch(/<ErrorBanner\b/)
  })

  it.each(custom.map((r) => [r.key] as const))('%s uses no off-theme red/yellow text classes', (key) => {
    expect(sources.get(key) ?? '').not.toMatch(/\btext-(red|yellow)-\d{2,3}\b/)
  })

  it('keeps docs/ux in step with the layout types', () => {
    for (const layout of Object.keys(LAYOUT_SHELL)) {
      expect(existsSync(join(__dirname, '..', '..', 'docs', 'ux', `${layout}.md`))).toBe(true)
    }
  })
})
