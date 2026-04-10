import type { ColorFormat } from '@/types'

import { loadWasm } from './init'

type CsrColor = {
  convert_color: (source: string, sourceFormat: string) => Record<ColorFormat, string>
}

export async function convertColor(source: string, sourceFormat: ColorFormat): Promise<Record<ColorFormat, string>> {
  const wasm = await loadWasm<CsrColor>('color')
  return wasm.convert_color(source, sourceFormat) as Record<ColorFormat, string>
}
