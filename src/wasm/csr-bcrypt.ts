import { loadWasm } from './init'

type CsrBcrypt = {
  hash_password: (password: string, rounds: number) => string
  verify_password: (password: string, hash: string) => boolean
}

export async function hashPassword(password: string, rounds: number): Promise<string> {
  const wasm = await loadWasm<CsrBcrypt>('csr-bcrypt')
  return wasm.hash_password(password, rounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const wasm = await loadWasm<CsrBcrypt>('csr-bcrypt')
  return wasm.verify_password(password, hash)
}
