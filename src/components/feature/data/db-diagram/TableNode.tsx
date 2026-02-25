import type { Node, NodeProps } from '@xyflow/react'

import { Handle, Position } from '@xyflow/react'
import { useCallback, useRef, useState } from 'react'

import type { ColumnType, TableColumn, TableNodeData } from '@/types'

import { XIcon } from '@/components/common/icon'
import { COLUMN_TYPES } from '@/utils'

export type TableNode = Node<TableNodeData, 'tableNode'>

const ConstraintToggle = ({
  active,
  color,
  label,
  onClick,
}: {
  active: boolean
  color: string
  label: string
  onClick: () => void
}) => (
  <button
    className={`rounded px-1 py-0.5 text-[10px] leading-none font-bold transition-colors ${
      active ? `${color} text-gray-950` : 'bg-gray-800 text-gray-500'
    }`}
    onClick={(e) => {
      e.stopPropagation()
      onClick()
    }}
    title={label}
    type="button"
  >
    {label}
  </button>
)

export const TableNodeComponent = ({ data, id }: NodeProps<TableNode>) => {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(data.tableName)
  const inputRef = useRef<HTMLInputElement>(null)

  const commitName = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== data.tableName) {
      data.onTableNameChange(trimmed)
    } else {
      setEditName(data.tableName)
    }
    setEditing(false)
  }, [editName, data])

  const handleConstraintChange = (
    column: TableColumn,
    field: 'isForeignKey' | 'isNullable' | 'isPrimaryKey' | 'isUnique',
  ) => {
    data.onColumnChange(column.id, {
      constraints: { ...column.constraints, [field]: !column.constraints[field] },
    })
  }

  return (
    <div
      className="min-w-[220px] rounded-lg border border-gray-700 bg-gray-900 shadow-lg"
      data-testid={`table-node-${id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-gray-700 bg-gray-800 px-3 py-2">
        {editing ? (
          <input
            autoFocus
            className="text-sm w-full rounded bg-gray-700 px-1 py-0.5 font-bold text-white outline-none"
            onBlur={commitName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') {
                setEditName(data.tableName)
                setEditing(false)
              }
            }}
            ref={inputRef}
            value={editName}
          />
        ) : (
          <button
            className="text-sm hover:text-blue-400 font-bold text-white"
            onClick={() => {
              setEditName(data.tableName)
              setEditing(true)
            }}
            type="button"
          >
            🗄️ {data.tableName}
          </button>
        )}
        <button
          className="hover:text-red-400 ml-2 text-gray-500"
          onClick={() => data.onDeleteTable()}
          title="Delete table"
          type="button"
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* Columns */}
      <div className="flex flex-col">
        {data.columns.map((col) => (
          <div className="group relative flex items-center border-b border-gray-800 px-1 py-1" key={col.id}>
            {/* Target handle (left) */}
            <Handle
              className="left-0! h-2.5! w-2.5! rounded-full! border-2! border-gray-600! bg-gray-400!"
              id={`${id}-${col.id}-target`}
              position={Position.Left}
              style={{ top: '50%' }}
              type="target"
            />

            <div className="flex flex-1 items-center gap-1 pr-2 pl-2">
              {/* Column name */}
              <input
                className="text-xs w-20 shrink-0 bg-transparent text-gray-300 outline-none focus:text-white"
                onChange={(e) => data.onColumnChange(col.id, { name: e.target.value })}
                value={col.name}
              />

              {/* Type dropdown */}
              <select
                className="h-5 shrink-0 rounded bg-gray-800 px-0.5 text-[10px] text-gray-400 outline-none"
                onChange={(e) => data.onColumnChange(col.id, { type: e.target.value as ColumnType })}
                value={col.type}
              >
                {COLUMN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Constraint toggles */}
              <div className="flex gap-0.5">
                <ConstraintToggle
                  active={col.constraints.isPrimaryKey}
                  color="bg-yellow-500"
                  label="PK"
                  onClick={() => handleConstraintChange(col, 'isPrimaryKey')}
                />
                <ConstraintToggle
                  active={col.constraints.isForeignKey}
                  color="bg-blue-500"
                  label="FK"
                  onClick={() => handleConstraintChange(col, 'isForeignKey')}
                />
                <ConstraintToggle
                  active={!col.constraints.isNullable}
                  color="bg-red-500"
                  label="NN"
                  onClick={() => handleConstraintChange(col, 'isNullable')}
                />
                <ConstraintToggle
                  active={col.constraints.isUnique}
                  color="bg-green-500"
                  label="UQ"
                  onClick={() => handleConstraintChange(col, 'isUnique')}
                />
              </div>

              {/* Delete column */}
              <button
                className="hover:text-red-400 ml-auto text-gray-600 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => data.onDeleteColumn(col.id)}
                title="Delete column"
                type="button"
              >
                <XIcon size={12} />
              </button>
            </div>

            {/* Source handle (right) */}
            <Handle
              className="right-0! h-2.5! w-2.5! rounded-full! border-2! border-gray-600! bg-gray-400!"
              id={`${id}-${col.id}-source`}
              position={Position.Right}
              style={{ top: '50%' }}
              type="source"
            />
          </div>
        ))}
      </div>

      {/* Add Column button */}
      <button
        className="text-xs w-full rounded-b-lg px-3 py-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
        data-testid={`add-column-btn-${id}`}
        onClick={() => data.onAddColumn()}
        type="button"
      >
        + Add Column
      </button>
    </div>
  )
}
