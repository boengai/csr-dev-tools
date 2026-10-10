import type { BcryptWorkerRequest } from '@/types/wasm/bcrypt'
import type { BcryptWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'
import { createWorkerBridge } from './worker-bridge'

const bridge = createWorkerBridge<BcryptWorkerRequest>(
  () => new Worker(new URL('../workers/bcrypt.worker.ts', import.meta.url), { type: 'module' }),
)

// Specs run without Web Workers; Vite constant-folds MODE so production
// bundles drop the direct-wasm branches below.
const isTest = import.meta.env.MODE === 'test'

export async function hashPassword(password: string, rounds: number): Promise<string> {
  if (isTest) {
    const wasm = await loadWasm<BcryptWasm>('bcrypt')
    return wasm.hash_password(password, rounds)
  }
  return bridge.call<string>({ type: 'hash', password, rounds })
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isTest) {
    const wasm = await loadWasm<BcryptWasm>('bcrypt')
    return wasm.verify_password(password, hash)
  }
  return bridge.call<boolean>({ type: 'verify', password, hash })
}

/**
 * Terminate the bcrypt worker, rejecting any in-flight hash/verify with a
 * `WorkerAbortError` (`reason: 'cancel'`). bcrypt is one synchronous wasm
 * call, so termination is the only way to stop it.
 */
export function cancelBcrypt(): void {
  bridge.cancel()
}
