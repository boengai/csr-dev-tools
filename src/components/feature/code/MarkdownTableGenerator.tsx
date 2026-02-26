import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { ColumnAlignment } from '@/utils/markdown-table'

import { Button, CopyButton, Dialog, FieldForm, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { generateMarkdownTable } from '@/utils/markdown-table'

const toolEntry = TOOL_REGISTRY_MAP['markdown-table-generator']

const NEXT_ALIGN: Record<ColumnAlignment, ColumnAlignment> = {
  center: 'right',
  left: 'center',
  right: 'left',
}

const ALIGN_ICON: Record<ColumnAlignment, string> = {
  center: '≡',
  left: '≡←',
  right: '→≡',
}

const createGrid = (rows: number, cols: number): Array<Array<string>> =>
  Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (r === 0 ? `Header ${c + 1}` : '')))

export const MarkdownTableGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [data, setData] = useState<Array<Array<string>>>(createGrid(3, 3))
  const [alignments, setAlignments] = useState<Array<ColumnAlignment>>(Array(3).fill('left') as Array<ColumnAlignment>)

  const output = generateMarkdownTable(data, alignments)

  const updateCell = (r: number, c: number, val: string) => {
    setData((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? val : cell)) : row)))
  }

  const handleRowsChange = (n: number) => {
    const clamped = Math.max(2, Math.min(20, n))
    setRows(clamped)
    setData((prev) => {
      if (clamped > prev.length) {
        return [...prev, ...Array.from({ length: clamped - prev.length }, () => Array(cols).fill('') as Array<string>)]
      }
      return prev.slice(0, clamped)
    })
  }

  const handleColsChange = (n: number) => {
    const clamped = Math.max(2, Math.min(10, n))
    setCols(clamped)
    setData((prev) =>
      prev.map((row) => {
        if (clamped > row.length) return [...row, ...(Array(clamped - row.length).fill('') as Array<string>)]
        return row.slice(0, clamped)
      }),
    )
    setAlignments((prev) => {
      if (clamped > prev.length)
        return [...prev, ...(Array(clamped - prev.length).fill('left') as Array<ColumnAlignment>)]
      return prev.slice(0, clamped)
    })
  }

  const toggleAlign = (c: number) => {
    setAlignments((prev) => prev.map((a, i) => (i === c ? NEXT_ALIGN[a] : a)))
  }

  const handleReset = () => {
    setRows(3)
    setCols(3)
    setData(createGrid(3, 3))
    setAlignments(Array(3).fill('left') as Array<ColumnAlignment>)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}
        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Build Table
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          handleReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="Markdown Table Generator"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-24">
              <FieldForm
                label="Rows"
                max={20}
                min={2}
                name="table-rows"
                onChange={(val: string) => handleRowsChange(Number(val))}
                type="number"
                value={String(rows)}
              />
            </div>
            <div className="w-24">
              <FieldForm
                label="Cols"
                max={10}
                min={2}
                name="table-cols"
                onChange={(val: string) => handleColsChange(Number(val))}
                type="number"
                value={String(cols)}
              />
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {Array.from({ length: cols }).map((_, c) => (
                    <th className="border border-gray-800 p-1" key={c}>
                      <button
                        className="w-full rounded bg-gray-900 px-2 py-1 text-body-xs text-gray-400 hover:text-primary"
                        onClick={() => toggleAlign(c)}
                        title={`Align: ${alignments[c]}`}
                        type="button"
                      >
                        {ALIGN_ICON[alignments[c]]}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td
                        className={`border border-gray-800 p-1 ${r === 0 ? '[&_input]:font-bold [&_input]:text-gray-100' : ''}`}
                        key={c}
                      >
                        <TextInput
                          name={`cell-${r}-${c}`}
                          onChange={(value) => updateCell(r, c, value)}
                          placeholder={r === 0 ? `Header ${c + 1}` : ''}
                          type="text"
                          value={cell}
                          size="compact"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t-2 border-dashed border-gray-900" />

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-body-xs font-medium text-gray-400">Markdown</span>
              <CopyButton label="Markdown" value={output} />
            </div>
            <pre className="max-h-[200px] overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-body-xs text-gray-300">
              {output || 'Fill in cells to generate Markdown...'}
            </pre>
          </div>
        </div>
      </Dialog>
    </>
  )
}
