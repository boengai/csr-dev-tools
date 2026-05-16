import type { SqlFormatDialect } from '@/types/utils/sql-format'

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

export type { SqlFormatDialect }

const isEmpty = (input: string) => input.trim().length === 0
const indentArgs = (indent: number | 'tab') => [indent === 'tab' ? 1 : indent, indent === 'tab'] as const

// -- CSS --

export async function formatCss(input: string, indent: number | 'tab' = 2): Promise<string> {
  if (isEmpty(input)) return ''
  const wasm = await loadWasm<CsrFormatter>('formatter')
  const [n, useTabs] = indentArgs(indent)
  return wasm.format_css(input, n, useTabs)
}

export async function minifyCss(input: string): Promise<string> {
  if (isEmpty(input)) return ''
  const wasm = await loadWasm<CsrFormatter>('formatter')
  return wasm.minify_css(input)
}

// -- HTML --

export async function formatHtml(input: string, indent: number | 'tab' = 2): Promise<string> {
  if (isEmpty(input)) return ''
  const wasm = await loadWasm<CsrFormatter>('formatter')
  const [n, useTabs] = indentArgs(indent)
  return wasm.format_html(input, n, useTabs)
}

export async function minifyHtml(input: string): Promise<string> {
  if (isEmpty(input)) return ''
  const wasm = await loadWasm<CsrFormatter>('formatter')
  return wasm.minify_html(input)
}

// -- JS --

export async function formatJs(input: string, indent: number | 'tab' = 2): Promise<string> {
  if (isEmpty(input)) return ''
  const wasm = await loadWasm<CsrFormatter>('formatter')
  const [n, useTabs] = indentArgs(indent)
  return wasm.format_js(input, n, useTabs)
}

export async function minifyJs(input: string): Promise<string> {
  if (isEmpty(input)) return ''
  const wasm = await loadWasm<CsrFormatter>('formatter')
  return wasm.minify_js(input)
}

// -- SQL --

export async function formatSql(input: string, dialect: SqlFormatDialect = 'sql', indent: number = 2): Promise<string> {
  if (isEmpty(input)) return ''
  const wasm = await loadWasm<CsrFormatter>('formatter')
  return wasm.format_sql(input, dialect, indent)
}
