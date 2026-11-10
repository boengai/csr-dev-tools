import { FieldForm, GeneratorShell, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { FieldEditorProps, GeneratorField, ToolComponentProps } from '@/types'
import {
  type CronFieldConfig,
  type CronFieldMode,
  type CrontabConfig,
  buildCronExpression,
  describeCron,
  getNextRuns,
} from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['crontab-generator']

const FIELDS = [
  { key: 'minute', label: 'Minute', max: 59, min: 0 },
  { key: 'hour', label: 'Hour', max: 23, min: 0 },
  { key: 'dayOfMonth', label: 'Day of Month', max: 31, min: 1 },
  { key: 'month', label: 'Month', max: 12, min: 1 },
  { key: 'dayOfWeek', label: 'Day of Week', max: 6, min: 0 },
] as const
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MODES: Array<{ label: string; value: CronFieldMode }> = [
  { label: 'Every', value: 'every' },
  { label: 'Specific', value: 'specific' },
  { label: 'Range', value: 'range' },
  { label: 'Interval', value: 'interval' },
]

const NEXT_RUN_COUNT = 5

const defaultField = (): CronFieldConfig => ({ mode: 'every' })

const INITIAL_CONFIG: CrontabConfig = {
  dayOfMonth: defaultField(),
  dayOfWeek: defaultField(),
  hour: defaultField(),
  minute: defaultField(),
  month: defaultField(),
}

const isOptionalNumber = (value: unknown) => value === undefined || Number.isFinite(value)

const isFieldConfig = (value: unknown): value is CronFieldConfig => {
  if (typeof value !== 'object' || value === null) return false
  const { interval, mode, rangeEnd, rangeStart, values } = value as CronFieldConfig
  return (
    MODES.some((m) => m.value === mode) &&
    (values === undefined || (Array.isArray(values) && values.every((v) => Number.isFinite(v)))) &&
    isOptionalNumber(interval) &&
    isOptionalNumber(rangeStart) &&
    isOptionalNumber(rangeEnd)
  )
}

// Deterministic: the same field settings always give the same expression, so
// it runs live. Only corrupt saved options are an error — the editors can't
// build an invalid field.
const build = (config: CrontabConfig): Array<GeneratorField> => {
  const bad = FIELDS.find(({ key }) => !isFieldConfig(config?.[key]))
  if (bad) throw new Error(`The saved ${bad.label.toLowerCase()} setting is invalid — pick a mode for it again`)
  const expression = buildCronExpression(config)
  const nextRuns = getNextRuns(expression, NEXT_RUN_COUNT)
  return [
    { label: 'Cron expression', value: expression },
    { copy: false, label: 'Description', value: describeCron(expression) },
    ...(nextRuns.length > 0
      ? [{ copy: false, label: `Next ${nextRuns.length} runs (UTC)`, value: nextRuns.join('\n') }]
      : []),
  ]
}

const modeButtonClass = (active: boolean) =>
  `rounded border px-1.5 py-0.5 text-[11px] font-mono ${
    active ? 'border-primary bg-primary/20 text-primary font-bold' : 'border-gray-700 bg-transparent text-gray-500'
  }`
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
          {/* raw button: active-state mode selector (modeButtonClass), Button has no active variant */}
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
          {/* raw button: active-state specific-value toggle (data-[state=active/inactive] styling), Button has no active variant */}
          {names.map((name, i) => {
            const val = fieldIndex === 3 ? i + 1 : i
            const active = (config.values ?? []).includes(val)
            return (
              <button
                className="text-xs rounded border px-2 py-1 data-[state=active]:border-primary data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=inactive]:border-gray-700 data-[state=inactive]:text-gray-500"
                data-state={active ? 'active' : 'inactive'}
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
        <div className="ml-32 w-48">
          <TextInput
            aria-label={`${label} specific values`}
            name={`field-${fieldIndex}-specific`}
            onChange={(value) => {
              const vals = value
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
          <span className="text-body-xs text-gray-500">Start:</span>
          <div className="w-16">
            <FieldForm
              label=""
              max={max}
              min={min}
              name={`field-${fieldIndex}-range-start`}
              onChange={(value) => onChange({ ...config, rangeStart: parseInt(value, 10) || min })}
              type="number"
              value={String(config.rangeStart ?? min)}
            />
          </div>
          <span className="text-body-xs text-gray-500">End:</span>
          <div className="w-16">
            <FieldForm
              label=""
              max={max}
              min={min}
              name={`field-${fieldIndex}-range-end`}
              onChange={(value) => onChange({ ...config, rangeEnd: parseInt(value, 10) || max })}
              type="number"
              value={String(config.rangeEnd ?? max)}
            />
          </div>
        </div>
      )}

      {config.mode === 'interval' && (
        <div className="ml-32 flex items-center gap-2">
          <span className="text-body-xs text-gray-500">Every</span>
          <div className="w-16">
            <FieldForm
              label=""
              min={1}
              name={`field-${fieldIndex}-interval`}
              onChange={(value) => onChange({ ...config, interval: parseInt(value, 10) || 1 })}
              type="number"
              value={String(config.interval ?? 1)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export const CrontabGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <GeneratorShell
    autoOpen={autoOpen}
    compute={build}
    description={toolEntry?.description}
    initial={INITIAL_CONFIG}
    onAfterClose={onAfterClose}
    output={{
      kind: 'fields',
      label: 'Cron expression',
      placeholder: 'Pick a mode for each field to build an expression',
    }}
    renderOptions={({ options, setOptions }) => (
      <div className="flex flex-col gap-4">
        {FIELDS.map(({ key, label, max, min }, i) => {
          const config = options?.[key]
          return (
            <FieldEditor
              config={isFieldConfig(config) ? config : defaultField()}
              fieldIndex={i}
              key={key}
              label={label}
              max={max}
              min={min}
              onChange={(fc) => setOptions({ [key]: fc })}
            />
          )
        })}
      </div>
    )}
    run={{ mode: 'live' }}
    storageKey="csr-dev-tools-crontab-generator"
    title="Crontab Generator"
    triggerLabel="Build"
  />
)
