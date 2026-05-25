import { loadWasm } from './init'
import { createWorkerBridge } from './worker-bridge'

type CsrBcrypt = {
  hash_password: (password: string, rounds: number) => string
  verify_password: (password: string, hash: string) => boolean
}

type BcryptRequest =
  | { type: 'hash'; password: string; rounds: number }
  | { type: 'verify'; password: string; hash: string }

const bridge = createWorkerBridge<BcryptRequest>(
  () => new Worker(new URL('../workers/bcrypt.worker.ts', import.meta.url), { type: 'module' }),
)

const isNode = typeof globalThis.process !== 'undefined' && globalThis.process.versions?.node

export async function hashPassword(password: string, rounds: number): Promise<string> {
  if (isNode) {
    const wasm = await loadWasm<CsrBcrypt>('bcrypt')
    return wasm.hash_password(password, rounds)
  }
  return bridge.call<string>({ type: 'hash', password, rounds })
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isNode) {
    const wasm = await loadWasm<CsrBcrypt>('bcrypt')
    return wasm.verify_password(password, hash)
  }
  return bridge.call<boolean>({ type: 'verify', password, hash })
}
