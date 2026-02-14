import { useState } from 'react'

import { Button, CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolError } from '@/hooks'
import { generateBulkUuids, generateUuid } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['uuid-generator']

export const UuidGenerator = () => {
  const [count, setCount] = useState(1)
  const [uuids, setUuids] = useState(() => [generateUuid()])
  const { error } = useToolError()

  const handleGenerate = () => {
    setUuids(generateBulkUuids(count))
  }

  const handleCountChange = (val: string) => {
    const parsed = Number.parseInt(val, 10)
    if (Number.isNaN(parsed)) {
      setCount(1)
      return
    }
    setCount(Math.max(1, Math.min(100, parsed)))
  }

  return (
    <div className="flex size-full grow flex-col gap-4">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

      <div className="flex items-end gap-4">
        <FieldForm
          label="Count"
          max={100}
          min={1}
          name="count"
          onChange={handleCountChange}
          placeholder="1-100"
          type="number"
          value={String(count)}
        />
        <Button onClick={handleGenerate} variant="default">
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
              <span className="font-mono text-sm text-gray-300">
                {uuids.length > 1 && <span className="text-gray-600">{i + 1}. </span>}
                {uuid}
              </span>
              <CopyButton label={`UUID ${i + 1}`} value={uuid} />
            </div>
          ))}
        </div>
      </div>

      {error != null && (
        <p className="text-error text-body-sm shrink-0" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
