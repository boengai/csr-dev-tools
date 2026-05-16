import { useEffect, useState } from 'react'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { PxRemInput, PxRemLastEdited, PxRemOutput } from '@/types'
import { solvePxRem } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['px-to-rem']

const INITIAL_BAG = { base: '16', lastEdited: 'px' as PxRemLastEdited, px: '', rem: '' }

const INVALID_BASE_MSG = 'Base font size must be a positive number (e.g., 16)'

export const UnitPxToRem = () => {
  const { showError } = useToast()
  const [fields, setFields] = useState(INITIAL_BAG)

  const { result, setInput, setInputImmediate } = useToolComputation<PxRemInput, PxRemOutput | null>(solvePxRem, {
    debounceMs: 300,
    initial: null,
    isEmpty: ({ px, rem, source }) => {
      if (source === 'px') return !px.trim()
      if (source === 'rem') return !rem.trim()
      return false
    },
    onError: (err) => showError(err instanceof Error ? err.message : 'Invalid input'),
  })

  useEffect(() => {
    if (result) {
      setFields((prev) => ({ ...prev, ...result }))
    }
  }, [result])

  const handlePxChange = (val: string) => {
    setFields((prev) => ({
      ...prev,
      lastEdited: 'px',
      px: val,
      rem: val.trim() === '' ? '' : prev.rem,
    }))
    const input: PxRemInput = { base: fields.base, lastEdited: 'px', px: val, rem: fields.rem, source: 'px' }
    if (val.trim() === '') {
      setInputImmediate(input)
      return
    }
    setInput(input)
  }

  const handleRemChange = (val: string) => {
    setFields((prev) => ({
      ...prev,
      lastEdited: 'rem',
      px: val.trim() === '' ? '' : prev.px,
      rem: val,
    }))
    const input: PxRemInput = { base: fields.base, lastEdited: 'rem', px: fields.px, rem: val, source: 'rem' }
    if (val.trim() === '') {
      setInputImmediate(input)
      return
    }
    setInput(input)
  }

  const handleBaseChange = (val: string) => {
    setFields((prev) => ({ ...prev, base: val }))
    const baseNum = Number(val)
    if (val.trim() === '' || Number.isNaN(baseNum) || baseNum <= 0) {
      showError(INVALID_BASE_MSG)
      return
    }
    setInput({ base: val, lastEdited: fields.lastEdited, px: fields.px, rem: fields.rem, source: 'base' })
  }

  const { base, px, rem } = fields

  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}
      <div aria-live="polite" className="flex w-full items-center *:w-1/2">
        <FieldForm
          label="PX"
          name="px"
          onChange={handlePxChange}
          placeholder="16"
          suffix={<CopyButton label="PX" value={px} />}
          type="text"
          value={px}
        />
        <FieldForm
          label="REM"
          name="rem"
          onChange={handleRemChange}
          placeholder="1"
          suffix={<CopyButton label="REM" value={rem} />}
          type="text"
          value={rem}
        />
      </div>
      <FieldForm
        label="Base (px)"
        name="base"
        onChange={handleBaseChange}
        placeholder="16"
        type="text"
        value={base}
      />
      {Number(base) > 0 && (
        <p className="text-center text-body-sm text-gray-400">
          Calculation based on a root font-size of {base} pixel.
        </p>
      )}
    </div>
  )
}
