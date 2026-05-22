/**
 * Structured-clone-friendly shape that crosses the worker boundary
 * (and lands in the tool component). Distinct from the WASM-side
 * `CompileResult` opaque struct, which lives only inside the worker.
 */
export type CompileResultDto = {
  svgs: Array<string>
  pdf: Uint8Array
}
