import type { HmacAlgorithm, HmacEncoding } from '@/types/utils/hmac'
import type { HmacWasm } from '@/types/wasm/ffi'
import type { HmacFnKey } from '@/types/wasm/hmac'

import { loadWasm } from './init'

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
  const wasm = await loadWasm<HmacWasm>('hmac')
  const suffix = encoding === 'base64' ? '_base64' : ''
  const fnName = `hmac_${ALGORITHM_MAP[algorithm]}${suffix}` as HmacFnKey
  return (wasm[fnName] as (key: string, message: string) => string)(key, message)
}
