import { useEffect, useState } from 'react'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { BaseField, BaseInput, BaseResult, ToolComponentProps } from '@/types'
import { convertBase, isValidForBase } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['number-base-converter']
const BASE_FIELDS: Array<BaseField> = [
  { base: 2, label: 'Binary', name: 'binary', placeholder: '101010' },
  { base: 8, label: 'Octal', name: 'octal', placeholder: '52' },
  { base: 10, label: 'Decimal', name: 'decimal', placeholder: '42' },
  { base: 16, label: 'Hexadecimal', name: 'hex', placeholder: '2a' },
]

const EMPTY_VALUES: Record<string, string> = { binary: '', decimal: '', hex: '', octal: '' }

const INITIAL_RESULT: BaseResult = { values: null, error: '' }

export const NumberBaseConverter = (_props: ToolComponentProps) => {
  const [values, setValues] = useState<Record<string, string>>(EMPTY_VALUES)
  const { showError } = useToast()

  const { result, setInput } = useToolComputation<BaseInput, BaseResult>(
    async ({ val, fromBase, fromName }) => {
      if (!(await isValidForBase(val, fromBase))) {
        return { values: null, error: `Invalid character for base ${fromBase.toString()}` }
      }

      const newValues: Record<string, string> = {}
      for (const field of BASE_FIELDS) {
        if (field.name === fromName) {
          newValues[field.name] = val
        } else {
          newValues[field.name] = await convertBase(val, fromBase, field.base)
        }
      }
      return { values: newValues, error: '' }
    },
    {
      debounceMs: 300,
      initial: INITIAL_RESULT,
      isEmpty: ({ val }) => val.trim().length === 0,
      onError: () => {
        showError('Conversion failed — please check your input')
      },
    },
  )

  // Sync converted values down into local `values` so the non-typed fields
  // update after each compute resolves. The typed field stays in sync because
  // `handleChange` echoes the keystroke immediately.
  useEffect(() => {
    if (result.values) setValues(result.values)
  }, [result.values])

  const handleChange = (val: string, field: BaseField) => {
    if (val.trim().length === 0) {
      setValues(EMPTY_VALUES)
    } else {
      setValues((prev) => ({ ...prev, [field.name]: val }))
    }
    setInput({ val, fromBase: field.base, fromName: field.name })
  }

  const error = result.error

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      {error && (
        <p className="text-red-500 text-body-xs" role="alert">
          {error}
        </p>
      )}

      <div aria-live="polite" className="flex w-full grow flex-col gap-4">
        {BASE_FIELDS.map((field) => (
          <div className="flex min-h-0 flex-col gap-2" key={field.name}>
            <FieldForm
              label={
                <span className="flex items-center gap-1">
                  <span>
                    {field.label} (base {field.base.toString()})
                  </span>
                  <CopyButton label={field.label} value={values[field.name]} />
                </span>
              }
              name={field.name}
              onChange={(val: string) => handleChange(val, field)}
              placeholder={field.placeholder}
              type="text"
              value={values[field.name]}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
