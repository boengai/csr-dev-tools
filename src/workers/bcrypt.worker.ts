import init, { hash_password, verify_password } from '../../wasm/pkg/bcrypt/bcrypt.js'
import type { WorkerResponse } from '../wasm/worker-bridge'

let ready: Promise<unknown> | null = null

function ensureInit(): Promise<unknown> {
  if (!ready) {
    ready = init()
  }
  return ready!
}

const post = <T>(response: WorkerResponse<T>): void => self.postMessage(response)

self.onmessage = async (e: MessageEvent) => {
  const { id, type, password, rounds, hash } = e.data

  try {
    await ensureInit()

    if (type === 'hash') {
      const result = hash_password(password, rounds)
      post<string>({ id, result })
    } else if (type === 'verify') {
      const result = verify_password(password, hash)
      post<boolean>({ id, result })
    }
  } catch (err) {
    post({ id, error: err instanceof Error ? err.message : String(err) })
  }
}
