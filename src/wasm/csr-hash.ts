import { loadWasm } from './init'

type CsrHash = {
  md5: (input: string) => string
}

export async function md5(input: string): Promise<string> {
  const wasm = await loadWasm<CsrHash>('csr-hash')
  return wasm.md5(input)
}
