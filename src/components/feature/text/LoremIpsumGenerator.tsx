import { CheckboxInput, FieldForm, GeneratorShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { LoremIpsumOptions, LoremUnit, ToolComponentProps } from '@/types'
import { generateLoremIpsum } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['lorem-ipsum-generator']

const UNIT_OPTIONS: Array<{ label: string; value: LoremUnit }> = [
  { label: 'Paragraphs', value: 'paragraphs' },
  { label: 'Sentences', value: 'sentences' },
  { label: 'Words', value: 'words' },
]

const MAX_COUNT = 50

// Deterministic: the same options always give the same text, so it runs live.
// An out-of-range count (e.g. a cleared number box) is clamped; only corrupt
// saved options are an error.
const generate = ({ count, startWithLorem, unit }: LoremIpsumOptions): string => {
  if (typeof count !== 'number' || !Number.isFinite(count)) throw new Error('Count must be a number')
  if (!UNIT_OPTIONS.some((o) => o.value === unit)) throw new Error('Pick paragraphs, sentences or words')
  return generateLoremIpsum(Math.min(MAX_COUNT, Math.max(1, Math.floor(count))), unit, startWithLorem)
}

export const LoremIpsumGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <GeneratorShell
    autoOpen={autoOpen}
    compute={generate}
    description={toolEntry?.description}
    initial={{ count: 3, startWithLorem: true, unit: 'paragraphs' }}
    onAfterClose={onAfterClose}
    output={{ kind: 'text', label: 'Lorem ipsum', placeholder: 'Pick a count and unit to generate text' }}
    renderOptions={({ options, setOptions }) => (
      <>
        <FieldForm
          label="Count"
          max={MAX_COUNT}
          min={1}
          name="count"
          onChange={(val: string) => {
            const parsed = Number(val)
            if (!Number.isNaN(parsed)) setOptions({ count: parsed })
          }}
          type="range"
          value={String(options.count)}
        />
        <FieldForm
          label="Unit"
          name="unit"
          onChange={(val: string) => setOptions({ unit: val as LoremUnit })}
          options={UNIT_OPTIONS}
          type="select"
          value={options.unit}
        />
        <label className="flex items-center gap-2 text-body-sm text-gray-400" htmlFor="start-with-lorem">
          <CheckboxInput
            checked={options.startWithLorem}
            id="start-with-lorem"
            onChange={(startWithLorem: boolean) => setOptions({ startWithLorem })}
          />
          Start with &quot;Lorem ipsum dolor sit amet...&quot;
        </label>
      </>
    )}
    run={{ mode: 'live' }}
    storageKey="csr-dev-tools-lorem-ipsum-generator"
    title="Lorem Ipsum Generator"
    triggerLabel="Generate"
  />
)
