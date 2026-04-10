import { useCallback, useRef, useState } from 'react'

import { CopyButton, TextAreaInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { computeHash, DEFAULT_HASH_ALGORITHM, HASH_ALGORITHMS, type HashAlgorithm } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['hash-generator']

export const HashGenerator = () => {
  const [text, setText] = useState('')
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>(DEFAULT_HASH_ALGORITHM)
  const [hash, setHash] = useState('')
  const sessionRef = useRef(0)
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
      const session = ++sessionRef.current
      try {
        const result = await computeHash(input, algo)
        if (session === sessionRef.current && textRef.current === input) {
          setHash(result)
        }
      } catch {
        if (session === sessionRef.current && textRef.current === input) {
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
    [toast],
  )

  const debouncedCompute = useDebounceCallback((input: string) => {
    handleCompute(input, algorithmRef.current)
  }, 300)

  const handleTextChange = (value: string) => {
    setText(value)
    if (!value) {
      ++sessionRef.current
      setHash('')
      return
    }
    debouncedCompute(value)
  }

  const handleAlgorithmChange = (algo: HashAlgorithm) => {
    setAlgorithm(algo)
    handleCompute(text, algo)
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <TextAreaInput name="hash-input" onChange={handleTextChange} placeholder="Enter text to hash..." value={text} />

      <div className="flex shrink-0 flex-wrap gap-2">
        {HASH_ALGORITHMS.map((algo) => (
          <button
            aria-label={`Select ${algo} algorithm`}
            aria-pressed={algo === algorithm}
            className="text-xs rounded border px-3 font-mono leading-7 data-[state=active]:border-primary data-[state=active]:bg-primary/20 data-[state=active]:font-bold data-[state=active]:text-primary data-[state=inactive]:border-gray-700 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500"
            data-state={algo === algorithm ? 'active' : 'inactive'}
            key={algo}
            onClick={() => handleAlgorithmChange(algo)}
            type="button"
          >
            {algo}
          </button>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-gray-900" />

      <div aria-live="polite" className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-medium text-gray-400">{algorithm} Hash</span>
          {hash && <CopyButton label="hash value" value={hash} />}
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
          <span className="text-sm font-mono break-all text-gray-300">{hash || '\u2014'}</span>
        </div>
      </div>
    </div>
  )
}
