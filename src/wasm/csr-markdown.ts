import { loadWasm } from './init'

type CsrMarkdown = {
  markdown_to_html: (md: string) => string
  html_to_markdown: (html: string) => string
}

export const renderMarkdown = async (md: string): Promise<string> => {
  if (md.trim().length === 0) return ''
  const wasm = await loadWasm<CsrMarkdown>('csr-markdown')
  return wasm.markdown_to_html(md)
}

export const markdownToHtml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const wasm = await loadWasm<CsrMarkdown>('csr-markdown')
  return wasm.markdown_to_html(input)
}

export const htmlToMarkdown = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const wasm = await loadWasm<CsrMarkdown>('csr-markdown')
  return wasm.html_to_markdown(input)
}
