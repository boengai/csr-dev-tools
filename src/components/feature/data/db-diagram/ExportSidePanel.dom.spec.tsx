/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { DiagramEditor } from '@/diagram/editor'
import type { DiagramDocument } from '@/types'

import { ExportSidePanel } from './ExportSidePanel'

vi.mock('./DiagramContext', () => ({
  useDiagram: vi.fn(() => ({
    editor: mockEditor,
    document: mockDocument,
  })),
}))

const mockDocument = {} as DiagramDocument
const mockEditor = {} as DiagramEditor

describe('ExportSidePanel', () => {
  it('shows the derived value in the pre block', () => {
    render(
      <ExportSidePanel
        copyLabel="SQL"
        derive={() => 'SELECT 1;'}
        emptyPlaceholder="-- empty"
        onClose={() => {}}
        testId="panel"
        title="SQL Export"
      />,
    )
    expect(screen.getByText('SELECT 1;')).toBeTruthy()
  })

  it('shows the empty placeholder when derive returns empty string', () => {
    render(
      <ExportSidePanel
        copyLabel="SQL"
        derive={() => ''}
        emptyPlaceholder="-- Add tables"
        onClose={() => {}}
        testId="panel"
        title="SQL Export"
      />,
    )
    expect(screen.getByText('-- Add tables')).toBeTruthy()
  })

  it('passes the editor to derive', () => {
    const derive = vi.fn(() => 'output')
    render(
      <ExportSidePanel
        copyLabel="X"
        derive={derive}
        emptyPlaceholder=""
        onClose={() => {}}
        testId="panel"
        title="X"
      />,
    )
    expect(derive).toHaveBeenCalledWith(mockEditor)
  })

  it('renders the controls slot when provided', () => {
    render(
      <ExportSidePanel
        controls={<span>dialect picker</span>}
        copyLabel="SQL"
        derive={() => 'x'}
        emptyPlaceholder=""
        onClose={() => {}}
        testId="panel"
        title="SQL Export"
      />,
    )
    expect(screen.getByText('dialect picker')).toBeTruthy()
  })

  it('renders the action slot with the derived value', () => {
    render(
      <ExportSidePanel
        action={(value) => <button type="button">Download: {value}</button>}
        copyLabel="SQL"
        derive={() => 'SELECT 1;'}
        emptyPlaceholder=""
        onClose={() => {}}
        testId="panel"
        title="SQL Export"
      />,
    )
    expect(screen.getByRole('button', { name: 'Download: SELECT 1;' })).toBeTruthy()
  })

  it('does not render an action wrapper when action is omitted', () => {
    render(
      <ExportSidePanel
        copyLabel="TypeScript"
        derive={() => 'type X = {}'}
        emptyPlaceholder=""
        onClose={() => {}}
        testId="panel"
        title="TypeScript Export"
      />,
    )
    expect(screen.queryByRole('button', { name: /download/i })).toBeNull()
  })

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <ExportSidePanel
        copyLabel="SQL"
        derive={() => 'x'}
        emptyPlaceholder=""
        onClose={onClose}
        testId="panel"
        title="SQL Export"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
