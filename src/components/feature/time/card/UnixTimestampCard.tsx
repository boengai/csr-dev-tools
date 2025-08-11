import { AnimatePresence } from 'motion/react'
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'

import type { DateTime, SelectInputProps, UseCopyToClipboard } from '@/types'

import { Button, Card, CopyIcon, DataCellTable, FieldForm } from '@/components/common'
import { useCopyToClipboard } from '@/hooks'
import { getDaysInMonth } from '@/utils'

const MONTH_LABELS: Array<string> = [
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
  const [input, setInput]: [string, Dispatch<SetStateAction<string>>] = useState<string>('')
  const [result, setResult]: [Array<string>, Dispatch<SetStateAction<Array<string>>>] = useState<Array<string>>([])

  const handleConvert = () => {
    const d: Date = new Date(Number(input) * 1000)

    if (isNaN(d.getTime())) {
      return
    }

    setResult([d.toUTCString(), d.toString()])
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-end gap-2 [&>*:first-child]:w-2/3 [&>*:last-child]:w-1/3">
        <FieldForm
          label="Enter a Timestamp"
          name="unixTimestamp"
          onChange={(val: string) => setInput(val)}
          onEnter={handleConvert}
          placeholder={Math.floor(Date.now() / 1000).toString()}
          type="number"
          value={input}
        />
        <Button disabled={!input} onClick={handleConvert} variant="primary">
          Convert
        </Button>
      </div>
      <p className="text-body-sm text-center text-gray-500">Only Supports Unix timestamps in seconds.</p>
      <AnimatePresence mode="wait">
        {result.length > 0 && (
          <DataCellTable
            rows={[
              { label: 'GMT', value: result[0] },
              { label: 'Local', value: result[1] },
            ]}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

export const DateSection = () => {
  // hook
  const copyToClipboard: UseCopyToClipboard = useCopyToClipboard()

  // states
  const [input, setInput]: [DateTime<string>, Dispatch<SetStateAction<DateTime<string>>>] = useState<DateTime<string>>({
    day: '',
    hour: '0',
    minute: '0',
    month: '',
    second: '0',
    year: '',
  })
  const [result, setResult]: [Array<string>, Dispatch<SetStateAction<Array<string>>>] = useState<Array<string>>([])

  const placeholder: DateTime<string> = useMemo(() => {
    const d: Date = new Date()
    return {
      day: d.getDate().toString(),
      hour: d.getHours().toString(),
      minute: d.getMinutes().toString(),
      month: MONTH_LABELS[d.getMonth()],
      second: d.getSeconds().toString(),
      year: d.getFullYear().toString(),
    }
  }, [])

  const monthOptions: SelectInputProps['options'] = MONTH_LABELS.map((label: string, i: number) => ({
    label: label,
    value: i.toString(),
  }))

  const dayOptions: SelectInputProps['options'] = useMemo(() => {
    // calculate days in month
    const daysInMonth: number = getDaysInMonth(Number(input.year), Number(input.month) + 1)

    return Array.from({ length: daysInMonth }, (_: unknown, i: number) => {
      const val: string = (i + 1).toString()
      return {
        label: val,
        value: val,
      }
    })
  }, [input.year, input.month])

  const hourOptions: SelectInputProps['options'] = Array.from({ length: 24 }, (_: unknown, i: number) => {
    const val: string = i.toString()
    return {
      label: val,
      value: val,
    }
  })

  const minSecOptions: SelectInputProps['options'] = Array.from({ length: 60 }, (_: unknown, i: number) => {
    const val: string = i.toString()
    return {
      label: val,
      value: val,
    }
  })

  const handleChange = (key: keyof DateTime, value: string) => {
    const newInput: DateTime<string> = { ...input, [key]: value }
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

    const d: Date = new Date(
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
    <section className="flex flex-col gap-2">
      <div className="desktop:flex-row flex flex-col justify-between gap-1 [&>div>fieldset]:w-1/3">
        <div className="desktop:w-1/2 flex w-full justify-between gap-1">
          <FieldForm
            label="Year"
            name="year"
            onChange={(val: string) => handleChange('year', val)}
            placeholder={placeholder.year}
            type="number"
            value={input.year}
          />
          <FieldForm
            disabled={!input.year}
            label="Month"
            name="month"
            onChange={(value: string) => handleChange('month', value)}
            options={monthOptions}
            placeholder={placeholder.month}
            type="select"
            value={input.month}
          />
          <FieldForm
            disabled={!input.month}
            label="Day"
            name="day"
            onChange={(value: string) => handleChange('day', value)}
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
            onChange={(value: string) => handleChange('hour', value)}
            options={hourOptions}
            placeholder={placeholder.hour}
            type="select"
            value={input.hour}
          />
          <FieldForm
            label="Minute"
            name="minute"
            onChange={(value: string) => handleChange('minute', value)}
            options={minSecOptions}
            placeholder={placeholder.minute}
            type="select"
            value={input.minute}
          />
          <FieldForm
            label="Second"
            name="second"
            onChange={(value: string) => handleChange('second', value)}
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
                render: (val: string) => (
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

export const UnixTimestampCard = () => {
  return (
    <Card title="Unix Timestamp">
      <div className="flex flex-col gap-4 overflow-y-auto">
        <UnixTimestampSection />
        <hr />
        <DateSection />
      </div>
    </Card>
  )
}
