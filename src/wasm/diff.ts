import type { DiffChange } from '@/types'

import { loadWasm } from './init'

type CsrDiff = {
  create_unified_diff: (old_text: string, new_text: string, context: number) => string
  diff_lines: (old_text: string, new_text: string) => Array<DiffChange>
  diff_words: (old_text: string, new_text: string) => Array<DiffChange>
}

export async function diffLines(old: string, new_: string): Promise<Array<DiffChange>> {
  const wasm = await loadWasm<CsrDiff>('diff')
  return wasm.diff_lines(old, new_)
}

export async function diffWords(old: string, new_: string): Promise<Array<DiffChange>> {
  const wasm = await loadWasm<CsrDiff>('diff')
  return wasm.diff_words(old, new_)
}

export async function createUnifiedDiffWasm(old: string, new_: string, context: number): Promise<string> {
  const wasm = await loadWasm<CsrDiff>('diff')
  return wasm.create_unified_diff(old, new_, context)
}
