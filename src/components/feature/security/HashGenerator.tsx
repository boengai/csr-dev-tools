import { useCallback, useRef, useState } from 'react'

import { Button, CopyButton, TextAreaInput, ToggleButton } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useStaleSafeAsync, useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { computeHash, DEFAULT_HASH_ALGORITHM, HASH_ALGORITHMS, type HashAlgorithm } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['hash-generator']

export const HashGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [text, setText] = useState('')
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>(DEFAULT_HASH_ALGORITHM)
  const [hash, setHash] = useState('')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const newSession = useStaleSafeAsync()
  const algorithmRef = useRef(algorithm)
  algorithmRef.current = algorithm
  const textRef = useRef(text)
  textRef.current = text
  const { toast } = useToast()

  const handleCompute = useCallback(
    async (input: string, algo: HashAlgorithm) => {
      if (!input) {
        setHash('')
        return
      }
      const session = newSession()
      try {
        const result = await computeHash(input, algo)
        if (session.isFresh() && textRef.current === input) {
          setHash(result)
        }
      } catch {
        if (session.isFresh() && textRef.current === input) {
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
        }
      }
    },
    [newSession, toast],
  )

  const debouncedCompute = useDebounceCallback((input: string) => {
    handleCompute(input, algorithmRef.current)
  }, 300)

  const handleTextChange = (value: string) => {
    setText(value)
    if (!value) {
      newSession()
      setHash('')
      return
    }
    debouncedCompute(value)
  }

  const handleAlgorithmChange = (algo: HashAlgorithm) => {
    setAlgorithm(algo)
    handleCompute(text, algo)
  }

  const handleReset = () => {
    newSession()
    setText('')
    setHash('')
    setAlgorithm(DEFAULT_HASH_ALGORITHM)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Generate Hash
          </Button>
        </div>
      </div>

      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
        size="default"
        title="Hash Generator"
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
            {HASH_ALGORITHMS.map((algo) => (
              <ToggleButton
                aria-label={`Select ${algo} algorithm`}
                key={algo}
                onClick={() => handleAlgorithmChange(algo)}
                pressed={algo === algorithm}
              >
                {algo}
              </ToggleButton>
            ))}
          </div>

          <div className="border-t-2 border-dashed border-gray-900" />

          <div aria-live="polite" className="flex min-h-0 flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-medium text-gray-400">{algorithm} Hash</span>
              {hash && <CopyButton label="hash value" value={hash} />}
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
              <span className="text-sm font-mono break-all text-gray-300">{hash || '—'}</span>
            </div>
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
