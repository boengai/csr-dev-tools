import type { RegexResult, RegexWorkerRequest } from '@/types/utils/regex'
import type { WorkerRequest, WorkerResponse } from '@/types/wasm/worker-bridge'

import { executeRegex } from '../utils/regex'

// Runs user-supplied patterns off the main thread so catastrophic
// backtracking can be killed (worker.terminate) instead of freezing the tab.
self.onmessage = (e: MessageEvent<WorkerRequest<RegexWorkerRequest>>) => {
  const { flags, id, pattern, text } = e.data
  let response: WorkerResponse<RegexResult>
  try {
    response = { id, result: executeRegex(pattern, flags, text) }
  } catch (err) {
    response = { id, error: err instanceof Error ? err.message : String(err) }
  }
  self.postMessage(response)
}
