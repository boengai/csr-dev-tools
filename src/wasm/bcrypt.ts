import { loadWasm } from './init'

type CsrBcrypt = {
  hash_password: (password: string, rounds: number) => string
  verify_password: (password: string, hash: string) => boolean
}

let worker: Worker | null = null
let msgId = 0

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/bcrypt.worker.ts', import.meta.url), { type: 'module' })
  }
  return worker
}

function callWorker<T>(data: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = ++msgId
    const w = getWorker()

    const handler = (e: MessageEvent) => {
      if (e.data.id !== id) return
      w.removeEventListener('message', handler)
      if (e.data.error) {
        reject(new Error(e.data.error))
      } else {
        resolve(e.data.result as T)
      }
    }

    w.addEventListener('message', handler)
    w.postMessage({ ...data, id })
  })
}

const isNode = typeof globalThis.process !== 'undefined' && globalThis.process.versions?.node

export async function hashPassword(password: string, rounds: number): Promise<string> {
  if (isNode) {
    const wasm = await loadWasm<CsrBcrypt>('bcrypt')
    return wasm.hash_password(password, rounds)
  }
  return callWorker<string>({ type: 'hash', password, rounds })
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isNode) {
    const wasm = await loadWasm<CsrBcrypt>('bcrypt')
    return wasm.verify_password(password, hash)
  }
  return callWorker<boolean>({ type: 'verify', password, hash })
}
