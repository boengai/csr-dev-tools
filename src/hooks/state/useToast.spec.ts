import { beforeEach, describe, expect, it } from 'vitest'

import { useToast } from './useToast'

beforeEach(() => {
  useToast.setState({ items: [] })
})

describe('useToast helpers', () => {
  it('showError appends an error-type item and returns its id', () => {
    const id = useToast.getState().showError('Failed')

    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Failed')
    expect(items[0].type).toBe('error')
    expect(items[0].id).toBe(id)
  })

  it('showSuccess appends a success-type item and returns its id', () => {
    const id = useToast.getState().showSuccess('Done')

    const items = useToast.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Done')
    expect(items[0].type).toBe('success')
    expect(items[0].id).toBe(id)
  })

  it('helpers append to the same items array as the legacy toast() dispatcher', () => {
    useToast.getState().showError('one')
    useToast.getState().toast({ action: 'add', item: { label: 'two', type: 'success' } })
    useToast.getState().showSuccess('three')

    const items = useToast.getState().items
    expect(items.map((i) => i.label)).toEqual(['one', 'two', 'three'])
    expect(items.map((i) => i.type)).toEqual(['error', 'success', 'success'])
  })
})
