import type { BcryptHashComponents, BcryptHashResult, BcryptVerifyResult } from '@/types/utils/bcrypt-hasher'

/**
 * Highest cost this tool will run. Each +1 doubles the work: cost 16 is ~4s,
 * 31 (bcrypt's spec max) would take hours and pin a CPU core.
 */
export const BCRYPT_MAX_COST = 16
/** Costs above this get a "this will be slow" warning in the UI. */
export const BCRYPT_SLOW_COST = 12

export const bcryptCostTooHighMessage = (cost: number) =>
  `Cost ${cost} is too slow to run in the browser. Maximum supported cost is ${BCRYPT_MAX_COST}.`

export const hashPassword = async (password: string, rounds: number): Promise<BcryptHashResult> => {
  if (rounds > BCRYPT_MAX_COST) throw new Error(bcryptCostTooHighMessage(rounds))
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
  if (exceedsMaxBcryptCost(hash)) throw new Error(bcryptCostTooHighMessage(parseBcryptHash(hash).rounds))
  const { verifyPassword: wasmVerify } = await import('@/wasm/bcrypt')
  const start = performance.now()
  const match = await wasmVerify(password, hash)

  return {
    elapsed: performance.now() - start,
    match,
  }
}

/**
 * Abort an in-flight hash/verify by terminating the bcrypt worker. The pending
 * promise rejects with a `WorkerAbortError` (`reason: 'cancel'`).
 */
export const cancelBcrypt = async (): Promise<void> => {
  const { cancelBcrypt: wasmCancel } = await import('@/wasm/bcrypt')
  wasmCancel()
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

/** True when a (valid) bcrypt hash's embedded cost is above `BCRYPT_MAX_COST`. */
export const exceedsMaxBcryptCost = (hash: string): boolean => parseBcryptHash(hash).rounds > BCRYPT_MAX_COST

export const checkPasswordTruncation = (password: string): boolean => {
  return new TextEncoder().encode(password).length > 72
}

export type { BcryptHashComponents, BcryptHashResult, BcryptVerifyResult } from '@/types/utils/bcrypt-hasher'
