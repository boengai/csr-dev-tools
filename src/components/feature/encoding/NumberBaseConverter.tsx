import { useState } from 'react'

import { CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { convertBase, isValidForBase } from '@/utils/number-base'

const toolEntry = TOOL_REGISTRY_MAP['number-base-converter']

type BaseField = {
  base: number
  label: string
  name: string
  placeholder: string
}

const BASE_FIELDS: Array<BaseField> = [
  { base: 2, label: 'Binary', name: 'binary', placeholder: '101010' },
  { base: 8, label: 'Octal', name: 'octal', placeholder: '52' },
  { base: 10, label: 'Decimal', name: 'decimal', placeholder: '42' },
  { base: 16, label: 'Hexadecimal', name: 'hex', placeholder: '2a' },
]

export const NumberBaseConverter = () => {
  const [values, setValues] = useState<Record<string, string>>({ binary: '', decimal: '', hex: '', octal: '' })
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(true)
  const { toast } = useToast()

  const updateAllFromField = (val: string, fromBase: number, fromName: string) => {
    if (val.trim().length === 0) {
      setValues({ binary: '', decimal: '', hex: '', octal: '' })
      setError('')
      return
    }

    if (!isValidForBase(val, fromBase)) {
      setError(`Invalid character for base ${fromBase.toString()}`)
      return
    }

    setError('')

    try {
      const newValues: Record<string, string> = {}
      for (const field of BASE_FIELDS) {
        if (field.name === fromName) {
          newValues[field.name] = val
        } else {
          newValues[field.name] = convertBase(val, fromBase, field.base)
        }
      }
      setValues(newValues)
    } catch {
      toast({
        action: 'add',
        item: { label: 'Conversion failed — please check your input', type: 'error' },
      })
    }
  }

  const debouncedUpdate = useDebounceCallback((val: string, fromBase: number, fromName: string) => {
    updateAllFromField(val, fromBase, fromName)
  }, 300)

  const handleChange = (val: string, field: BaseField) => {
    setValues((prev) => ({ ...prev, [field.name]: val }))
    debouncedUpdate(val, field.base, field.name)
  }

  const handleReset = () => {
    setValues({ binary: '', decimal: '', hex: '', octal: '' })
    setError('')
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <p className="text-body-sm text-gray-400">Enter a number in any base to convert</p>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title="Number Base Converter"
      >
        <div className="flex w-full grow flex-col gap-4">
          {error && (
            <p className="text-red-500 text-body-xs" role="alert">
              {error}
            </p>
          )}
          <div aria-live="polite" className="flex size-full grow flex-col gap-6">
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
      </Dialog>
    </>
  )
}
