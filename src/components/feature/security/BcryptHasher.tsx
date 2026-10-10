import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'

import { Button, CodeInput, CopyButton, SelectInput, Tabs, TextInput } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useAsyncAction, useElapsedTimer, useToast } from '@/hooks'
import type { BcryptTabProps, ToolComponentProps } from '@/types'
import {
  BCRYPT_MAX_COST,
  BCRYPT_SLOW_COST,
  type BcryptHashComponents,
  type BcryptHashResult,
  type BcryptVerifyResult,
  bcryptCostTooHighMessage,
  cancelBcrypt,
  checkPasswordTruncation,
  exceedsMaxBcryptCost,
  hashPassword,
  isValidBcryptHash,
  parseBcryptHash,
  verifyPassword,
} from '@/utils'
import { isWorkerAbortError } from '@/wasm/worker-bridge'

const toolEntry = TOOL_REGISTRY_MAP['bcrypt-hasher']

const MIN_COST = 4

const COST_OPTIONS = Array.from({ length: BCRYPT_MAX_COST - MIN_COST + 1 }, (_, i) => {
  const val = i + MIN_COST
  const labels: Record<number, string> = {
    4: '4 (fast)',
    10: '10 (default)',
    12: '12 (~300ms)',
    14: '14 (~1s)',
    16: '16 (~4s)',
  }
  return { label: labels[val] ?? String(val), value: String(val) }
})

// A user-initiated cancel rejects the pending call; don't toast it as a failure.
const toastUnlessCancelled = (showError: (msg: string) => void, label: string) => (err: unknown) => {
  if (isWorkerAbortError(err, 'cancel')) return
  showError(label)
}

const handleCancel = () => {
  void cancelBcrypt()
}

const usePasswordVisibility = (): { suffix: ReactElement; type: 'password' | 'text' } => {
  const [visible, setVisible] = useState(false)
  return {
    suffix: (
      <button
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="cursor-pointer text-body-xs text-gray-400 transition-colors hover:text-primary"
        onClick={() => setVisible((v) => !v)}
        type="button"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    ),
    type: visible ? 'text' : 'password',
  }
}

const INVALID_HASH_MESSAGE =
  'Invalid bcrypt hash. Expected format: $2a$/$2b$/$2y$ followed by cost and 53 characters (e.g., $2b$10$...)'

