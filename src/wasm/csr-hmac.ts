import type { HmacAlgorithm, HmacEncoding } from '@/types/utils/hmac'

import { loadWasm } from './init'

type CsrHmac = {
  hmac_sha256: (key: string, message: string) => string
  hmac_sha384: (key: string, message: string) => string
  hmac_sha512: (key: string, message: string) => string
  hmac_sha256_base64: (key: string, message: string) => string
  hmac_sha384_base64: (key: string, message: string) => string
  hmac_sha512_base64: (key: string, message: string) => string
}

type HmacFnKey = `hmac_sha${256 | 384 | 512}` | `hmac_sha${256 | 384 | 512}_base64`

const ALGORITHM_MAP: Record<HmacAlgorithm, string> = {
  'SHA-256': 'sha256',
  'SHA-384': 'sha384',
  'SHA-512': 'sha512',
}

export async function generateHmac(
  message: string,
  key: string,
  algorithm: HmacAlgorithm,
  encoding: HmacEncoding,
): Promise<string> {
  const wasm = await loadWasm<CsrHmac>('csr-hmac')
  const suffix = encoding === 'base64' ? '_base64' : ''
  const fnName = `hmac_${ALGORITHM_MAP[algorithm]}${suffix}` as HmacFnKey
  return (wasm[fnName] as (key: string, message: string) => string)(key, message)
}
