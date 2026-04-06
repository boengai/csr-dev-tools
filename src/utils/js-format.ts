import { formatJs as wasmFormatJs, minifyJs as wasmMinifyJs } from '@/wasm/csr-formatter'

export const formatJs = async (js: string, indent: number | 'tab' = 2): Promise<string> => {
  if (js.trim().length === 0) return ''
  return wasmFormatJs(js, indent)
}

export const minifyJs = async (js: string): Promise<string> => {
  if (js.trim().length === 0) return ''
  return wasmMinifyJs(js)
}
