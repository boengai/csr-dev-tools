import type { BgRemovalResult, BgRemovalWorkerRequest } from '@/types/utils/background-removal'
import type { WorkerRequest, WorkerResponse } from '@/types/wasm/worker-bridge'

import { segmentImage } from './background-removal.segment'

const post = (response: WorkerResponse<BgRemovalResult>, transfer: Array<Transferable> = []): void =>
  self.postMessage(response, { transfer })

self.onmessage = async (e: MessageEvent<WorkerRequest<BgRemovalWorkerRequest>>) => {
  const { bytes, id, type } = e.data
  try {
    const result = await segmentImage(bytes, type, (progress) => post({ id, progress }))
    post({ id, result }, [result.rgba])
  } catch (err) {
    post({ id, error: err instanceof Error ? err.message : String(err) })
  }
}
