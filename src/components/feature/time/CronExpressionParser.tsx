import { useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import { type CronParseResult, CRON_PRESETS, parseCron } from '@/utils/cron-parser'

const toolEntry = TOOL_REGISTRY_MAP['cron-expression-parser']

const EMPTY_RESULT: CronParseResult = { description: '', error: null, nextRuns: [], valid: false }

export const CronExpressionParser = (_props: ToolComponentProps) => {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState<CronParseResult>(EMPTY_RESULT)

  const process = useDebounceCallback((val: string) => {
    if (!val.trim()) {
      setResult(EMPTY_RESULT)
      return
    }
    setResult(parseCron(val, 10))
  }, 300)

  const handleChange = (val: string) => {
    setExpression(val)
    process(val)
  }

  const handlePreset = (expr: string) => {
    setExpression(expr)
    setResult(parseCron(expr, 10))
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <FieldForm
        label="Cron Expression"
        name="cron-input"
        onChange={handleChange}
        placeholder="* * * * *"
        type="text"
        value={expression}
      />

      <div className="flex flex-wrap gap-2">
        {CRON_PRESETS.map((preset) => (
          <button
            className="rounded border border-gray-800 px-2 py-1 text-body-xs text-gray-400 hover:border-primary hover:text-primary"
            key={preset.expression}
            onClick={() => handlePreset(preset.expression)}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {result.error && (
        <p className="text-red-500 text-body-xs" role="alert">
          {result.error}
        </p>
      )}

      {result.valid && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
            <div className="flex items-center gap-1">
              <span className="text-body-xs font-medium text-gray-400">Description</span>
              <CopyButton label="description" value={result.description} />
            </div>
            <p className="mt-1 text-body-sm text-gray-200">{result.description}</p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
            <span className="text-body-xs font-medium text-gray-400">Next {result.nextRuns.length} runs (UTC)</span>
            <ul className="mt-1 flex flex-col gap-1">
              {result.nextRuns.map((run, i) => (
                <li className="font-mono text-body-xs text-gray-300" key={i}>
                  {run}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
