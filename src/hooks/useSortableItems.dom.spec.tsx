/**
 * @vitest-environment jsdom
 */
import type { DragEndEvent } from '@dnd-kit/core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useSortableItems } from './useSortableItems'

type Item = { id: string; name: string; rotation?: number }

const item = (id: string, name = id): Item => ({ id, name })

describe('useSortableItems', () => {
  it('exposes the initial array and empty skipped list', () => {
    const initial = [item('a'), item('b')]
    const { result } = renderHook(() => useSortableItems<Item>(initial))

    expect(result.current.items).toEqual(initial)
    expect(result.current.skipped).toEqual([])
  })

  it('addItems appends to the current items', () => {
    const { result } = renderHook(() => useSortableItems<Item>([item('a')]))

    act(() => {
      result.current.addItems([item('b'), item('c')])
    })

    expect(result.current.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('removeItem drops the matching item', () => {
    const { result } = renderHook(() => useSortableItems<Item>([item('a'), item('b'), item('c')]))

    act(() => {
      result.current.removeItem('b')
    })

    expect(result.current.items.map((i) => i.id)).toEqual(['a', 'c'])
  })

  it('updateItem shallow-merges the partial into the matching item', () => {
    const { result } = renderHook(() =>
      useSortableItems<Item>([
        { id: 'a', name: 'first', rotation: 0 },
        { id: 'b', name: 'second', rotation: 0 },
      ]),
    )

    act(() => {
      result.current.updateItem('a', { rotation: 90 })
    })

    expect(result.current.items[0]).toEqual({ id: 'a', name: 'first', rotation: 90 })
    expect(result.current.items[1]).toEqual({ id: 'b', name: 'second', rotation: 0 })
  })

  it('updateItem is a no-op when the id is missing', () => {
    const initial = [item('a'), item('b')]
    const { result } = renderHook(() => useSortableItems<Item>(initial))

    act(() => {
      result.current.updateItem('missing', { name: 'ghost' })
    })

    expect(result.current.items).toEqual(initial)
  })

  it('rejectFiles REPLACES the skipped list when given an array', () => {
    const { result } = renderHook(() => useSortableItems<Item>())

    act(() => {
      result.current.rejectFiles(['a.txt', 'b.txt'])
    })
    expect(result.current.skipped).toEqual(['a.txt', 'b.txt'])

    act(() => {
      result.current.rejectFiles(['c.txt'])
    })
    expect(result.current.skipped).toEqual(['c.txt'])
  })

  it('rejectFiles supports a functional updater for cumulative append flows', () => {
    const { result } = renderHook(() => useSortableItems<Item>())

    act(() => {
      result.current.rejectFiles(['a.txt'])
    })
    act(() => {
      result.current.rejectFiles((prev) => (prev.includes('a.txt') ? prev : [...prev, 'a.txt']))
      result.current.rejectFiles((prev) => [...prev, 'b.txt'])
    })

    expect(result.current.skipped).toEqual(['a.txt', 'b.txt'])
  })

  it('reset clears both items and skipped', () => {
    const { result } = renderHook(() => useSortableItems<Item>([item('a')]))

    act(() => {
      result.current.rejectFiles(['x.txt'])
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.skipped).toEqual([])
  })

  it('sortableContextProps tracks the current items list', () => {
    const { result } = renderHook(() => useSortableItems<Item>([item('a'), item('b')]))

    expect(result.current.sortableContextProps.items).toEqual(['a', 'b'])

    act(() => {
      result.current.addItems([item('c')])
    })

    expect(result.current.sortableContextProps.items).toEqual(['a', 'b', 'c'])
  })

  it('dndContextProps.onDragEnd re-orders the items by stable id', () => {
    const { result } = renderHook(() => useSortableItems<Item>([item('a'), item('b'), item('c')]))

    act(() => {
      result.current.dndContextProps.onDragEnd({
        active: { id: 'a' },
        over: { id: 'c' },
      } as unknown as DragEndEvent)
    })

    expect(result.current.items.map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('dndContextProps.onDragEnd is a no-op when active === over', () => {
    const initial = [item('a'), item('b')]
    const { result } = renderHook(() => useSortableItems<Item>(initial))

    act(() => {
      result.current.dndContextProps.onDragEnd({
        active: { id: 'a' },
        over: { id: 'a' },
      } as unknown as DragEndEvent)
    })

    expect(result.current.items.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('dndContextProps.onDragEnd is a no-op when over is null', () => {
    const initial = [item('a'), item('b')]
    const { result } = renderHook(() => useSortableItems<Item>(initial))

    act(() => {
      result.current.dndContextProps.onDragEnd({
        active: { id: 'a' },
        over: null,
      } as unknown as DragEndEvent)
    })

    expect(result.current.items).toEqual(initial)
  })

  it('onDragEnd sees the freshest items even after rapid mutations (ref shadow)', () => {
    const { result } = renderHook(() => useSortableItems<Item>([item('a')]))

    // Add two more items, then drag — the drag must reorder against the
    // freshest list, not the stale closure.
    act(() => {
      result.current.addItems([item('b'), item('c')])
    })
    act(() => {
      result.current.dndContextProps.onDragEnd({
        active: { id: 'b' },
        over: { id: 'a' },
      } as unknown as DragEndEvent)
    })

    expect(result.current.items.map((i) => i.id)).toEqual(['b', 'a', 'c'])
  })
})
