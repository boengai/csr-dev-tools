import { Button, FieldForm, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps, TransformerField } from '@/types'
import { isValidTimestamp } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['unix-timestamp']

const INITIAL = { source: '' }

const INVALID = 'Enter a valid Unix timestamp in seconds or milliseconds (e.g. 1700000000)'

// > 100 billion implies ms (year 5138 in seconds is unrealistic).
const isMilliseconds = (value: number): boolean => value > 100_000_000_000

/** The source as a Date, or null when it is not a valid timestamp. */
const parseTimestamp = (source: string): Date | null => {
  const trimmed = source.trim()
  if (!isValidTimestamp(trimmed)) return null
  const n = Number(trimmed)
  return new Date(isMilliseconds(n) ? n : n * 1_000)
}

const pad = (n: number): string => String(n).padStart(2, '0')

const localDate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const localTime = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`

const computeDates = ({ source }: { source: string }): Array<TransformerField> => {
  const d = parseTimestamp(source)
  if (!d) throw new Error(INVALID)
  const ms = isMilliseconds(Number(source.trim()))
  return [
    { copy: false, label: 'Format', value: ms ? 'Milliseconds' : 'Seconds' },
    { label: 'Unix Timestamp (seconds)', value: String(Math.floor(d.getTime() / 1_000)) },
    { label: 'GMT', value: d.toUTCString() },
    { label: 'Local', value: d.toString() },
  ]
}

/**
 * One source, two ways in: type a timestamp, or pick a local date and time.
 * The pickers show the source's date and write a timestamp back into it (in
 * the source's unit), so the output is always "this timestamp as dates".
 */
export const TimeUnixTimestamp = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'fields'>
    autoOpen={autoOpen}
    compute={computeDates}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    outputKind="fields"
    // Never saved before the shell; kept that way.
    persistInput={false}
    renderControls={({ inputs, setFieldsImmediate }) => {
      const current = parseTimestamp(inputs.source)
      const inMs = current != null && isMilliseconds(Number(inputs.source.trim()))
      const writeDate = (date: string, time: string) => {
        const [y, mo, day] = date.split('-').map(Number)
        const [h, mi] = time.split(':').map(Number)
        const d = new Date(y ?? 0, (mo ?? 1) - 1, day ?? 1, h ?? 0, mi ?? 0, current?.getSeconds() ?? 0)
        if (Number.isNaN(d.getTime())) return
        setFieldsImmediate({ source: String(inMs ? d.getTime() : Math.floor(d.getTime() / 1_000)) })
      }
      return (
        <>
          <FieldForm
            label="Date (local)"
            name="unix-date"
            onChange={(val: string) => val && writeDate(val, current ? localTime(current) : '00:00')}
            type="date"
            value={current ? localDate(current) : ''}
          />
          <FieldForm
            label="Time (local)"
            name="unix-time"
            onChange={(val: string) => val && writeDate(current ? localDate(current) : localDate(new Date()), val)}
            type="time"
            value={current ? localTime(current) : ''}
          />
          <Button
            onClick={() => setFieldsImmediate({ source: String(Math.floor(Date.now() / 1_000)) })}
            size="small"
            variant="primary"
          >
            Now
          </Button>
        </>
      )
    }}
    resultLabel="Dates"
    resultPlaceholder="Enter a Unix timestamp, or pick a date and time above, to convert it"
    sourceKind="text"
    sourceLabel="Unix Timestamp"
    sourcePlaceholder="1700000000 (seconds or milliseconds)"
    title="Unix Timestamp"
    triggerLabel="Convert"
  />
)
