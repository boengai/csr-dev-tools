import { ToggleButton, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { HashInput, ToolComponentProps } from '@/types'
import { computeHash, DEFAULT_HASH_ALGORITHM, HASH_ALGORITHMS } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['hash-generator']

const INITIAL: HashInput = { algo: DEFAULT_HASH_ALGORITHM, source: '' }

export const HashGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<HashInput>
    autoOpen={autoOpen}
    compute={async ({ algo, source }) => {
      try {
        return await computeHash(source, algo)
      } catch {
        throw new Error(
          algo === 'MD5'
            ? 'MD5 library failed to load — try refreshing the page'
            : 'Hash computation failed — your browser may not support this feature',
        )
      }
    }}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    renderControls={({ inputs, setFieldsImmediate }) => (
      <div className="flex flex-wrap gap-2">
        {HASH_ALGORITHMS.map((alg) => (
          <ToggleButton
            aria-label={`Select ${alg} algorithm`}
            key={alg}
            onClick={() => setFieldsImmediate({ algo: alg })}
            pressed={alg === inputs.algo}
          >
            {alg}
          </ToggleButton>
        ))}
      </div>
    )}
    resultLabel={({ algo }) => `${algo} Hash`}
    resultPlaceholder="Enter text to see its hash"
    sourceKind="textarea"
    sourceLabel="Text to hash"
    sourcePlaceholder="Enter text to hash..."
    // People hash passwords and secrets here: never write the input to localStorage.
    persistInput={false}
    title="Hash Generator"
    triggerLabel="Generate Hash"
  />
)
