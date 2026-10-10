import { useState } from 'react'

import { Button, CopyButton, FieldForm, Pane } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useAsyncAction, useMountOnce, useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { generateBulkUuids } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['uuid-generator']

export const UuidGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [count, setCount] = useState(1)
  const { showSuccess } = useToast()

  const { result, run } = useAsyncAction<Array<string>>(() => generateBulkUuids(count))
  const uuids = result ?? []

  useMountOnce(() => {
    run()
  })

  const handleGenerate = async () => {
    const r = await run()
    if (r) {
      showSuccess(`Generated ${count} UUID${count > 1 ? 's' : ''}`)
    }
  }

  const handleCountChange = (val: string) => {
    const parsed = Number(val)
    if (Number.isNaN(parsed)) return
    setCount(parsed)
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      title="UUID Generator"
      triggers={[{ label: 'Generate' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
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

        <Pane live>
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-medium text-gray-400">Generated UUIDs ({uuids.length})</span>
            {uuids.length > 0 && <CopyButton label="all UUIDs" value={uuids.join('\n')} />}
          </div>

          <div className="flex max-h-80 flex-col gap-1 overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3">
            {uuids.map((uuid, i) => (
              <div className="flex items-center justify-between gap-2" key={uuid}>
                <span className="text-sm font-mono text-gray-300">
                  {uuids.length > 1 && <span className="text-gray-600">{i + 1}. </span>}
                  {uuid}
                </span>
                <CopyButton label={`UUID ${i + 1}`} value={uuid} />
              </div>
            ))}
          </div>
        </Pane>
      </div>
    </ToolDialogFrame>
  )
}
