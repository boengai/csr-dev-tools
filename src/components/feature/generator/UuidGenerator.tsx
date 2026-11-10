import { FieldForm, GeneratorShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps, UuidGeneratorOptions } from '@/types'
import { generateBulkUuids } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['uuid-generator']

const MAX_COUNT = 100

// Out-of-range counts (e.g. a cleared number box) are clamped by
// generateBulkUuids; only a non-number (corrupt saved options) is an error.
const generate = async ({ count }: UuidGeneratorOptions): Promise<Array<string>> => {
  if (typeof count !== 'number' || !Number.isFinite(count)) throw new Error('Count must be a number')
  return generateBulkUuids(count)
}

export const UuidGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <GeneratorShell
    autoOpen={autoOpen}
    compute={generate}
    description={toolEntry?.description}
    initial={{ count: 1 }}
    onAfterClose={onAfterClose}
    output={{ itemLabel: 'UUID', kind: 'list', label: 'UUIDs', placeholder: 'Press Generate to create UUIDs' }}
    renderOptions={({ options, setOptions }) => (
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
    )}
    run={{ generateLabel: 'Generate', mode: 'random' }}
    storageKey="csr-dev-tools-uuid-generator"
    title="UUID Generator"
    triggerLabel="Generate"
  />
)
