// Messages shared by the page and both workers. Research harness for #44,
// not app code.
export type Rgba = { data: ArrayBuffer; height: number; width: number }

export type Request =
  | { cmd: 'segment'; id: number; image: Rgba }
  // Baseline only: transformers.js's own processor output and raw model output.
  | { cmd: 'raw'; id: number; image: Rgba }
  // Candidate only: run tract on a given CHW tensor.
  | { cmd: 'engine'; id: number; tensor: ArrayBuffer; height: number; width: number }

export type Response = {
  id: number
  error?: string
  // segment: the final alpha mask at original size, and timings.
  mask?: ArrayBuffer
  ms?: number
  // Model-resolution intermediates (raw / engine / segment when asked).
  tensor?: ArrayBuffer
  output?: ArrayBuffer
  inputSize?: [number, number]
  wasmMemory?: number
}

/** transformers.js `get_resize_output_image_size` for MODNet's config. */
export const modelInputSize = (width: number, height: number): [number, number] => {
  const f = Math.max(512 / width, 512 / height)
  const fw = Math.floor(Number((width * f).toFixed(2)))
  const fh = Math.floor(Number((height * f).toFixed(2)))
  return [Math.max(Math.floor(fw / 32), 1) * 32, Math.max(Math.floor(fh / 32), 1) * 32]
}
