/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DiagramStorageError } from '@/diagram/codecs/storage'
import { DiagramEditor } from '@/diagram/editor'
import { createInMemoryDiagramStorage } from '@/diagram/storage'

import { DiagramProvider } from './DiagramContext'
import { StorageStatusIndicator } from './StorageStatusIndicator'

describe('StorageStatusIndicator', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders nothing while storage is healthy and an alert once a save fails', () => {
    const storage = createInMemoryDiagramStorage()
    let fail = true
    const save = storage.saveDiagramWithIndex
    storage.saveDiagramWithIndex = (...args) => {
      if (fail) throw new DiagramStorageError('full')
      return save(...args)
    }
    const editor = new DiagramEditor({ autosaveMs: 1000, storage })

    render(
      <DiagramProvider editor={editor}>
        <StorageStatusIndicator />
      </DiagramProvider>,
    )
    expect(screen.queryByRole('alert')).toBeNull()

    act(() => {
      editor.addTable({ name: 'users' })
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('alert').textContent).toMatch(/storage is full/i)

    fail = false
    act(() => {
      editor.addTable({ name: 'orders' })
      vi.advanceTimersByTime(1000)
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
