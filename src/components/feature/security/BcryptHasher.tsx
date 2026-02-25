import { useCallback, useEffect, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { BcryptHashComponents, BcryptHashResult, BcryptVerifyResult } from '@/utils/bcrypt-hasher'

import { Button, CopyButton, SelectInput, Tabs, TextAreaInput, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import {
  checkPasswordTruncation,
  hashPassword,
  isValidBcryptHash,
  parseBcryptHash,
  verifyPassword,
} from '@/utils/bcrypt-hasher'

const toolEntry = TOOL_REGISTRY_MAP['bcrypt-hasher']

const COST_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const val = i + 4
  const labels: Record<number, string> = {
    4: '4 (fast)',
    10: '10 (default)',
    12: '12 (~300ms)',
    14: '14 (~1s)',
    16: '16 (~4s)',
    18: '18 (~18s)',
  }
  return { label: labels[val] ?? String(val), value: String(val) }
})

const INVALID_HASH_MESSAGE =
  'Invalid bcrypt hash. Expected format: $2a$/$2b$/$2y$ followed by cost and 53 characters (e.g., $2b$10$...)'

const HashTab = ({ onProcessingChange }: { onProcessingChange: (v: boolean) => void }) => {
  const [password, setPassword] = useState('')
  const [rounds, setRounds] = useState('10')
  const [hashing, setHashing] = useState(false)
  const [result, setResult] = useState<BcryptHashResult | null>(null)
  const [hashBreakdown, setHashBreakdown] = useState<BcryptHashComponents | null>(null)
  const [truncationWarning, setTruncationWarning] = useState(false)
  const [elapsedDisplay, setElapsedDisplay] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const { toast } = useToast()

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  const handlePasswordChange = useCallback((val: string) => {
    setPassword(val)
    setResult(null)
    setHashBreakdown(null)
    setTruncationWarning(checkPasswordTruncation(val))
  }, [])

  const handleHash = useCallback(async () => {
    setHashing(true)
    onProcessingChange(true)
    setResult(null)
    setHashBreakdown(null)
    startTimeRef.current = performance.now()
    setElapsedDisplay(0)

    timerRef.current = setInterval(() => {
      setElapsedDisplay((performance.now() - startTimeRef.current) / 1000)
    }, 100)

    try {
      const hashResult = await hashPassword(password, Number(rounds))
      setResult(hashResult)
      setHashBreakdown(parseBcryptHash(hashResult.hash))
    } catch {
      toast({
        action: 'add',
        item: { label: 'Hashing failed. Please try again.', type: 'error' },
      })
    } finally {
      clearTimer()
      setHashing(false)
      onProcessingChange(false)
    }
  }, [password, rounds, clearTimer, toast, onProcessingChange])

  return (
    <div className="flex w-full flex-col gap-4">
      <TextInput
        disabled={hashing}
        name="hash-password"
        onChange={handlePasswordChange}
        onEnter={hashing ? undefined : handleHash}
        placeholder="Enter password to hash..."
        type="text"
        value={password}
      />

      {truncationWarning && (
        <p className="text-amber-400 text-body-xs">
          Password exceeds 72 bytes — bcrypt will truncate to first 72 bytes
        </p>
      )}

      <SelectInput
        disabled={hashing}
        name="cost-factor"
        onChange={setRounds}
        options={COST_OPTIONS}
        placeholder="Cost factor"
        value={rounds}
      />

      <Button disabled={hashing} onClick={handleHash} variant="primary">
        {hashing ? 'Hashing...' : 'Hash Password'}
      </Button>

      {hashing && (
        <p className="text-body-xs text-gray-400" role="status">
          Hashing... {elapsedDisplay.toFixed(1)}s
        </p>
      )}

      <div aria-live="polite" className="flex flex-col gap-3">
        {result && !hashing && (
          <>
            <div className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950 px-3 py-2">
              <span className="min-w-0 font-mono text-body-xs break-all text-gray-200">{result.hash}</span>
              <CopyButton label="hash" value={result.hash} />
            </div>

            {hashBreakdown && (
              <div className="flex flex-wrap gap-3 text-body-xs text-gray-400">
                <span>
                  Version: <span className="font-mono text-gray-300">${hashBreakdown.version}$</span>
                </span>
                <span>
                  Rounds: <span className="font-mono text-gray-300">{hashBreakdown.rounds}</span>
                </span>
                <span>
                  Salt: <span className="font-mono text-gray-300">{hashBreakdown.salt}</span>
                </span>
              </div>
            )}

            <p className="text-body-xs text-gray-500">Generated in {(result.elapsed / 1000).toFixed(2)}s</p>
          </>
        )}
      </div>
    </div>
  )
}

