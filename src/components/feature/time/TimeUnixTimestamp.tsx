import { AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'

import type { DateTime } from '@/types'

import { Button, CopyIcon, DataCellTable, FieldForm } from '@/components/common'
import { useCopyToClipboard, useDebounceCallback } from '@/hooks'
import { getDaysInMonth } from '@/utils'

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

const UnixTimestampSection = () => {
  // states
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Array<string>>([])

  // hooks
  const dbSetResult = useDebounceCallback((source: string) => {
    const inputNumber = Number(source)

    // Auto-detect if timestamp is in seconds or milliseconds
    // Current time in seconds: ~1.7 billion (Jan 2024)
    // Current time in milliseconds: ~1.7 trillion (Jan 2024)
    // Year 2001 in milliseconds: ~978 billion
    // If the number is > 100 billion, it's very likely milliseconds
    // since that would represent year 5138 in seconds (unrealistic)
    const isMilliseconds = inputNumber > 100_000_000_000

    const d = new Date(isMilliseconds ? inputNumber : inputNumber * 1_000)

    if (isNaN(d.getTime())) {
      return
    }

    setResult([isMilliseconds ? 'Milliseconds' : 'Seconds', d.toUTCString(), d.toString()])
  })

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
          type="number"
          value={input}
        />
      </div>
      <p className="text-body-sm text-center text-gray-500">
        Supports Unix timestamps in seconds or milliseconds (auto-detected).
      </p>
      <AnimatePresence mode="wait">
        {result.length > 0 && (
          <DataCellTable
            rows={[
              { label: 'Format', value: result[0] },
              { label: 'GMT', value: result[1] },
              { label: 'Local', value: result[2] },
            ]}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

export const DateSection = () => {
  // hook
  const copyToClipboard = useCopyToClipboard()

  // states
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

  const monthOptions = MONTH_LABELS.map((label, i) => ({
    label: label,
    value: i.toString(),
  }))

  const dayOptions = useMemo(() => {
    // calculate days in month
    const daysInMonth = getDaysInMonth(Number(input.year), Number(input.month) + 1)

    return Array.from({ length: daysInMonth }, (_, i) => {
      const val = (i + 1).toString()
      return {
        label: val,
        value: val,
      }
    })
  }, [input.year, input.month])

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const val = i.toString()
    return {
      label: val,
      value: val,
    }
  })

  const minSecOptions = Array.from({ length: 60 }, (_, i) => {
    const val = i.toString()
    return {
      label: val,
      value: val,
    }
  })

  const handleChange = (key: keyof DateTime, value: string) => {
    const newInput = { ...input, [key]: value }
    if (key === 'month' && newInput.day) {
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
      <div className="desktop:flex-row flex flex-col justify-between gap-1 [&>div>fieldset]:w-1/3">
        <div className="desktop:w-1/2 flex w-full justify-between gap-1">
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
            options={monthOptions}
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
        <div className="desktop:w-1/2 flex w-full justify-between gap-1">
          <FieldForm
            label="Hour"
            name="hour"
            onChange={(value) => handleChange('hour', value)}
            options={hourOptions}
            placeholder={placeholder.hour}
            type="select"
            value={input.hour}
          />
          <FieldForm
            label="Minute"
            name="minute"
            onChange={(value) => handleChange('minute', value)}
            options={minSecOptions}
            placeholder={placeholder.minute}
            type="select"
            value={input.minute}
          />
          <FieldForm
            label="Second"
            name="second"
            onChange={(value) => handleChange('second', value)}
            options={minSecOptions}
            placeholder={placeholder.second}
            type="select"
            value={input.second}
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        {result.length > 0 && (
          <DataCellTable
            rows={[
              {
                label: 'Unix Timestamp',
                render: (val) => (
                  <span className="flex items-center gap-1">
                    <span>{val}</span>
                    <Button onClick={() => copyToClipboard(val)} variant="text">
                      <CopyIcon size={14} />
                    </Button>
                  </span>
                ),
                value: result[0],
              },
              { label: 'GMT', value: result[1] },
              { label: 'Local', value: result[2] },
            ]}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

export const TimeUnixTimestamp = () => {
  return (
    <div className="flex grow flex-col gap-4">
      <UnixTimestampSection />
      <hr />
      <DateSection />
    </div>
  )
}
