export const convertBase = async (value: string, fromBase: number, toBase: number): Promise<string> => {
  const wasm = await import('@/wasm/csr-number-base')
  return wasm.convertBase(value, fromBase, toBase)
}

export const isValidForBase = async (value: string, base: number): Promise<boolean> => {
  const wasm = await import('@/wasm/csr-number-base')
  return wasm.isValidForBase(value, base)
}
