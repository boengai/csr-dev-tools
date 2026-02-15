import { AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'

import type { DateTime } from '@/types'

import { CopyButton, DataCellTable, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { getDaysInMonth } from '@/utils'
import { isValidTimestamp } from '@/utils/validation'

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTH_OPTIONS = MONTH_LABELS.map((label, i) => ({
  label: label,
  value: i.toString(),
}))

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const val = i.toString()
  return { label: val, value: val }
})

const MIN_SEC_OPTIONS = Array.from({ length: 60 }, (_, i) => {
  const val = i.toString()
  return { label: val, value: val }
})

const renderWithCopy = (label: string) => (val: string) => (
  <span className="flex items-center gap-1">
    <span>{val}</span>
    <CopyButton label={label} value={val} />
  </span>
)

const UnixTimestampSection = ({ showError }: { showError: (label: string) => void }) => {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Array<string>>([])

  const dbSetResult = useDebounceCallback((source: string) => {
    if (source.length === 0) {
      setResult([])
      return
    }
    if (!isValidTimestamp(source)) {
      setResult([])
      showError('Enter a valid Unix timestamp (e.g., 1700000000)')
      return
    }
    const inputNumber = Number(source)

    // Auto-detect if timestamp is in seconds or milliseconds
    // If the number is > 100 billion, it's very likely milliseconds
    // since that would represent year 5138 in seconds (unrealistic)
    const isMilliseconds = inputNumber > 100_000_000_000

    const d = new Date(isMilliseconds ? inputNumber : inputNumber * 1_000)

    setResult([isMilliseconds ? 'Milliseconds' : 'Seconds', d.toUTCString(), d.toString()])
  }, 300)

  const handleInputChange = (val: string) => {
    setInput(val)
    dbSetResult(val)
  }

  return (
    <section className="flex grow flex-col gap-2">
      <div className="flex items-end gap-2 [&>*:first-child]:w-2/3 [&>*:last-child]:w-1/3">
        <FieldForm
          label="Enter a Timestamp"
          name="unixTimestamp"
          onChange={handleInputChange}
          placeholder={Date.now().toString()}
          type="text"
          value={input}
        />
      </div>
      <p className="text-center text-body-sm text-gray-500">
        Supports Unix timestamps in seconds or milliseconds (auto-detected).
      </p>
      <div aria-live="polite">
        <AnimatePresence mode="wait">
          {result.length > 0 && (
            <DataCellTable
              rows={[
                { label: 'Format', render: renderWithCopy('Format'), value: result[0] },
                { label: 'GMT', render: renderWithCopy('GMT'), value: result[1] },
                { label: 'Local', render: renderWithCopy('Local'), value: result[2] },
              ]}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

const DateSection = () => {
  const [input, setInput] = useState<DateTime<string>>(() => {
    const d = new Date()
    return {
      day: d.getDate().toString(),
      hour: d.getHours().toString(),
      minute: d.getMinutes().toString(),
      month: d.getMonth().toString(),
      second: d.getSeconds().toString(),
      year: d.getFullYear().toString(),
    }
  })
  const [result, setResult] = useState<Array<string>>(() => {
    const d = new Date()
    return [Math.floor(d.getTime() / 1000).toString(), d.toUTCString(), d.toString()]
  })

  const placeholder = useMemo(() => {
    const d = new Date()
    return {
      day: d.getDate().toString(),
      hour: d.getHours().toString(),
      minute: d.getMinutes().toString(),
      month: MONTH_LABELS[d.getMonth()],
      second: d.getSeconds().toString(),
      year: d.getFullYear().toString(),
    }
  }, [])

  const dayOptions = useMemo(() => {
    const daysInMonth = getDaysInMonth(Number(input.year), Number(input.month) + 1)

    return Array.from({ length: daysInMonth }, (_, i) => {
      const val = (i + 1).toString()
      return {
        label: val,
        value: val,
      }
    })
  }, [input.year, input.month])

  const handleChange = (key: keyof DateTime, value: string) => {
    const newInput = { ...input, [key]: value }
    if ((key === 'month' || key === 'year') && newInput.day) {
      newInput.day = Math.min(
        Number(newInput.day),
        getDaysInMonth(Number(newInput.year), Number(newInput.month) + 1),
      ).toString()
    }
    setInput(newInput)

    if (!newInput.year || !newInput.month || !newInput.day) {
      return
    }

    const d = new Date(
      Number(newInput.year),
      Number(newInput.month),
      Number(newInput.day),
      Number(newInput.hour),
      Number(newInput.minute),
      Number(newInput.second),
    )
    setResult([Math.floor(d.getTime() / 1000).toString(), d.toUTCString(), d.toString()])
  }

  return (
    <section className="flex grow flex-col gap-2">
      <div className="flex flex-col justify-between gap-1 desktop:flex-row [&>div>fieldset]:w-1/3">
        <div className="flex w-full justify-between gap-1 desktop:w-1/2">
          <FieldForm
            label="Year"
            name="year"
            onChange={(val) => handleChange('year', val)}
            placeholder={placeholder.year}
            type="number"
            value={input.year}
          />
          <FieldForm
            disabled={!input.year}
            label="Month"
            name="month"
            onChange={(value) => handleChange('month', value)}
            options={MONTH_OPTIONS}
            placeholder={placeholder.month}
            type="select"
            value={input.month}
          />
          <FieldForm
            disabled={!input.month}
            label="Day"
            name="day"
            onChange={(value) => handleChange('day', value)}
            options={dayOptions}
            placeholder={placeholder.day}
            type="select"
            value={input.day}
          />
        </div>
        <div className="flex w-full justify-between gap-1 desktop:w-1/2">
          <FieldForm
            label="Hour"
            name="hour"
            onChange={(value) => handleChange('hour', value)}
            options={HOUR_OPTIONS}
            placeholder={placeholder.hour}
            type="select"
            value={input.hour}
          />
          <FieldForm
            label="Minute"
            name="minute"
            onChange={(value) => handleChange('minute', value)}
            options={MIN_SEC_OPTIONS}
            placeholder={placeholder.minute}
            type="select"
            value={input.minute}
          />
          <FieldForm
            label="Second"
            name="second"
            onChange={(value) => handleChange('second', value)}
            options={MIN_SEC_OPTIONS}
            placeholder={placeholder.second}
            type="select"
            value={input.second}
          />
        </div>
      </div>
      <div aria-live="polite">
        <AnimatePresence mode="wait">
          {result.length > 0 && (
            <DataCellTable
              rows={[
                {
                  label: 'Unix Timestamp',
                  render: renderWithCopy('Unix Timestamp'),
                  value: result[0],
                },
                { label: 'GMT', render: renderWithCopy('GMT'), value: result[1] },
                { label: 'Local', render: renderWithCopy('Local'), value: result[2] },
              ]}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

const toolEntry = TOOL_REGISTRY_MAP['unix-timestamp']

export const TimeUnixTimestamp = () => {
  const { toast } = useToast()
  const showError = (label: string) => toast({ action: 'add', item: { label, type: 'error' } })
  return (
    <div className="flex grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}
      <UnixTimestampSection showError={showError} />
      <hr />
      <DateSection />
    </div>
  )
}
