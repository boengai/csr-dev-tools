import { useState } from 'react'

import { Button, CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { DEFAULT_PASSWORD_OPTIONS, generatePassword } from '@/utils'

import type { PasswordOptions } from '@/utils'

const CHAR_TOGGLES: Array<{
  key: keyof Pick<PasswordOptions, 'digits' | 'lowercase' | 'symbols' | 'uppercase'>
  label: string
}> = [
  { key: 'uppercase', label: 'ABC' },
  { key: 'lowercase', label: 'abc' },
  { key: 'digits', label: '123' },
  { key: 'symbols', label: '!@#' },
]

const toolEntry = TOOL_REGISTRY_MAP['password-generator']

export const PasswordGenerator = () => {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS)
  const [count, setCount] = useState(1)
  const [passwords, setPasswords] = useState(() => [generatePassword(DEFAULT_PASSWORD_OPTIONS)])

  const handleGenerate = () => {
    setPasswords(Array.from({ length: count }, () => generatePassword(options)))
  }

  const handleLengthChange = (value: string) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return
    setOptions((prev) => ({ ...prev, length: parsed }))
  }

  const handleCountChange = (value: string) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return
    setCount(parsed)
  }

  const handleToggle = (key: keyof Pick<PasswordOptions, 'digits' | 'lowercase' | 'symbols' | 'uppercase'>) => {
    const activeCount = [options.uppercase, options.lowercase, options.digits, options.symbols].filter(Boolean).length
    if (options[key] && activeCount <= 1) return
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

      <div className="flex shrink-0 items-end gap-3">
        <div className="flex w-3/5 flex-col gap-3">
          <FieldForm
            label="Length"
            max={128}
            min={8}
            name="pw-length"
            onChange={handleLengthChange}
            type="range"
            value={String(options.length)}
          />
          <FieldForm
            label="Count"
            max={20}
            min={1}
            name="pw-count"
            onChange={handleCountChange}
            type="range"
            value={String(count)}
          />
        </div>
        <div className="flex w-2/5 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {CHAR_TOGGLES.map(({ key, label }) => (
              <button
                aria-label={`Toggle ${label}`}
                aria-pressed={options[key]}
                className={`w-[calc(50%-0.25rem)] rounded border px-3 font-mono text-xs leading-7 ${
                  options[key]
                    ? 'border-primary bg-primary/20 text-primary font-bold'
                    : 'border-gray-700 bg-transparent text-gray-500'
                }`}
                key={key}
                onClick={() => handleToggle(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <Button block onClick={handleGenerate} variant="default">
            Generate
          </Button>
        </div>
      </div>
      <div className="border-t-2 border-dashed border-gray-900" />
      <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-medium text-gray-400">Generated Passwords ({passwords.length})</span>
          {passwords.length > 0 && <CopyButton label="all passwords" value={passwords.join('\n')} />}
        </div>
        <div className="flex max-h-80 flex-col gap-1 overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3">
          {passwords.map((pw, i) => (
            <div className="flex items-center justify-between gap-2" key={i}>
              <span className="font-mono text-sm break-all text-gray-300">
                {passwords.length > 1 && <span className="text-gray-600">{i + 1}. </span>}
                {pw}
              </span>
              <CopyButton label={`password ${i + 1}`} value={pw} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
