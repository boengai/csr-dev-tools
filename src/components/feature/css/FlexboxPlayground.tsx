import { useState } from 'react'

import type {
  AlignItems,
  FlexDirection,
  FlexWrap,
  FlexboxContainerProps,
  FlexboxItemProps,
  JustifyContent,
} from '@/utils'

import { CopyButton, FieldForm, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { DEFAULT_CONTAINER, DEFAULT_ITEM, generateFlexboxCss } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['css-flexbox-playground']

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

const DIRECTION_OPTIONS: Array<FlexDirection> = ['row', 'column', 'row-reverse', 'column-reverse']
const JUSTIFY_OPTIONS: Array<JustifyContent> = [
  'flex-start',
  'center',
  'flex-end',
  'space-between',
  'space-around',
  'space-evenly',
]
const ALIGN_OPTIONS: Array<AlignItems> = ['flex-start', 'center', 'flex-end', 'stretch', 'baseline']
const WRAP_OPTIONS: Array<FlexWrap> = ['nowrap', 'wrap', 'wrap-reverse']

export const FlexboxPlayground = () => {
  const [container, setContainer] = useState<FlexboxContainerProps>(DEFAULT_CONTAINER)
  const [items, setItems] = useState<Array<FlexboxItemProps>>([DEFAULT_ITEM, DEFAULT_ITEM, DEFAULT_ITEM])
  const [selectedItem, setSelectedItem] = useState<number | null>(null)

  const { containerCss, itemsCss } = generateFlexboxCss(container, items)

  const addItem = () => {
    if (items.length >= 10) return
    setItems((prev) => [...prev, { ...DEFAULT_ITEM }])
  }

  const removeItem = () => {
    if (items.length <= 3) return
    const newLength = items.length - 1
    setItems((prev) => prev.slice(0, -1))
    if (selectedItem !== null && selectedItem >= newLength) {
      setSelectedItem(null)
    }
  }

  const updateItem = (index: number, key: keyof FlexboxItemProps, value: string) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: parsed } : item)))
  }

  const fullCss =
    `.container {\n${containerCss}\n}` + items.map((_, i) => `\n\n.item-${i + 1} {\n${itemsCss[i]}\n}`).join('')

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-wrap gap-4">
          <SelectInput
            name="fb-dir"
            onChange={(v) => setContainer((prev) => ({ ...prev, direction: v as FlexDirection }))}
            options={DIRECTION_OPTIONS.map((o) => ({ label: o, value: o }))}
            placeholder="Direction"
            value={container.direction}
          />
          <SelectInput
            name="fb-justify"
            onChange={(v) => setContainer((prev) => ({ ...prev, justifyContent: v as JustifyContent }))}
            options={JUSTIFY_OPTIONS.map((o) => ({ label: o, value: o }))}
            placeholder="Justify"
            value={container.justifyContent}
          />
          <SelectInput
            name="fb-align"
            onChange={(v) => setContainer((prev) => ({ ...prev, alignItems: v as AlignItems }))}
            options={ALIGN_OPTIONS.map((o) => ({ label: o, value: o }))}
            placeholder="Align"
            value={container.alignItems}
          />
          <SelectInput
            name="fb-wrap"
            onChange={(v) => setContainer((prev) => ({ ...prev, wrap: v as FlexWrap }))}
            options={WRAP_OPTIONS.map((o) => ({ label: o, value: o }))}
            placeholder="Wrap"
            value={container.wrap}
          />
        </div>

        <FieldForm
          label="Gap"
          max={64}
          min={0}
          name="fb-gap"
          onChange={(val: string) => {
            const parsed = Number(val)
            if (!Number.isNaN(parsed)) setContainer((prev) => ({ ...prev, gap: parsed }))
          }}
          type="range"
          value={String(container.gap)}
        />

        <div className="flex items-center gap-2">
          <span className="text-body-sm text-gray-400">Items: {items.length}</span>
          <button
            className="text-xs rounded border border-gray-700 px-2 py-0.5 text-gray-400 hover:text-gray-100 disabled:opacity-30"
            disabled={items.length >= 10}
            onClick={addItem}
            type="button"
          >
            +
          </button>
          <button
            className="text-xs rounded border border-gray-700 px-2 py-0.5 text-gray-400 hover:text-gray-100 disabled:opacity-30"
            disabled={items.length <= 3}
            onClick={removeItem}
            type="button"
          >
            −
          </button>
        </div>

        {selectedItem !== null && (
          <div className="flex flex-col gap-2 rounded border border-gray-800 bg-gray-950 p-3">
            <span className="text-body-sm font-medium text-gray-300">Item {selectedItem + 1}</span>
            <FieldForm
              label="flex-grow"
              max={10}
              min={0}
              name={`fb-item-grow-${selectedItem}`}
              onChange={(val: string) => updateItem(selectedItem, 'flexGrow', val)}
              type="range"
              value={String(items[selectedItem].flexGrow)}
            />
            <FieldForm
              label="flex-shrink"
              max={10}
              min={0}
              name={`fb-item-shrink-${selectedItem}`}
              onChange={(val: string) => updateItem(selectedItem, 'flexShrink', val)}
              type="range"
              value={String(items[selectedItem].flexShrink)}
            />
            <FieldForm
              label="order"
              max={10}
              min={-10}
              name={`fb-item-order-${selectedItem}`}
              onChange={(val: string) => updateItem(selectedItem, 'order', val)}
              type="range"
              value={String(items[selectedItem].order)}
            />
          </div>
        )}
      </div>

      <div className="border-t-2 border-dashed border-gray-900" />

      <div
        className="min-h-48 rounded-lg border border-gray-800 p-4"
        style={{
          alignItems: container.alignItems,
          display: 'flex',
          flexDirection: container.direction,
          flexWrap: container.wrap,
          gap: `${container.gap}px`,
          justifyContent: container.justifyContent,
        }}
      >
        {items.map((_, index) => (
          <button
            aria-label={`Item ${index + 1}`}
            className={`text-sm flex h-16 w-16 items-center justify-center rounded font-bold text-white ${
              selectedItem === index ? 'ring-2 ring-white' : ''
            }`}
            key={index}
            onClick={() => setSelectedItem(selectedItem === index ? null : index)}
            style={{
              backgroundColor: ITEM_COLORS[index % ITEM_COLORS.length],
              flexGrow: items[index].flexGrow,
              flexShrink: items[index].flexShrink,
              order: items[index].order,
            }}
            type="button"
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-medium text-gray-400">CSS Output</span>
          <CopyButton label="CSS flexbox" value={fullCss} />
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
          <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">{fullCss}</pre>
        </div>
      </div>
    </div>
  )
}
