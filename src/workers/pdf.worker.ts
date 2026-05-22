import init, { compile_markdown } from '../../wasm/pkg/pdf/pdf.js'

import type { CompileResultDto } from '@/types/wasm/pdf'

let ready: Promise<unknown> | null = null

function ensureInit(): Promise<unknown> {
  if (!ready) {
    ready = init()
  }
  return ready!
}

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

    self.postMessage({ id, result: dto })
  } catch (err) {
    self.postMessage({
      id,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
