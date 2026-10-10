import type { ColorFormat } from '@/types'
import type { ColorWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

export async function convertColor(source: string, sourceFormat: ColorFormat): Promise<Record<ColorFormat, string>> {
  const wasm = await loadWasm<ColorWasm>('color')
  return wasm.convert_color(source, sourceFormat) as Record<ColorFormat, string>
}
