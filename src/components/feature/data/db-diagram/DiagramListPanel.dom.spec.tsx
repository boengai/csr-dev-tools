/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DiagramEditor } from '@/diagram/editor'
import { createInMemoryDiagramStorage } from '@/diagram/storage'
import { nth } from '@/test/nth'

import { DiagramProvider } from './DiagramContext'
import { DiagramListPanel } from './DiagramListPanel'

describe('DiagramListPanel — diagram index subscription', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const renderPanel = (editor: DiagramEditor) =>
    render(
      <DiagramProvider editor={editor}>
        <DiagramListPanel onClose={() => {}} />
      </DiagramProvider>,
    )

  it('renders the saved index on mount', () => {
    const editor = new DiagramEditor({ autosaveMs: 1000, storage: createInMemoryDiagramStorage() })
    act(() => {
      editor.addTable({ name: 'users' })
      vi.advanceTimersByTime(1000)
    })
    const entry = nth(editor.listDiagrams(), 0)

    renderPanel(editor)
    expect(screen.getByText(entry.name)).toBeInTheDocument()
  })

  it('re-renders when the editor announces an index change (rename)', () => {
    const editor = new DiagramEditor({ autosaveMs: 1000, storage: createInMemoryDiagramStorage() })
    act(() => {
      editor.addTable({ name: 'users' })
      vi.advanceTimersByTime(1000)
    })
    const entry = nth(editor.listDiagrams(), 0)
    renderPanel(editor)

    act(() => {
      editor.renameDiagram(entry.id, 'Renamed diagram')
    })
    expect(screen.getByText('Renamed diagram')).toBeInTheDocument()
  })
})
