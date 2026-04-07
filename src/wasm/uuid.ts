import { loadWasm } from './init'

type CsrUuid = {
  uuid_v4: () => string
  uuid_v4_bulk: (count: number) => Array<string>
}

export async function generateUuid(): Promise<string> {
  const wasm = await loadWasm<CsrUuid>('uuid')
  return wasm.uuid_v4()
}

export async function generateBulkUuids(count: number): Promise<Array<string>> {
  const wasm = await loadWasm<CsrUuid>('uuid')
  const clamped = Math.max(1, Math.min(100, Math.floor(count) || 1))
  return wasm.uuid_v4_bulk(clamped)
}
