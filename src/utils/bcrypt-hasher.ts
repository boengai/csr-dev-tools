import type { BcryptHashComponents, BcryptHashResult, BcryptVerifyResult } from '@/types/utils/bcrypt-hasher'

export const hashPassword = async (
  password: string,
  rounds: number,
): Promise<BcryptHashResult> => {
  const { hashPassword: wasmHash } = await import('@/wasm/bcrypt')
  const start = performance.now()
  const hash = await wasmHash(password, rounds)

  return {
    elapsed: performance.now() - start,
    hash,
    rounds,
  }
}

export const verifyPassword = async (password: string, hash: string): Promise<BcryptVerifyResult> => {
  const { verifyPassword: wasmVerify } = await import('@/wasm/bcrypt')
  const start = performance.now()
  const match = await wasmVerify(password, hash)

  return {
    elapsed: performance.now() - start,
    match,
  }
}

const BCRYPT_HASH_REGEX = /^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$.{53}$/

export const isValidBcryptHash = (input: string): boolean => {
  return BCRYPT_HASH_REGEX.test(input) && input.length === 60
}

export const parseBcryptHash = (hash: string): BcryptHashComponents => {
  const version = hash.slice(1, 3)
  const rounds = parseInt(hash.slice(4, 6), 10)
  const salt = hash.slice(7, 29)

  return { rounds, salt, version }
}

export const checkPasswordTruncation = (password: string): boolean => {
  return new TextEncoder().encode(password).length > 72
}

export type { BcryptHashComponents, BcryptHashResult, BcryptVerifyResult } from '@/types/utils/bcrypt-hasher'
