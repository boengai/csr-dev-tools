import { describe, expect, it } from 'vitest'

import { createDefaultIdMinters, createSequentialIdMinters } from './id-minters'

describe('createSequentialIdMinters', () => {
  it('mints prefixed sequential ids per entity type with independent counters', () => {
    const minters = createSequentialIdMinters()
    expect(minters.table()).toBe('t_1')
    expect(minters.table()).toBe('t_2')
    expect(minters.column()).toBe('c_1')
    expect(minters.column()).toBe('c_2')
    expect(minters.relation()).toBe('r_1')
    expect(minters.table()).toBe('t_3')
  })

  it('returns a fresh set of counters per call', () => {
    const a = createSequentialIdMinters()
    const b = createSequentialIdMinters()
    a.table()
    a.table()
    expect(b.table()).toBe('t_1')
  })
})

describe('createDefaultIdMinters', () => {
  it('mints the prefixed base36 timestamp shape per entity type', () => {
    const minters = createDefaultIdMinters()
    expect(minters.table()).toMatch(/^t_[0-9a-z]+_[0-9a-z]+$/)
    expect(minters.column()).toMatch(/^c_[0-9a-z]+_[0-9a-z]+$/)
    expect(minters.relation()).toMatch(/^r_[0-9a-z]+_[0-9a-z]+$/)
  })

  it('returns unique ids within an entity type', () => {
    const minters = createDefaultIdMinters()
    const ids = new Set([minters.table(), minters.table(), minters.table()])
    expect(ids.size).toBe(3)
  })

  it('uses independent counters per entity type', () => {
    const minters = createDefaultIdMinters()
    const t1 = minters.table()
    const c1 = minters.column()
    // First id of each type ends in the same counter suffix `_1` (base36)
    expect(t1.endsWith('_1')).toBe(true)
    expect(c1.endsWith('_1')).toBe(true)
  })
})
