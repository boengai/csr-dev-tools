import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { GridAlignItems, GridContainerProps, GridJustifyItems } from '@/utils/css-grid'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { DEFAULT_GRID_CONTAINER, generateGridCss } from '@/utils/css-grid'

const toolEntry = TOOL_REGISTRY_MAP['css-grid-playground']

const ITEM_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#10b981',
  '#f43f5e',
]

const JUSTIFY_OPTIONS = [
  { label: 'start', value: 'start' },
  { label: 'center', value: 'center' },
  { label: 'end', value: 'end' },
  { label: 'stretch', value: 'stretch' },
]

const ALIGN_OPTIONS = [
  { label: 'start', value: 'start' },
  { label: 'center', value: 'center' },
  { label: 'end', value: 'end' },
  { label: 'stretch', value: 'stretch' },
]

export const GridPlayground = (_props: ToolComponentProps) => {
  const [container, setContainer] = useState<GridContainerProps>(DEFAULT_GRID_CONTAINER)
  const [itemCount, setItemCount] = useState(6)

  const css = generateGridCss(container, itemCount)

  const update = (patch: Partial<GridContainerProps>) => {
    setContainer((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="flex flex-col gap-3">
        <FieldForm
          label="Columns"
          name="grid-columns"
          onChange={(val: string) => update({ columns: val })}
          placeholder="1fr 1fr 1fr"
          type="text"
          value={container.columns}
        />
        <FieldForm
          label="Rows"
          name="grid-rows"
          onChange={(val: string) => update({ rows: val })}
          placeholder="auto auto"
          type="text"
          value={container.rows}
        />
        <FieldForm
          label={`Gap: ${container.gap}px`}
          max={48}
          min={0}
          name="grid-gap"
          onChange={(val: string) => update({ gap: Number(val) })}
          type="range"
          value={String(container.gap)}
        />
        <div className="flex gap-4">
          <FieldForm
            label="Justify Items"
            name="grid-justify"
            onChange={(val: string) => update({ justifyItems: val as GridJustifyItems })}
            options={JUSTIFY_OPTIONS}
            type="select"
            value={container.justifyItems}
          />
          <FieldForm
            label="Align Items"
            name="grid-align"
            onChange={(val: string) => update({ alignItems: val as GridAlignItems })}
            options={ALIGN_OPTIONS}
            type="select"
            value={container.alignItems}
          />
        </div>
        <FieldForm
          label={`Items: ${itemCount}`}
          max={12}
          min={1}
          name="grid-items"
          onChange={(val: string) => setItemCount(Number(val))}
          type="range"
          value={String(itemCount)}
        />
      </div>

      <div
        className="min-h-[200px] rounded-lg border border-gray-800 bg-gray-950 p-4"
        style={{
          alignItems: container.alignItems,
          display: 'grid',
          gap: `${container.gap}px`,
          gridTemplateColumns: container.columns,
          gridTemplateRows: container.rows,
          justifyItems: container.justifyItems,
        }}
      >
        {Array.from({ length: itemCount }).map((_, i) => (
          <div
            className="flex min-h-[60px] items-center justify-center rounded-lg text-body-sm font-bold text-white"
            key={i}
            style={{ backgroundColor: ITEM_COLORS[i % ITEM_COLORS.length] }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="text-body-xs font-medium text-gray-400">CSS</span>
          <CopyButton label="CSS" value={css} />
        </div>
        <pre className="overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-body-xs text-gray-300">
          {css}
        </pre>
      </div>
    </div>
  )
}
