import type { HashAlgorithm } from "@/types/utils/hash";

export const HASH_ALGORITHMS: Array<HashAlgorithm> = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512']

export const DEFAULT_HASH_ALGORITHM: HashAlgorithm = 'SHA-256'

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function computeHash(text: string, algorithm: HashAlgorithm): Promise<string> {
  if (algorithm === 'MD5') {
    const { md5 } = await import('@/wasm/hash')
    return md5(text)
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  return bufferToHex(hashBuffer)
}

export type { HashAlgorithm } from "@/types/utils/hash";
