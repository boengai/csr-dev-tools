// Caches the in-flight promise (not the resolved module) so concurrent first
// calls share one instantiation. A rejected load is evicted so the next call
// retries instead of replaying the failure forever.
const cache = new Map<string, Promise<unknown>>()

async function initWasmModule(mod: Record<string, unknown>, name: string): Promise<void> {
  if (typeof mod.default !== 'function') return

  // Vitest runs in Node, where the default init's fetch() can't load file://
  // URLs, so read the .wasm from disk. `import.meta.env.MODE` is constant-folded
  // by Vite, so production bundles drop this branch (and its node:* imports).
  if (import.meta.env.MODE === 'test') {
    const { readFile } = await import('node:fs/promises')
    const { fileURLToPath, URL: NodeURL } = await import('node:url')
    const wasmUrl = new NodeURL(`../../wasm/pkg/${name}/${name}_bg.wasm`, import.meta.url)
    const wasmBytes = await readFile(fileURLToPath(wasmUrl))
    await mod.default({ module_or_path: wasmBytes })
  } else {
    await mod.default()
  }
}

async function instantiate(name: string): Promise<unknown> {
  const mod = await import(`../../wasm/pkg/${name}/${name}.js`)
  await initWasmModule(mod as Record<string, unknown>, name)
  return mod
}

/**
 * Load + initialise a wasm-pack `--target web` module once per name. Pass the
 * generated module type for checked FFI signatures, e.g.
 * `loadWasm<typeof import('../../wasm/pkg/csv/csv.js')>('csv')`.
 */
export function loadWasm<T>(name: string): Promise<T> {
  let entry = cache.get(name)
  if (!entry) {
    entry = instantiate(name)
    cache.set(name, entry)
    entry.catch(() => {
      if (cache.get(name) === entry) cache.delete(name)
    })
  }
  return entry as Promise<T>
}
