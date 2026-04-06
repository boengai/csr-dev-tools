const cache = new Map<string, unknown>()

async function initWasmModule(mod: Record<string, unknown>, name: string): Promise<void> {
  if (typeof mod.default !== 'function') return

  // In Node.js (vitest), we need to read the .wasm file from disk
  // because fetch() doesn't support file:// URLs.
  // In the browser, the default init uses fetch() which works fine.
  if (typeof globalThis.process !== 'undefined' && globalThis.process.versions?.node) {
    const { readFile } = await import('node:fs/promises')
    const { fileURLToPath, URL: NodeURL } = await import('node:url')
    const wasmUrl = new NodeURL(`../../wasm/pkg/${name}/${name}_bg.wasm`, import.meta.url)
    const wasmBytes = await readFile(fileURLToPath(wasmUrl))
    await mod.default(wasmBytes)
  } else {
    await mod.default()
  }
}

export async function loadWasm<T>(name: string): Promise<T> {
  if (!cache.has(name)) {
    const mod = await import(`../../wasm/pkg/${name}/${name}.js`)
    await initWasmModule(mod as Record<string, unknown>, name)
    cache.set(name, mod)
  }
  return cache.get(name)! as T
}
