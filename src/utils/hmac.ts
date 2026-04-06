import type { HmacAlgorithm, HmacEncoding } from '@/types/utils/hmac'

export const HMAC_ALGORITHMS: Array<HmacAlgorithm> = ['SHA-256', 'SHA-384', 'SHA-512']

export const DEFAULT_HMAC_ALGORITHM: HmacAlgorithm = 'SHA-256'

export const DEFAULT_HMAC_ENCODING: HmacEncoding = 'hex'

export async function generateHmac(
  message: string,
  key: string,
  algorithm: HmacAlgorithm,
  encoding: HmacEncoding,
): Promise<string> {
  const { generateHmac: wasmHmac } = await import('@/wasm/csr-hmac')
  return wasmHmac(message, key, algorithm, encoding)
}

export type { HmacAlgorithm, HmacEncoding } from '@/types/utils/hmac'
