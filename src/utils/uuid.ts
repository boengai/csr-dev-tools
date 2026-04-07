export const generateUuid = async (): Promise<string> => {
  const wasm = await import('@/wasm/uuid')
  return wasm.generateUuid()
}

export const generateBulkUuids = async (count: number): Promise<Array<string>> => {
  const wasm = await import('@/wasm/uuid')
  return wasm.generateBulkUuids(count)
}
