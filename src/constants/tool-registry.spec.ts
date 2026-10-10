import { describe, expect, it } from 'vitest'

import { getToolEntry, TOOL_REGISTRY, TOOL_REGISTRY_MAP } from './tool-registry'
import { TOOL_ROUTES, toolRoutePath } from './tool-routes'

describe('TOOL_ROUTES', () => {
  it('derives routePath from the key', () => {
    for (const route of TOOL_ROUTES) expect(route.routePath).toBe(`/tools/${route.key}`)
    expect(toolRoutePath('json-formatter')).toBe('/tools/json-formatter')
  })

  it('defaults seo.title to "<name> - CSR Dev Tools"', () => {
    const route = TOOL_ROUTES.find((r) => r.key === 'aes-encrypt-decrypt')
    expect(route?.seo.title).toBe('AES Encrypt/Decrypt - CSR Dev Tools')
  })

  it('keeps an explicit seo.title override', () => {
    const route = TOOL_ROUTES.find((r) => r.key === 'http-status-codes')
    expect(route?.seo.title).toBe('HTTP Status Codes Reference - CSR Dev Tools')
  })

  it('has unique keys', () => {
    expect(new Set(TOOL_ROUTES.map((r) => r.key)).size).toBe(TOOL_ROUTES.length)
  })
})

describe('TOOL_REGISTRY', () => {
  it('has one entry with a component per route', () => {
    expect(TOOL_REGISTRY).toHaveLength(TOOL_ROUTES.length)
    for (const entry of TOOL_REGISTRY) expect(entry.component).toBeDefined()
  })
})

describe('getToolEntry', () => {
  it('returns the entry for a known key', () => {
    expect(getToolEntry('json-formatter')).toBe(TOOL_REGISTRY_MAP['json-formatter'])
  })

  it('returns undefined for unknown, empty and prototype keys', () => {
    expect(getToolEntry('not-a-tool')).toBeUndefined()
    expect(getToolEntry(undefined)).toBeUndefined()
    expect(getToolEntry(null)).toBeUndefined()
    expect(getToolEntry('constructor')).toBeUndefined()
    expect(getToolEntry('__proto__')).toBeUndefined()
  })
})
