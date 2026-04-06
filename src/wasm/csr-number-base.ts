import { loadWasm } from './init'

type CsrNumberBase = {
  convert_base: (value: string, fromBase: number, toBase: number) => string
  is_valid_for_base: (value: string, base: number) => boolean
}

export async function convertBase(value: string, fromBase: number, toBase: number): Promise<string> {
  const wasm = await loadWasm<CsrNumberBase>('csr-number-base')
  return wasm.convert_base(value, fromBase, toBase)
}

export async function isValidForBase(value: string, base: number): Promise<boolean> {
  const wasm = await loadWasm<CsrNumberBase>('csr-number-base')
  return wasm.is_valid_for_base(value, base)
}
