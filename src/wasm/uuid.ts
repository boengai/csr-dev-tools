import type { UuidWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

export async function generateUuid(): Promise<string> {
  const wasm = await loadWasm<UuidWasm>('uuid')
  return wasm.uuid_v4()
}

export async function generateBulkUuids(count: number): Promise<Array<string>> {
  const wasm = await loadWasm<UuidWasm>('uuid')
  const clamped = Math.max(1, Math.min(100, Math.floor(count) || 1))
  return wasm.uuid_v4_bulk(clamped)
}
