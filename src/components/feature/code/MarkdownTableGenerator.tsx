import { FieldForm, GeneratorShell, TextInput } from '@/components/common'
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
  rows: 3,
})

const reducer = (state: MarkdownTableState, action: MarkdownTableAction): MarkdownTableState => {
  switch (action.type) {
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
  }
}

const isTableState = (state: unknown): state is MarkdownTableState => {
  if (typeof state !== 'object' || state === null) return false
  const { alignments, cols, data, rows } = state as MarkdownTableState
  return (
    Number.isInteger(rows) &&
    Number.isInteger(cols) &&
    Array.isArray(data) &&
    data.length === rows &&
    data.every((row) => Array.isArray(row) && row.length === cols && row.every((cell) => typeof cell === 'string')) &&
    Array.isArray(alignments) &&
    alignments.length === cols &&
    alignments.every((a) => Object.hasOwn(NEXT_ALIGN, a))
  )
}

// Deterministic: the same grid always gives the same Markdown, so it runs
// live. Only corrupt saved options are an error — the grid editor keeps rows,
// columns and alignments in step.
const build = (state: MarkdownTableState): string => {
  if (!isTableState(state)) throw new Error('The saved table is damaged — change any cell to start a new one')
  return generateMarkdownTable(state.data, state.alignments)
}

export const MarkdownTableGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <GeneratorShell
    autoOpen={autoOpen}
    compute={build}
    description={toolEntry?.description}
    initial={createInitialState()}
    onAfterClose={onAfterClose}
    output={{ kind: 'text', label: 'Markdown', placeholder: 'Fill in the cells to build a Markdown table' }}
    renderOptions={({ options, setOptions, setOptionsDebounced }) => {
      // ADR-0013: the reducer stays, as the bag's transition function. A
      // damaged saved bag edits from a fresh grid instead of crashing.
      const state = isTableState(options) ? options : createInitialState()
      const { alignments, cols, data, rows } = state
      const dispatch = (action: MarkdownTableAction) => setOptions(reducer(state, action))
      // Typing in a cell waits for a pause before rebuilding.
      const updateCell = (r: number, c: number, val: string) =>
        setOptionsDebounced(reducer(state, { payload: { c, r, val }, type: 'UPDATE_CELL' }))

      return (
        <>
          <div className="flex items-center gap-4">
            <div className="w-24">
              <FieldForm
                label="Rows"
                max={20}
                min={2}
                name="table-rows"
                onChange={(val: string) => dispatch({ payload: Number(val), type: 'CHANGE_ROWS' })}
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
                onChange={(val: string) => dispatch({ payload: Number(val), type: 'CHANGE_COLS' })}
                type="number"
                value={String(cols)}
              />
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {Array.from({ length: cols }).map((_, c) => {
                    const align = alignments[c] ?? 'left'
                    return (
                      <th className="border border-gray-800 p-1" key={c}>
                        <button
                          aria-label={`Column ${c + 1} alignment: ${align}`}
                          className="w-full rounded bg-gray-900 px-2 py-1 text-body-xs text-gray-400 hover:text-primary"
                          onClick={() => dispatch({ payload: c, type: 'TOGGLE_ALIGN' })}
                          title={`Align: ${align}`}
                          type="button"
                        >
                          {ALIGN_ICON[align]}
                        </button>
                      </th>
                    )
                  })}
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
                          size="compact"
                          type="text"
                          value={cell}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )
    }}
    run={{ mode: 'live' }}
    storageKey="csr-dev-tools-markdown-table-generator"
    title="Markdown Table Generator"
    triggerLabel="Build Table"
  />
)
