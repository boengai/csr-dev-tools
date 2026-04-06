import { loadWasm } from './init'

type CsrFormatter = {
  format_css: (input: string, indent: number, useTabs: boolean) => string
  format_html: (input: string, indent: number, useTabs: boolean) => string
  format_js: (input: string, indent: number, useTabs: boolean) => string
  format_sql: (input: string, dialect: string, indent: number) => string
  minify_css: (input: string) => string
  minify_html: (input: string) => string
  minify_js: (input: string) => string
}

// -- CSS --

export async function formatCss(input: string, indent: number | 'tab' = 2): Promise<string> {
  const wasm = await loadWasm<CsrFormatter>('csr-formatter')
  return wasm.format_css(input, indent === 'tab' ? 1 : indent, indent === 'tab')
}

export async function minifyCss(input: string): Promise<string> {
  const wasm = await loadWasm<CsrFormatter>('csr-formatter')
  return wasm.minify_css(input)
}

// -- HTML --

export async function formatHtml(input: string, indent: number | 'tab' = 2): Promise<string> {
  const wasm = await loadWasm<CsrFormatter>('csr-formatter')
  return wasm.format_html(input, indent === 'tab' ? 1 : indent, indent === 'tab')
}

export async function minifyHtml(input: string): Promise<string> {
  const wasm = await loadWasm<CsrFormatter>('csr-formatter')
  return wasm.minify_html(input)
}

// -- JS --

export async function formatJs(input: string, indent: number | 'tab' = 2): Promise<string> {
  const wasm = await loadWasm<CsrFormatter>('csr-formatter')
  return wasm.format_js(input, indent === 'tab' ? 1 : indent, indent === 'tab')
}

export async function minifyJs(input: string): Promise<string> {
  const wasm = await loadWasm<CsrFormatter>('csr-formatter')
  return wasm.minify_js(input)
}

// -- SQL --

export async function formatSql(input: string, dialect = 'sql', indent = 2): Promise<string> {
  const wasm = await loadWasm<CsrFormatter>('csr-formatter')
  return wasm.format_sql(input, dialect, indent)
}