const HashTab = ({ onProcessingChange }: BcryptTabProps) => {
  const [password, setPassword] = useState('')
  const [rounds, setRounds] = useState('10')
  const { showError } = useToast()
  const passwordVisibility = usePasswordVisibility()

  const {
    pending: hashing,
    reset,
    result,
    run: handleHash,
  } = useAsyncAction<BcryptHashResult>(() => hashPassword(password, Number(rounds)), {
    onError: toastUnlessCancelled(showError, 'Hashing failed. Please try again.'),
  })
  const elapsedDisplay = useElapsedTimer(hashing)

  useEffect(() => {
    onProcessingChange(hashing)
  }, [hashing, onProcessingChange])

  const truncationWarning = useMemo(() => checkPasswordTruncation(password), [password])
  const hashBreakdown = useMemo<BcryptHashComponents | null>(
    () => (result ? parseBcryptHash(result.hash) : null),
    [result],
  )

  const handlePasswordChange = useCallback(
    (val: string) => {
      setPassword(val)
      reset()
    },
    [reset],
  )

  return (
    <div className="flex w-full flex-col gap-4">
      <TextInput
        aria-label="Password to hash"
        disabled={hashing}
        name="hash-password"
        onChange={handlePasswordChange}
        onEnter={hashing ? undefined : handleHash}
        placeholder="Enter password to hash..."
        suffix={passwordVisibility.suffix}
        type={passwordVisibility.type}
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

      {Number(rounds) > BCRYPT_SLOW_COST && (
        <p className="text-amber-400 text-body-xs">
          Cost {rounds} is slow — each step doubles the hashing time and blocks a CPU core until it finishes.
        </p>
      )}

      <div className="flex gap-2">
        <div className="grow">
          <Button block disabled={hashing} onClick={handleHash} variant="primary">
            {hashing ? 'Hashing...' : 'Hash Password'}
          </Button>
        </div>
        {hashing && (
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
        )}
      </div>

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
                  Version: <span className="font-mono text-gray-300">{hashBreakdown.version}</span>
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

const VerifyTab = ({ onProcessingChange }: BcryptTabProps) => {
  const [password, setPassword] = useState('')
  const [hashInput, setHashInput] = useState('')
  const { showError } = useToast()
  const passwordVisibility = usePasswordVisibility()

  const {
    pending: verifying,
    reset,
    result,
    run,
  } = useAsyncAction<BcryptVerifyResult>(() => verifyPassword(password, hashInput.trim()), {
    onError: toastUnlessCancelled(showError, 'Verification failed. Please check inputs.'),
  })
  const elapsedDisplay = useElapsedTimer(verifying)

  useEffect(() => {
    onProcessingChange(verifying)
  }, [verifying, onProcessingChange])

  const handlePasswordChange = useCallback(
    (val: string) => {
      setPassword(val)
      reset()
    },
    [reset],
  )

  const handleHashChange = useCallback(
    (val: string) => {
      setHashInput(val)
      reset()
    },
    [reset],
  )

  const handleVerify = useCallback(async () => {
    const hash = hashInput.trim()
    if (!isValidBcryptHash(hash)) {
      showError(INVALID_HASH_MESSAGE)
      return
    }
    if (exceedsMaxBcryptCost(hash)) {
      showError(bcryptCostTooHighMessage(parseBcryptHash(hash).rounds))
      return
    }
    await run()
  }, [hashInput, run, showError])

  return (
    <div className="flex w-full flex-col gap-4">
      <TextInput
        aria-label="Password to verify"
        disabled={verifying}
        name="verify-password"
        onChange={handlePasswordChange}
        onEnter={verifying ? undefined : handleVerify}
        placeholder="Enter password..."
        suffix={passwordVisibility.suffix}
        type={passwordVisibility.type}
        value={password}
      />

      <CodeInput
        aria-label="Bcrypt hash to verify"
        disabled={verifying}
        minHeight="60px"
        name="verify-hash"
        onChange={handleHashChange}
        placeholder="Enter bcrypt hash ($2b$...)"
        value={hashInput}
      />

      <div className="flex gap-2">
        <div className="grow">
          <Button block disabled={verifying} onClick={handleVerify} variant="primary">
            {verifying ? 'Verifying...' : 'Verify Password'}
          </Button>
        </div>
        {verifying && (
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
        )}
      </div>

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

const BcryptHasherBody = () => {
  const [processing, setProcessing] = useState(false)

  // Dialog content unmounts on close: terminate the worker so an in-flight
  // high-cost hash doesn't keep a CPU core busy after the user leaves.
  useEffect(() => handleCancel, [])

  return (
    <div className="flex w-full grow flex-col gap-4">
      <Tabs
        items={[
          {
            content: <HashTab onProcessingChange={setProcessing} />,
            // raw button: Radix Tabs trigger — Tabs owns data-state="active" styling, Button would break it
            trigger: (
              <button className="disabled:pointer-events-none disabled:opacity-50" disabled={processing}>
                Hash
              </button>
            ),
            value: 'hash',
          },
          {
            content: <VerifyTab onProcessingChange={setProcessing} />,
            // raw button: Radix Tabs trigger — Tabs owns data-state="active" styling, Button would break it
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

export const BcryptHasher = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => (
  <ToolDialogFrame
    autoOpen={autoOpen}
    description={toolEntry?.description}
    onAfterClose={onAfterDialogClose}
    title="Bcrypt Hasher"
    triggers={[{ label: 'Open' }]}
  >
    <BcryptHasherBody />
  </ToolDialogFrame>
)
