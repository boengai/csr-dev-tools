import init, { hash_password, verify_password } from '../../wasm/pkg/csr-bcrypt/csr-bcrypt.js'

let ready: Promise<unknown> | null = null

function ensureInit(): Promise<unknown> {
  if (!ready) {
    ready = init()
  }
  return ready!
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, password, rounds, hash } = e.data

  try {
    await ensureInit()

    if (type === 'hash') {
      const result = hash_password(password, rounds)
      self.postMessage({ id, result })
    } else if (type === 'verify') {
      const result = verify_password(password, hash)
      self.postMessage({ id, result })
    }
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) })
  }
}
