import init, { compile_markdown } from '../../wasm/pkg/pdf/pdf.js'

import type { CompileResultDto } from '@/types/wasm/pdf'

import type { WorkerResponse } from '../wasm/worker-bridge'

let ready: Promise<unknown> | null = null

function ensureInit(): Promise<unknown> {
  if (!ready) {
    ready = init()
  }
  return ready!
}

const post = <T>(response: WorkerResponse<T>): void => self.postMessage(response)

self.onmessage = async (e: MessageEvent) => {
  const { id, md } = e.data as { id: number; md: string }

  try {
    await ensureInit()
    const result = compile_markdown(md)

    const svgs: Array<string> = []
    const count = result.page_count
    for (let i = 0; i < count; i++) {
      const svg = result.page_svg(i)
      if (svg !== undefined) svgs.push(svg)
    }
    const dto: CompileResultDto = { svgs, pdf: result.pdf }

    post<CompileResultDto>({ id, result: dto })
  } catch (err) {
    post({ id, error: err instanceof Error ? err.message : String(err) })
  }
}
