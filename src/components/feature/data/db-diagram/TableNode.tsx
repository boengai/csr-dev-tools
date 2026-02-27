import type { Node, NodeProps } from '@xyflow/react'

import { Handle, Position } from '@xyflow/react'
import { useCallback, useRef, useState } from 'react'

import type { ColumnType, TableColumn, TableNodeData } from '@/types'

import { SelectInput, TextInput } from '@/components/common'
import { XIcon } from '@/components/common/icon'
import { COLUMN_TYPES } from '@/utils'

export type TableNode = Node<TableNodeData, 'tableNode'>

const CONSTRAINT_COLORS: Record<string, { active: string; inactive: string }> = {
  error: { active: 'bg-error/15 text-error ring-1 ring-error/30', inactive: 'bg-gray-900 text-gray-500' },
  info: { active: 'bg-info/15 text-info ring-1 ring-info/30', inactive: 'bg-gray-900 text-gray-500' },
  success: { active: 'bg-success/15 text-success ring-1 ring-success/30', inactive: 'bg-gray-900 text-gray-500' },
  warning: { active: 'bg-warning/15 text-warning ring-1 ring-warning/30', inactive: 'bg-gray-900 text-gray-500' },
}

const ConstraintToggle = ({
  active,
  color,
  label,
  onClick,
}: {
  active: boolean
  color: keyof typeof CONSTRAINT_COLORS
  label: string
  onClick: () => void
}) => {
  const styles = CONSTRAINT_COLORS[color]
  return (
    <button
      className={`rounded px-1 py-0.5 text-[10px] leading-none font-bold transition-colors ${
        active ? styles.active : styles.inactive
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
}

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
      className="min-w-[220px] rounded-lg border border-gray-800 bg-gray-950 shadow-lg"
      data-testid={`table-node-${id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-gray-800 bg-gray-900 px-3 py-2">
        {editing ? (
          <TextInput
            autoFocus
            block={false}
            name="table-name"
            onBlur={commitName}
            onChange={(value) => setEditName(value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') {
                setEditName(data.tableName)
                setEditing(false)
              }
            }}
            ref={inputRef}
            size="compact"
            type="text"
            value={editName}
          />
        ) : (
          <button
            className="text-sm font-bold text-white hover:text-primary"
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
          className="ml-2 text-gray-500 hover:text-error"
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
              className="h-[10px]! w-[10px]! rounded-full! border-2! border-gray-600! bg-gray-400!"
              id={`${id}-${col.id}-target`}
              position={Position.Left}
              style={{ left: -5, top: '50%', transform: 'translateY(-50%)' }}
              type="target"
            />

            <div className="flex flex-1 items-center gap-1 pr-2 pl-2">
              {/* Column name */}
              <div className="min-w-45">
                <TextInput
                  block={false}
                  name="column-name"
                  onChange={(value) => data.onColumnChange(col.id, { name: value })}
                  size="compact"
                  type="text"
                  value={col.name}
                />
              </div>

              {/* Type dropdown */}
              <div className="min-w-30">
                <SelectInput
                  name="column-type"
                  onChange={(value) => data.onColumnChange(col.id, { type: value as ColumnType })}
                  options={COLUMN_TYPES.map((t) => ({ label: t, value: t }))}
                  size="compact"
                  value={col.type}
                />
              </div>
              {/* <select
                className="h-5 shrink-0 rounded border border-gray-700 bg-transparent px-0.5 text-[10px] text-gray-400 outline-none"
                onChange={(e) => data.onColumnChange(col.id, { type: e.target.value as ColumnType })}
                value={col.type}
              >
                {COLUMN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select> */}

              {/* Constraint toggles */}
              <div className="flex gap-0.5">
                <ConstraintToggle
                  active={col.constraints.isPrimaryKey}
                  color="warning"
                  label="PK"
                  onClick={() => handleConstraintChange(col, 'isPrimaryKey')}
                />
                <ConstraintToggle
                  active={col.constraints.isForeignKey}
                  color="info"
                  label="FK"
                  onClick={() => handleConstraintChange(col, 'isForeignKey')}
                />
                <ConstraintToggle
                  active={!col.constraints.isNullable}
                  color="error"
                  label="NN"
                  onClick={() => handleConstraintChange(col, 'isNullable')}
                />
                <ConstraintToggle
                  active={col.constraints.isUnique}
                  color="success"
                  label="UQ"
                  onClick={() => handleConstraintChange(col, 'isUnique')}
                />
              </div>

              {/* Delete column */}
              <button
                className="ml-auto text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-error"
                onClick={() => data.onDeleteColumn(col.id)}
                title="Delete column"
                type="button"
              >
                <XIcon size={12} />
              </button>
            </div>

            {/* Source handle (right) */}
            <Handle
              className="h-[10px]! w-[10px]! rounded-full! border-2! border-gray-600! bg-gray-400!"
              id={`${id}-${col.id}-source`}
              position={Position.Right}
              style={{ right: -5, top: '50%', transform: 'translateY(-50%)' }}
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
