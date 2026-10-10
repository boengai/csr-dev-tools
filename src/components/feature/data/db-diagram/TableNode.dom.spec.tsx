/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import type { NodeProps } from '@xyflow/react'
import { ReactFlowProvider } from '@xyflow/react'
import { describe, expect, it, vi } from 'vitest'

import { DiagramEditor } from '@/diagram/editor'
import { createInMemoryDiagramStorage } from '@/diagram/storage'
import type { TableNode } from '@/types'

import { DiagramProvider } from './DiagramContext'
import { TableNodeComponent } from './TableNode'

const setup = () => {
  const editor = new DiagramEditor({ storage: createInMemoryDiagramStorage() })
  const tableId = editor.addTable({ name: 'users' })
  editor.addColumn(tableId, {
    name: 'email',
    type: 'TEXT',
    constraints: { isPrimaryKey: false, isForeignKey: false, isNullable: true, isUnique: true },
  })
  const table = editor.getDocument().tables[tableId]
  const props = {
    data: { columns: table.columns, tableName: table.name },
    id: tableId,
  } as unknown as NodeProps<TableNode>
  render(
    <ReactFlowProvider>
      <DiagramProvider editor={editor}>
        <TableNodeComponent {...props} />
      </DiagramProvider>
    </ReactFlowProvider>,
  )
  const columns = table.columns
  return { columns, editor, tableId }
}

describe('TableNodeComponent', () => {
  it('labels each column row input', () => {
    const { columns } = setup()
    columns.forEach((_, i) => {
      expect(screen.getByLabelText(`Column ${i + 1} name`)).toBeTruthy()
      expect(screen.getByRole('combobox', { name: `Column ${i + 1} type` })).toBeTruthy()
    })
    const names = screen.getAllByRole('textbox').map((el) => el.getAttribute('name'))
    expect(new Set(names).size).toBe(names.length)
  })

  it('exposes constraint toggles as pressed/unpressed buttons', () => {
    const { columns } = setup()
    const emailRow = columns.length - 1
    const unique = screen.getAllByRole('button', { name: 'Unique' })[emailRow]
    expect(unique.getAttribute('aria-pressed')).toBe('true')
    const primary = screen.getAllByRole('button', { name: 'Primary key' })[emailRow]
    expect(primary.getAttribute('aria-pressed')).toBe('false')
    expect(screen.getAllByRole('button', { name: 'Foreign key' })).toHaveLength(columns.length)
    expect(screen.getAllByRole('button', { name: 'Not null' })).toHaveLength(columns.length)
  })

  it('dispatches edits straight to the editor with its node id', () => {
    const { columns, editor, tableId } = setup()
    const updateColumn = vi.spyOn(editor, 'updateColumn')
    const deleteColumn = vi.spyOn(editor, 'deleteColumn')
    const last = columns.length

    fireEvent.change(screen.getByLabelText(`Column ${last} name`), { target: { value: 'mail' } })
    expect(updateColumn).toHaveBeenCalledWith(tableId, columns[last - 1].id, { name: 'mail' })

    fireEvent.click(screen.getByRole('button', { name: `Delete column ${last}` }))
    expect(deleteColumn).toHaveBeenCalledWith(tableId, columns[last - 1].id)
  })
})
