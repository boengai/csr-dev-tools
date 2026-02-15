import { useState } from 'react'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { pxToRem, remToPx } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['px-to-rem']

export const UnitPxToRem = () => {
  const [pxValue, setPxValue] = useState('')
  const [remValue, setRemValue] = useState('')
  const [baseValue, setBaseValue] = useState('16')
  const [lastEdited, setLastEdited] = useState<'px' | 'rem'>('px')
  const { toast } = useToast()

  const showError = (label: string) => toast({ action: 'add', item: { label, type: 'error' } })

  const dbConvertPxToRem = useDebounceCallback((px: string, base: string) => {
    if (px.trim() === '') {
      setRemValue('')
      return
    }
    const pxNum = Number(px)
    const baseNum = Number(base)
    if (Number.isNaN(pxNum)) {
      showError('Enter a valid PX value (e.g., 16)')
      return
    }
    if (Number.isNaN(baseNum) || baseNum <= 0) {
      showError('Base font size must be a positive number (e.g., 16)')
      return
    }
    setRemValue(pxToRem(pxNum, baseNum).toString())
  }, 300)

  const dbConvertRemToPx = useDebounceCallback((rem: string, base: string) => {
    if (rem.trim() === '') {
      setPxValue('')
      return
    }
    const remNum = Number(rem)
    const baseNum = Number(base)
    if (Number.isNaN(remNum)) {
      showError('Enter a valid REM value (e.g., 1)')
      return
    }
    if (Number.isNaN(baseNum) || baseNum <= 0) {
      showError('Base font size must be a positive number (e.g., 16)')
      return
    }
    setPxValue(remToPx(remNum, baseNum).toString())
  }, 300)

  const handlePxChange = (val: string) => {
    setPxValue(val)
    setLastEdited('px')
    if (val.trim() === '') {
      setRemValue('')
      return
    }
    dbConvertPxToRem(val, baseValue)
  }

  const handleRemChange = (val: string) => {
    setRemValue(val)
    setLastEdited('rem')
    if (val.trim() === '') {
      setPxValue('')
      return
    }
    dbConvertRemToPx(val, baseValue)
  }

  const handleBaseChange = (val: string) => {
    setBaseValue(val)
    const baseNum = Number(val)
    if (val.trim() === '' || Number.isNaN(baseNum) || baseNum <= 0) {
      showError('Base font size must be a positive number (e.g., 16)')
      return
    }
    if (lastEdited === 'px' && pxValue.trim() !== '') {
      dbConvertPxToRem(pxValue, val)
    } else if (lastEdited === 'rem' && remValue.trim() !== '') {
      dbConvertRemToPx(remValue, val)
    }
  }

  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-4">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}
      <div aria-live="polite" className="flex w-full items-center [&>*]:w-1/2">
        <FieldForm
          label="PX"
          name="px"
          onChange={handlePxChange}
          placeholder="16"
          suffix={<CopyButton label="PX" value={pxValue} />}
          type="text"
          value={pxValue}
        />
        <FieldForm
          label="REM"
          name="rem"
          onChange={handleRemChange}
          placeholder="1"
          suffix={<CopyButton label="REM" value={remValue} />}
          type="text"
          value={remValue}
        />
      </div>
      <FieldForm
        label="Base (px)"
        name="base"
        onChange={handleBaseChange}
        placeholder="16"
        type="text"
        value={baseValue}
      />
      {Number(baseValue) > 0 && (
        <p className="text-body-sm text-center text-gray-400">
          Calculation based on a root font-size of {baseValue} pixel.
        </p>
      )}
    </div>
  )
}
