import { useState } from 'react'

import { Button, CheckboxInput, CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { generateLoremIpsum } from '@/utils/lorem-ipsum'

const toolEntry = TOOL_REGISTRY_MAP['lorem-ipsum-generator']

type LoremUnit = 'paragraphs' | 'sentences' | 'words'

const UNIT_OPTIONS = [
  { label: 'Paragraphs', value: 'paragraphs' },
  { label: 'Sentences', value: 'sentences' },
  { label: 'Words', value: 'words' },
]

export const LoremIpsumGenerator = () => {
  const [count, setCount] = useState(3)
  const [unit, setUnit] = useState<LoremUnit>('paragraphs')
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [output, setOutput] = useState(() => generateLoremIpsum(3, 'paragraphs', true))

  const handleGenerate = () => {
    setOutput(generateLoremIpsum(count, unit, startWithLorem))
  }

  const handleCountChange = (val: string) => {
    const parsed = Number(val)
    if (Number.isNaN(parsed)) return
    setCount(parsed)
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="flex flex-col gap-3">
        <FieldForm
          label="Count"
          max={50}
          min={1}
          name="count"
          onChange={handleCountChange}
          type="range"
          value={String(count)}
        />
        <FieldForm
          label="Unit"
          name="unit"
          onChange={(val) => setUnit(val as LoremUnit)}
          options={UNIT_OPTIONS}
          type="select"
          value={unit}
        />
        <label className="flex items-center gap-2 text-body-sm text-gray-400">
          <CheckboxInput checked={startWithLorem} onChange={setStartWithLorem} />
          Start with &quot;Lorem ipsum dolor sit amet...&quot;
        </label>
        <Button onClick={handleGenerate} variant="primary">
          Generate
        </Button>
      </div>

      <div className="border-t-2 border-dashed border-gray-900" />

      <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-medium text-gray-400">Generated Text</span>
          {output.length > 0 && <CopyButton label="lorem ipsum" value={output} />}
        </div>

        <div className="max-h-80 overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3">
          <p className="text-sm whitespace-pre-wrap text-gray-300">{output}</p>
        </div>
      </div>
    </div>
  )
}
