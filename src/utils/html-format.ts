import { formatHtml as wasmFormatHtml, minifyHtml as wasmMinifyHtml } from '@/wasm/formatter'

export const formatHtml = async (html: string, indent: number | 'tab' = 2): Promise<string> => {
  if (html.trim().length === 0) return ''
  return wasmFormatHtml(html, indent)
}

export const minifyHtml = async (html: string): Promise<string> => {
  if (html.trim().length === 0) return ''
  return wasmMinifyHtml(html)
}
