// wasm-bindgen snippet: fetches the CodeMirror bridge bundle once, on demand.
// The URL is the hashed asset dx emits for assets/generated/codemirror-bridge.js.
let loading

export function load_codemirror(url) {
  loading ??= import(url)
  return loading
}
