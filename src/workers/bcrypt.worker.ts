import type { BcryptWorkerRequest } from '@/types/wasm/bcrypt'
import type { WorkerRequest, WorkerResponse } from '@/types/wasm/worker-bridge'

import init, { hash_password, verify_password } from '../../wasm/pkg/bcrypt/bcrypt.js'
import { retryableOnce } from './retryable-once'

const ensureInit = retryableOnce(() => init())

const post = <T>(response: WorkerResponse<T>): void => self.postMessage(response)

self.onmessage = async (e: MessageEvent<WorkerRequest<BcryptWorkerRequest>>) => {
  const req = e.data

  try {
    await ensureInit()

    if (req.type === 'hash') {
      post<string>({ id: req.id, result: hash_password(req.password, req.rounds) })
    } else {
      post<boolean>({ id: req.id, result: verify_password(req.password, req.hash) })
    }
  } catch (err) {
    post({ id: req.id, error: err instanceof Error ? err.message : String(err) })
  }
}
