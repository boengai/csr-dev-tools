import type { NumberBaseWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

export async function convertBase(value: string, fromBase: number, toBase: number): Promise<string> {
  const wasm = await loadWasm<NumberBaseWasm>('number-base')
  return wasm.convert_base(value, fromBase, toBase)
}

export async function isValidForBase(value: string, base: number): Promise<boolean> {
  const wasm = await loadWasm<NumberBaseWasm>('number-base')
  return wasm.is_valid_for_base(value, base)
}
