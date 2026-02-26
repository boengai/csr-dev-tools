import { useMemo, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { CopyButton } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import {
  type CronFieldConfig,
  type CronFieldMode,
  type CrontabConfig,
  buildCronExpression,
  describeCron,
  getNextRuns,
} from '@/utils/crontab'

const toolEntry = TOOL_REGISTRY_MAP['crontab-generator']

const FIELD_LABELS = ['Minute', 'Hour', 'Day of Month', 'Month', 'Day of Week'] as const
const FIELD_KEYS = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'] as const
const FIELD_RANGES: Array<[number, number]> = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 6],
]
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MODES: Array<{ label: string; value: CronFieldMode }> = [
  { label: 'Every', value: 'every' },
  { label: 'Specific', value: 'specific' },
  { label: 'Range', value: 'range' },
  { label: 'Interval', value: 'interval' },
]

const defaultField = (): CronFieldConfig => ({ mode: 'every' })

const modeButtonClass = (active: boolean) =>
  `rounded border px-1.5 py-0.5 text-[11px] font-mono ${
    active ? 'border-primary bg-primary/20 text-primary font-bold' : 'border-gray-700 bg-transparent text-gray-500'
  }`

type FieldEditorProps = {
  config: CronFieldConfig
  fieldIndex: number
  label: string
  max: number
  min: number
  onChange: (config: CronFieldConfig) => void
}

const FieldEditor = ({ config, fieldIndex, label, max, min, onChange }: FieldEditorProps) => {
  const handleModeChange = (mode: CronFieldMode) => {
    if (mode === 'specific') {
      onChange({ mode, values: [] })
    } else if (mode === 'range') {
      onChange({ mode, rangeStart: min, rangeEnd: max })
    } else if (mode === 'interval') {
      onChange({ mode, interval: fieldIndex === 0 ? 5 : 1 })
    } else {
      onChange({ mode })
    }
  }

  const toggleValue = (val: number) => {
    const current = config.values ?? []
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
    onChange({ ...config, values: next })
  }

  const useButtons = fieldIndex === 3 || fieldIndex === 4
  const names = fieldIndex === 3 ? MONTH_NAMES : fieldIndex === 4 ? DOW_NAMES : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="w-32 shrink-0 text-body-xs font-medium text-gray-300">
          {label} ({min}–{max})
        </span>
        <div className="flex flex-wrap gap-1">
          {MODES.map((m) => (
            <button
              className={modeButtonClass(config.mode === m.value)}
              key={m.value}
              onClick={() => handleModeChange(m.value)}
              type="button"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {config.mode === 'specific' && useButtons && names && (
        <div className="ml-32 flex flex-wrap gap-1">
          {names.map((name, i) => {
            const val = fieldIndex === 3 ? i + 1 : i
            const active = (config.values ?? []).includes(val)
            return (
              <button
                className={`text-xs rounded border px-2 py-1 ${
                  active ? 'border-primary bg-primary/20 text-primary' : 'border-gray-700 text-gray-500'
                }`}
                key={val}
                onClick={() => toggleValue(val)}
                type="button"
              >
                {name}
              </button>
            )
          })}
        </div>
      )}

      {config.mode === 'specific' && !useButtons && (
        <div className="ml-32">
          <input
            className="w-48 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-body-xs text-gray-300"
            onChange={(e) => {
              const vals = e.target.value
                .split(',')
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !isNaN(n) && n >= min && n <= max)
              onChange({ ...config, values: vals })
            }}
            placeholder={`e.g. ${min},${Math.min(min + 15, max)}`}
            type="text"
            value={(config.values ?? []).join(',')}
          />
        </div>
      )}

      {config.mode === 'range' && (
        <div className="ml-32 flex items-center gap-2">
          <label className="text-body-xs text-gray-500">Start:</label>
          <input
            className="w-16 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-body-xs text-gray-300"
            max={max}
            min={min}
            onChange={(e) => onChange({ ...config, rangeStart: parseInt(e.target.value, 10) || min })}
            type="number"
            value={config.rangeStart ?? min}
          />
          <label className="text-body-xs text-gray-500">End:</label>
          <input
            className="w-16 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-body-xs text-gray-300"
            max={max}
            min={min}
            onChange={(e) => onChange({ ...config, rangeEnd: parseInt(e.target.value, 10) || max })}
            type="number"
            value={config.rangeEnd ?? max}
          />
        </div>
      )}

      {config.mode === 'interval' && (
        <div className="ml-32 flex items-center gap-2">
          <label className="text-body-xs text-gray-500">Every</label>
          <input
            className="w-16 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-body-xs text-gray-300"
            min={1}
            onChange={(e) => onChange({ ...config, interval: parseInt(e.target.value, 10) || 1 })}
            type="number"
            value={config.interval ?? 1}
          />
        </div>
      )}
    </div>
  )
}

export const CrontabGenerator = (_: ToolComponentProps) => {
  const [config, setConfig] = useState<CrontabConfig>({
    minute: defaultField(),
    hour: defaultField(),
    dayOfMonth: defaultField(),
    month: defaultField(),
    dayOfWeek: defaultField(),
  })

  const expression = useMemo(() => buildCronExpression(config), [config])
  const description = useMemo(() => describeCron(expression), [expression])
  const nextRuns = useMemo(() => getNextRuns(expression, 5), [expression])

  const updateField = (key: (typeof FIELD_KEYS)[number], fieldConfig: CronFieldConfig) => {
    setConfig((prev) => ({ ...prev, [key]: fieldConfig }))
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      {FIELD_KEYS.map((key, i) => (
        <FieldEditor
          config={config[key]}
          fieldIndex={i}
          key={key}
          label={FIELD_LABELS[i]}
          max={FIELD_RANGES[i][1]}
          min={FIELD_RANGES[i][0]}
          onChange={(fc) => updateField(key, fc)}
        />
      ))}

      <div className="border-t border-dashed border-gray-800" />

      <div>
        <div className="flex items-center gap-2">
          <span className="text-body-xs font-medium text-gray-400">Cron Expression</span>
          <CopyButton label="cron expression" value={expression} />
        </div>
        <pre className="mt-1 rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-body-sm text-gray-200">
          {expression}
        </pre>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
        <span className="text-body-xs font-medium text-gray-400">Description</span>
        <p className="mt-1 text-body-sm text-gray-200">{description}</p>
      </div>

      {nextRuns.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
          <span className="text-body-xs font-medium text-gray-400">Next {nextRuns.length} runs (UTC)</span>
          <ul className="mt-1 flex flex-col gap-1">
            {nextRuns.map((run, i) => (
              <li className="font-mono text-body-xs text-gray-300" key={i}>
                {run}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
