import { FieldForm, GeneratorShell, ToggleButton } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { PasswordCharSet, PasswordGeneratorOptions, ToolComponentProps } from '@/types'
import { DEFAULT_PASSWORD_OPTIONS, generatePassword } from '@/utils'

const CHAR_TOGGLES: Array<{ key: PasswordCharSet; label: string }> = [
  { key: 'uppercase', label: 'ABC' },
  { key: 'lowercase', label: 'abc' },
  { key: 'digits', label: '123' },
  { key: 'symbols', label: '!@#' },
]

const LENGTH = { max: 128, min: 8 }
const COUNT = { max: 20, min: 1 }

const toolEntry = TOOL_REGISTRY_MAP['password-generator']

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

// Out-of-range numbers (e.g. a cleared number box) are clamped — the length by
// generatePassword. Only corrupt saved options are an error.
const generate = async (options: PasswordGeneratorOptions): Promise<Array<string>> => {
  if (!isNumber(options.length) || !isNumber(options.count)) throw new Error('Length and count must be numbers')
  if (!CHAR_TOGGLES.some(({ key }) => options[key])) throw new Error('Pick at least one character set')
  const count = Math.min(COUNT.max, Math.max(COUNT.min, Math.floor(options.count)))
  return Array.from({ length: count }, () => generatePassword(options))
}

const parseNumber = (val: string): number | null => {
  const parsed = Number(val)
  return Number.isNaN(parsed) ? null : parsed
}

export const PasswordGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <GeneratorShell
    autoOpen={autoOpen}
    compute={generate}
    description={toolEntry?.description}
    initial={{ ...DEFAULT_PASSWORD_OPTIONS, count: 1 }}
    onAfterClose={onAfterClose}
    output={{
      itemLabel: 'password',
      kind: 'list',
      label: 'Passwords',
      placeholder: 'Press Generate to create passwords',
    }}
    renderOptions={({ options, setOptions }) => {
      // The last enabled character set can't be switched off.
      const activeCount = CHAR_TOGGLES.filter(({ key }) => options[key]).length
      return (
        <>
          <FieldForm
            label="Length"
            max={LENGTH.max}
            min={LENGTH.min}
            name="pw-length"
            onChange={(val: string) => {
              const length = parseNumber(val)
              if (length !== null) setOptions({ length })
            }}
            type="range"
            value={String(options.length)}
          />
          <FieldForm
            label="Count"
            max={COUNT.max}
            min={COUNT.min}
            name="pw-count"
            onChange={(val: string) => {
              const count = parseNumber(val)
              if (count !== null) setOptions({ count })
            }}
            type="range"
            value={String(options.count)}
          />
          <div className="grid grid-cols-4 gap-2">
            {CHAR_TOGGLES.map(({ key, label }) => (
              <ToggleButton
                aria-label={`Toggle ${label}`}
                key={key}
                onClick={() => {
                  if (options[key] && activeCount <= 1) return
                  setOptions({ [key]: !options[key] } as Partial<PasswordGeneratorOptions>)
                }}
                pressed={options[key]}
              >
                {label}
              </ToggleButton>
            ))}
          </div>
        </>
      )
    }}
    run={{ generateLabel: 'Generate', mode: 'random' }}
    storageKey="csr-dev-tools-password-generator"
    title="Password Generator"
    triggerLabel="Generate"
  />
)
