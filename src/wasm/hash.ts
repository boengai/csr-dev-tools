import type { HashWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

export async function md5(input: string): Promise<string> {
  const wasm = await loadWasm<HashWasm>('hash')
  return wasm.md5(input)
}