const VerifyTab = ({ onProcessingChange }: { onProcessingChange: (v: boolean) => void }) => {
  const [password, setPassword] = useState('')
  const [hashInput, setHashInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<BcryptVerifyResult | null>(null)
  const [elapsedDisplay, setElapsedDisplay] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const { toast } = useToast()

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  const handlePasswordChange = useCallback((val: string) => {
    setPassword(val)
    setResult(null)
  }, [])

  const handleHashChange = useCallback((val: string) => {
    setHashInput(val)
    setResult(null)
  }, [])

  const handleVerify = useCallback(async () => {
    if (!isValidBcryptHash(hashInput.trim())) {
      toast({
        action: 'add',
        item: { label: INVALID_HASH_MESSAGE, type: 'error' },
      })
      return
    }

    setVerifying(true)
    onProcessingChange(true)
    setResult(null)
    startTimeRef.current = performance.now()
    setElapsedDisplay(0)

    timerRef.current = setInterval(() => {
      setElapsedDisplay((performance.now() - startTimeRef.current) / 1000)
    }, 100)

    try {
      const verifyResult = await verifyPassword(password, hashInput.trim())
      setResult(verifyResult)
    } catch {
      toast({
        action: 'add',
        item: { label: 'Verification failed. Please check inputs.', type: 'error' },
      })
    } finally {
      clearTimer()
      setVerifying(false)
      onProcessingChange(false)
    }
  }, [password, hashInput, clearTimer, toast, onProcessingChange])

  return (
    <div className="flex w-full flex-col gap-4">
      <TextInput
        disabled={verifying}
        name="verify-password"
        onChange={handlePasswordChange}
        onEnter={verifying ? undefined : handleVerify}
        placeholder="Enter password..."
        type="text"
        value={password}
      />

      <div className="[&_textarea]:font-mono">
        <TextAreaInput
          disabled={verifying}
          name="verify-hash"
          onChange={handleHashChange}
          placeholder="Enter bcrypt hash ($2b$...)"
          rows={2}
          value={hashInput}
        />
      </div>

      <Button disabled={verifying} onClick={handleVerify} variant="primary">
        {verifying ? 'Verifying...' : 'Verify Password'}
      </Button>

      {verifying && (
        <p className="text-body-xs text-gray-400" role="status">
          Verifying... {elapsedDisplay.toFixed(1)}s
        </p>
      )}

      <div aria-live="polite" className="flex flex-col gap-3">
        {result && !verifying && (
          <>
            {result.match ? (
              <div className="border-green-800 bg-green-950 text-green-400 inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-body-xs font-medium">
                <span aria-hidden="true">✅</span>
                <span>Password matches hash</span>
              </div>
            ) : (
              <div className="border-red-800 bg-red-950 text-red-400 inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-body-xs font-medium">
                <span aria-hidden="true">❌</span>
                <span>Password does not match</span>
              </div>
            )}

            <p className="text-body-xs text-gray-500">Verified in {(result.elapsed / 1000).toFixed(2)}s</p>
          </>
        )}
      </div>
    </div>
  )
}

export const BcryptHasher = (_props: ToolComponentProps) => {
  const [processing, setProcessing] = useState(false)

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <Tabs
        items={[
          {
            content: <HashTab onProcessingChange={setProcessing} />,
            trigger: (
              <button className="disabled:pointer-events-none disabled:opacity-50" disabled={processing}>
                Hash
              </button>
            ),
            value: 'hash',
          },
          {
            content: <VerifyTab onProcessingChange={setProcessing} />,
            trigger: (
              <button className="disabled:pointer-events-none disabled:opacity-50" disabled={processing}>
                Verify
              </button>
            ),
            value: 'verify',
          },
        ]}
      />
    </div>
  )
}
