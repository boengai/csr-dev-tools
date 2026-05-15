import { describe, expect, it, vi } from 'vitest'

import { createToggleStore } from './createToggleStore'

describe('createToggleStore', () => {
  it('starts closed', () => {
    const useStore = createToggleStore()
    expect(useStore.getState().isOpen).toBe(false)
  })

  it('open() sets isOpen to true', () => {
    const useStore = createToggleStore()
    useStore.getState().open()
    expect(useStore.getState().isOpen).toBe(true)
  })

  it('close() sets isOpen to false', () => {
    const useStore = createToggleStore()
    useStore.getState().open()
    useStore.getState().close()
    expect(useStore.getState().isOpen).toBe(false)
  })

  it('toggle() flips isOpen in both directions', () => {
    const useStore = createToggleStore()
    useStore.getState().toggle()
    expect(useStore.getState().isOpen).toBe(true)
    useStore.getState().toggle()
    expect(useStore.getState().isOpen).toBe(false)
  })

  it('onOpen fires synchronously inside open() before the state update', () => {
    let isOpenWhenCallbackRan: boolean | null = null
    const useStore = createToggleStore({
      onOpen: () => {
        isOpenWhenCallbackRan = useStore.getState().isOpen
      },
    })
    useStore.getState().open()
    expect(isOpenWhenCallbackRan).toBe(false)
    expect(useStore.getState().isOpen).toBe(true)
  })

  it('onOpen fires inside toggle() when transitioning from closed to open', () => {
    const onOpen = vi.fn()
    const useStore = createToggleStore({ onOpen })
    useStore.getState().toggle()
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(useStore.getState().isOpen).toBe(true)
  })

  it('onOpen does NOT fire inside toggle() when transitioning from open to closed', () => {
    const onOpen = vi.fn()
    const useStore = createToggleStore({ onOpen })
    useStore.getState().open()
    onOpen.mockClear()
    useStore.getState().toggle()
    expect(onOpen).not.toHaveBeenCalled()
    expect(useStore.getState().isOpen).toBe(false)
  })

  it('onOpen does NOT fire inside close()', () => {
    const onOpen = vi.fn()
    const useStore = createToggleStore({ onOpen })
    useStore.getState().open()
    onOpen.mockClear()
    useStore.getState().close()
    expect(onOpen).not.toHaveBeenCalled()
  })
})
