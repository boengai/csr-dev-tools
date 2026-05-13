import { useReducer } from 'react'

import { Button, CopyButton, FieldForm, TextInput } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { MarkdownTableAction, MarkdownTableState, ToolComponentProps } from '@/types'
import { type ColumnAlignment, generateMarkdownTable } from '@/utils'

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
const createInitialState = (): MarkdownTableState => ({
  alignments: Array(3).fill('left') as Array<ColumnAlignment>,
  cols: 3,
  data: createGrid(3, 3),
  dialogOpen: false,
  rows: 3,
})

const reducer = (state: MarkdownTableState, action: MarkdownTableAction): MarkdownTableState => {
  switch (action.type) {
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'SET_ROWS':
      return { ...state, rows: action.payload }
    case 'SET_COLS':
      return { ...state, cols: action.payload }
    case 'SET_DATA':
      return { ...state, data: action.payload }
    case 'SET_ALIGNMENTS':
      return { ...state, alignments: action.payload }
    case 'UPDATE_CELL':
      return {
        ...state,
        data: state.data.map((row, ri) =>
          ri === action.payload.r ? row.map((cell, ci) => (ci === action.payload.c ? action.payload.val : cell)) : row,
        ),
      }
    case 'CHANGE_ROWS': {
      const clamped = Math.max(2, Math.min(20, action.payload))
      const newData =
        clamped > state.data.length
          ? [
              ...state.data,
              ...Array.from({ length: clamped - state.data.length }, () => Array(state.cols).fill('') as Array<string>),
            ]
          : state.data.slice(0, clamped)
      return { ...state, rows: clamped, data: newData }
    }
    case 'CHANGE_COLS': {
      const clamped = Math.max(2, Math.min(10, action.payload))
      const newData = state.data.map((row) => {
        if (clamped > row.length) return [...row, ...(Array(clamped - row.length).fill('') as Array<string>)]
        return row.slice(0, clamped)
      })
      const newAlignments =
        clamped > state.alignments.length
          ? [...state.alignments, ...(Array(clamped - state.alignments.length).fill('left') as Array<ColumnAlignment>)]
          : state.alignments.slice(0, clamped)
      return { ...state, cols: clamped, data: newData, alignments: newAlignments }
    }
    case 'TOGGLE_ALIGN':
      return {
        ...state,
        alignments: state.alignments.map((a, i) => (i === action.payload ? NEXT_ALIGN[a] : a)),
      }
    case 'RESET':
      return createInitialState()
  }
}

export const MarkdownTableGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...createInitialState(),
    dialogOpen: autoOpen ?? false,
  }))
  const { alignments, cols, data, dialogOpen, rows } = state

  const output = generateMarkdownTable(data, alignments)

  const updateCell = (r: number, c: number, val: string) => {
    dispatch({ type: 'UPDATE_CELL', payload: { r, c, val } })
  }

  const handleRowsChange = (n: number) => {
    dispatch({ type: 'CHANGE_ROWS', payload: n })
  }

  const handleColsChange = (n: number) => {
    dispatch({ type: 'CHANGE_COLS', payload: n })
  }

  const toggleAlign = (c: number) => {
    dispatch({ type: 'TOGGLE_ALIGN', payload: c })
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}
        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => dispatch({ type: 'SET_DIALOG_OPEN', payload: true })} variant="default">
            Build Table
          </Button>
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={(open) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open })}
        onReset={handleReset}
        open={dialogOpen}
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
                        className="border border-gray-800 p-1 data-[state=header]:[&_input]:font-bold data-[state=header]:[&_input]:text-gray-100"
                        data-state={r === 0 ? 'header' : 'body'}
                        key={c}
                      >
                        <TextInput
                          aria-label={r === 0 ? `Header column ${c + 1}` : `Row ${r}, column ${c + 1}`}
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
      </ToolDialogShell>
    </>
  )
}
