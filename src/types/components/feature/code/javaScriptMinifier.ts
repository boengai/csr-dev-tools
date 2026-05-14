export type JsMinifierState = {
  indent: number | 'tab'
  mode: 'beautify' | 'minify'
  source: string
}

export type JsMinifierAction =
  | { type: 'SET_INDENT'; payload: number | 'tab' }
  | { type: 'SET_MODE'; payload: 'beautify' | 'minify' }
  | { type: 'SET_SOURCE'; payload: string }
  | { type: 'RESET' }

export type JsInput = { indent: number | 'tab'; mode: 'beautify' | 'minify'; source: string }
