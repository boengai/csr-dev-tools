import type { RegexResult, RegexWorkerRequest } from '@/types/utils/regex'

import { createWorkerBridge, isWorkerAbortError } from '../wasm/worker-bridge'
import { executeRegex } from './regex'

export const REGEX_TIMEOUT_MS = 2000
export const REGEX_TIMEOUT_MESSAGE = 'Pattern timed out (possible catastrophic backtracking)'

const bridge = createWorkerBridge<RegexWorkerRequest>(
  () => new Worker(new URL('../workers/regex.worker.ts', import.meta.url), { type: 'module' }),
)

/**
 * Run a user regex in a Web Worker with a hard timeout. A pattern like
 * `(a+)+$` can backtrack for minutes; on timeout the worker is terminated and
 * this rejects with `REGEX_TIMEOUT_MESSAGE`. Latest call wins: a still-running
 * previous call is cancelled first so a fresh pattern never queues behind a
 * runaway one. Falls back to synchronous execution where `Worker` is
 * unavailable (node specs).
 */
export async function runRegex(pattern: string, flags: string, text: string): Promise<RegexResult> {
  if (typeof Worker === 'undefined') return executeRegex(pattern, flags, text)

  if (bridge.hasPending()) bridge.cancel()
  try {
    return await bridge.call<RegexResult>({ flags, pattern, text }, { timeoutMs: REGEX_TIMEOUT_MS })
  } catch (err) {
    if (isWorkerAbortError(err, 'timeout')) throw new Error(REGEX_TIMEOUT_MESSAGE)
    throw err
  }
}

/** Terminate the regex worker (e.g. when the tool unmounts). Next call recreates it. */
export function cancelRegex(): void {
  bridge.cancel()
}
