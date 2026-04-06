const cache = new Map<string, unknown>()

export async function loadWasm<T>(name: string): Promise<T> {
  if (!cache.has(name)) {
    const mod = await import(`../../wasm/pkg/${name}/${name}.js`)
    cache.set(name, mod)
  }
  return cache.get(name)! as T
}
