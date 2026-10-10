import type { DiffChange } from '@/types'
import type { DiffWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

export async function diffLines(old: string, new_: string): Promise<Array<DiffChange>> {
  const wasm = await loadWasm<DiffWasm>('diff')
  return wasm.diff_lines(old, new_) as Array<DiffChange>
}

export async function diffWords(old: string, new_: string): Promise<Array<DiffChange>> {
  const wasm = await loadWasm<DiffWasm>('diff')
  return wasm.diff_words(old, new_) as Array<DiffChange>
}

export async function createUnifiedDiffWasm(old: string, new_: string, context: number): Promise<string> {
  const wasm = await loadWasm<DiffWasm>('diff')
  return wasm.create_unified_diff(old, new_, context)
}
