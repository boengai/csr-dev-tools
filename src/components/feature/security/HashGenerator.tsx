import { MonoOutputCell, TextAreaInput, ToggleButton } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFields } from '@/hooks'
import type { HashInput, ToolComponentProps } from '@/types'
import { computeHash, DEFAULT_HASH_ALGORITHM, HASH_ALGORITHMS, type HashAlgorithm } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['hash-generator']

const INITIAL: HashInput = { algo: DEFAULT_HASH_ALGORITHM, text: '' }

export const HashGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { toast } = useToast()

  const {
    inputs,
    result: hash,
    reset,
    setFields,
    setFieldsImmediate,
  } = useToolFields<HashInput, string>({
    compute: ({ algo, text }) => computeHash(text, algo),
    debounceMs: 300,
    initial: INITIAL,
    initialResult: '',
    isEmpty: ({ text }) => !text,
    onError: (_err, { algo }) => {
      toast({
        action: 'add',
        item: {
          label:
            algo === 'MD5'
              ? 'MD5 library failed to load — try refreshing the page'
              : 'Hash computation failed — your browser may not support this feature',
          type: 'error',
        },
      })
    },
  })
  const { algo, text } = inputs

  const handleTextChange = (value: string) => setFields({ text: value })
  const handleAlgorithmChange = (next: HashAlgorithm) => setFieldsImmediate({ algo: next })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      size="default"
      title="Hash Generator"
      triggers={[{ label: 'Generate Hash' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <TextAreaInput
          aria-label="Text to hash"
          name="hash-input"
          onChange={handleTextChange}
          placeholder="Enter text to hash..."
          value={text}
        />

        <div className="flex shrink-0 flex-wrap gap-2">
          {HASH_ALGORITHMS.map((alg) => (
            <ToggleButton
              aria-label={`Select ${alg} algorithm`}
              key={alg}
              onClick={() => handleAlgorithmChange(alg)}
              pressed={alg === algo}
            >
              {alg}
            </ToggleButton>
          ))}
        </div>

        <div className="border-t-2 border-dashed border-gray-900" />

        <MonoOutputCell copyAriaLabel="hash value" label={`${algo} Hash`} value={hash} />
      </div>
    </ToolDialogFrame>
  )
}
