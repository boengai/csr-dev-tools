// Beyond the bar (reported): tract's wasm memory and ORT's behaviour on
// wider panoramas than the corpus has. Each size gets fresh workers.
import { writeFileSync } from 'node:fs'

import { chromium } from '@playwright/test'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()
page.setDefaultTimeout(600_000)
await page.goto('http://localhost:5199/docs/research/tract-bg-removal-trial/harness/web/index.html')
await page.waitForFunction(() => document.getElementById('status')?.textContent === 'ready')
const out = {}
for (const [w, h] of [
  [4096, 669],
  [6000, 600],
  [8192, 669],
  [12000, 512],
  [16384, 512],
]) {
  const name = `wide-${w}x${h}`
  out[name] = await page.evaluate(
    async ([n, ww, hh]) => {
      const H = window.harness
      H.synthetic(n, ww, hh)
      const r = {}
      for (const k of ['tract', 'baseline']) {
        H.spawn(k)
        r[k] = await H.segment(k, n).catch((e) => ({ error: e.message }))
      }
      try {
        r.mask = H.compareMasks('baseline', 'tract', n).psnrDb
      } catch (e) {
        r.mask = String(e)
      }
      return r
    },
    [name, w, h],
  )
  console.error(name, JSON.stringify(out[name]))
}
writeFileSync(new URL('../runs/memory-probe.json', import.meta.url), JSON.stringify(out, null, 1))
await browser.close()
