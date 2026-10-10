import { beforeEach, describe, expect, it } from 'vitest'

import { nth } from '@/test/nth'

import { useToast } from './useToast'

beforeEach(() => {
  useToast.setState({ items: [] })
})

describe('useToast helpers', () => {
  it('showError appends an error-type item and returns its id', () => {
    const id = useToast.getState().showError('Failed')

    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(nth(items, 0).label).toBe('Failed')
    expect(nth(items, 0).type).toBe('error')
    expect(nth(items, 0).id).toBe(id)
  })

  it('showSuccess appends a success-type item and returns its id', () => {
    const id = useToast.getState().showSuccess('Done')

    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(nth(items, 0).label).toBe('Done')
    expect(nth(items, 0).type).toBe('success')
    expect(nth(items, 0).id).toBe(id)
  })

  it('multiple helper calls accumulate items in call order', () => {
    useToast.getState().showError('one')
    useToast.getState().showSuccess('two')
    useToast.getState().showSuccess('three')

    const items = useToast.getState().items
    expect(items.map((i) => i.label)).toEqual(['one', 'two', 'three'])
    expect(items.map((i) => i.type)).toEqual(['error', 'success', 'success'])
  })
})

describe('useToast dismiss + ids', () => {
  it('mints unique ids for toasts created within the same millisecond', () => {
    const ids = Array.from({ length: 5 }, () => useToast.getState().showSuccess('x'))
    expect(new Set(ids).size).toBe(5)
  })

  it('dismiss removes only the matching item', () => {
    const a = useToast.getState().showSuccess('a')
    const b = useToast.getState().showError('b')

    useToast.getState().dismiss(a)

    expect(useToast.getState().items.map((i) => i.id)).toEqual([b])
  })

  it('dismiss of an unknown id is a no-op', () => {
    useToast.getState().showSuccess('a')
    useToast.getState().dismiss('nope')
    expect(useToast.getState().items).toHaveLength(1)
  })
})
