import { useState } from 'react'

import { Button, CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { generateBulkUuids, generateUuid } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['uuid-generator']

export const UuidGenerator = () => {
  const [count, setCount] = useState(1)
  const [uuids, setUuids] = useState(() => [generateUuid()])

  const handleGenerate = () => {
    setUuids(generateBulkUuids(count))
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
          max={100}
          min={1}
          name="count"
          onChange={handleCountChange}
          type="range"
          value={String(count)}
        />
        <Button onClick={handleGenerate} variant="primary">
          Generate
        </Button>
      </div>

      <div className="border-t-2 border-dashed border-gray-900" />

      <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-medium text-gray-400">Generated UUIDs ({uuids.length})</span>
          {uuids.length > 0 && <CopyButton label="all UUIDs" value={uuids.join('\n')} />}
        </div>

        <div className="flex max-h-80 flex-col gap-1 overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3">
          {uuids.map((uuid, i) => (
            <div className="flex items-center justify-between gap-2" key={i}>
              <span className="text-sm font-mono text-gray-300">
                {uuids.length > 1 && <span className="text-gray-600">{i + 1}. </span>}
                {uuid}
              </span>
              <CopyButton label={`UUID ${i + 1}`} value={uuid} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
