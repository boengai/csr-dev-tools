import { formatCss as wasmFormatCss, minifyCss as wasmMinifyCss } from '@/wasm/formatter'

export const formatCss = async (css: string, indent: number | 'tab' = 2): Promise<string> => {
  if (css.trim().length === 0) return ''
  return wasmFormatCss(css, indent)
}

export const minifyCss = async (css: string): Promise<string> => {
  if (css.trim().length === 0) return ''
  return wasmMinifyCss(css)
}
