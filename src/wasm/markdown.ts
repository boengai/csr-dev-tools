import type { MarkdownWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

export const renderMarkdown = async (md: string): Promise<string> => {
  if (md.trim().length === 0) return ''
  const wasm = await loadWasm<MarkdownWasm>('markdown')
  return wasm.markdown_to_html(md)
}

export const markdownToHtml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const wasm = await loadWasm<MarkdownWasm>('markdown')
  return wasm.markdown_to_html(input)
}

export const htmlToMarkdown = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const wasm = await loadWasm<MarkdownWasm>('markdown')
  return wasm.html_to_markdown(input)
}
