// Judged run for #44. Usage, from the repo root with `pnpm exec vite --port
// 5199 --strictPort` running:
//   node docs/research/tract-bg-removal-trial/harness/run-browser.mjs floor
//   node docs/research/tract-bg-removal-trial/harness/run-browser.mjs chrome
// `floor` saves transformers.js masks from a second browser engine (the
// noise floor). The bar named Firefox; neither Playwright's Firefox nor
// Firefox.app would launch on the trial machine, so WebKit stands in. `chrome` (GPU
// Chrome, `channel: 'chrome'`, persistent profile so the model is cached)
// runs every check and writes runs/chrome.json.
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { chromium, webkit } from '@playwright/test'

const HERE = new URL('.', import.meta.url).pathname
const RUNS = join(HERE, '..', 'runs')
const OUT = join(HERE, 'out')
const URL_ = 'http://localhost:5199/docs/research/tract-bg-removal-trial/harness/web/index.html'
const CORPUS = readFileSync(join(HERE, 'corpus.tsv'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => l.split('\t')[0])
const ROUNDS = 5
const RUNS_PER = 3 // 3 runs × 5 rounds = 15 samples, per docs/perf/budgets.md
const mode = process.argv[2]

const median = (a) => {
  const s = [...a].sort((x, y) => x - y)
  return s[s.length >> 1]
}
const sh = (c) => {
  try {
    return execSync(c, { encoding: 'utf8' }).trim()
  } catch (e) {
    return String(e)
  }
}
const log = (...a) => console.error(new Date().toISOString().slice(11, 19), ...a)

async function open(browserType, opts) {
  const profile = join(process.env.PROFILE_DIR ?? tmpdir(), `tract-trial-${mode}`)
  mkdirSync(profile, { recursive: true })
  // Chrome keeps a profile so the model stays cached between runs; the
  // floor browser (masks only) gets a plain context.
  const ctx =
    browserType === webkit
      ? await (await webkit.launch({ headless: true })).newContext()
      : await browserType.launchPersistentContext(profile, { headless: true, ...opts })
  const page = ctx.pages()[0] ?? (await ctx.newPage())
  page.on('pageerror', (e) => log('[pageerror]', e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') log('[console]', m.text())
  })
  await page.goto(URL_)
  await page.waitForFunction(() => document.getElementById('status')?.textContent === 'ready', null, {
    timeout: 60_000,
  })
  page.setDefaultTimeout(600_000)
  return { ctx, page }
}

const ev = (page, fn, ...args) => page.evaluate(fn, args)

async function saveMask(page, tag, name) {
  const b64 = await ev(page, ([t, n]) => window.harness.maskPng(t, n), tag, name)
  mkdirSync(join(OUT, tag), { recursive: true })
  writeFileSync(join(OUT, tag, `${name}.png`), Buffer.from(b64, 'base64'))
}

if (mode === 'floor') {
  const { ctx, page } = await open(webkit, {})
  await ev(page, () => window.harness.spawn('baseline'))
  for (const name of CORPUS) {
    log('floor baseline', name)
    await ev(page, ([n]) => window.harness.segment('baseline', n, 'floor-baseline'), name)
    await saveMask(page, 'floor-baseline', name)
  }
  await ctx.close()
  process.exit(0)
}

if (mode !== 'chrome') throw new Error('mode: floor | chrome')

const result = {
  env: { before: { batt: sh('pmset -g batt'), uptime: sh('uptime') }, chrome: null, date: new Date().toISOString() },
}
// docs/perf/budgets.md: AC power throughout. Refuse to start on battery; a
// change by the end is flagged as void (also check `pmset -g log`).
const onAc = (b) => b.includes("'AC Power'")
if (!onAc(result.env.before.batt)) throw new Error('not on AC power')
const { ctx, page } = await open(chromium, { channel: 'chrome' })
result.env.chrome =
  ctx.browser()?.version() ?? sh("'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --version")

// Warm the caches (model in Cache Storage, ORT and tract wasm in HTTP cache).
log('warm')
await ev(page, () => window.harness.cold('baseline', '1-portrait.jpg'))
await ev(page, () => window.harness.cold('tract', '1-portrait.jpg'))

// 1. Fidelity: one warm run each, then compare.
result.fidelity = {}
for (const name of CORPUS) {
  log('fidelity', name)
  const size = await ev(page, ([n]) => window.harness.decode(n), name)
  const b = await ev(page, ([n]) => window.harness.segment('baseline', n), name)
  const t = await ev(page, ([n]) => window.harness.segment('tract', n), name)
  const mask = await ev(page, ([n]) => window.harness.compareMasks('baseline', 'tract', n), name)
  const raw = await ev(page, ([n]) => window.harness.rawCompare(n), name)
  await saveMask(page, 'baseline', name)
  await saveMask(page, 'tract', name)
  let floor = null
  try {
    const ff = readFileSync(join(OUT, 'floor-baseline', `${name}.png`)).toString('base64')
    await ev(page, ([n, s]) => window.harness.loadMaskPng('floor-baseline', n, s), name, ff)
    floor = await ev(page, ([n]) => window.harness.compareMasks('baseline', 'floor-baseline', n), name)
  } catch (e) {
    floor = { error: String(e) }
  }
  result.fidelity[name] = { floor, inputSize: t.inputSize, mask, raw, size, wasmMemoryHighWater: t.wasmMemory }
}

// 2. Cold start: worker spawn → first mask, model cached. Alternating.
log('cold')
result.cold = { baseline: [], tract: [] }
for (let run = 0; run < RUNS_PER; run++) {
  for (let r = 0; r < ROUNDS; r++) {
    const order = (run * ROUNDS + r) % 2 ? ['tract', 'baseline'] : ['baseline', 'tract']
    for (const k of order)
      result.cold[k].push((await ev(page, ([kk]) => window.harness.cold(kk, '1-portrait.jpg'), k)).ms)
  }
}

// 3. Latency: warm segment per image, alternating, 15 samples each.
log('latency')
await ev(page, () => {
  window.harness.spawn('baseline')
  window.harness.spawn('tract')
})
for (const name of CORPUS) {
  await ev(page, ([n]) => window.harness.segment('baseline', n), name)
  await ev(page, ([n]) => window.harness.segment('tract', n), name)
}
result.latency = Object.fromEntries(CORPUS.map((n) => [n, { baseline: [], tract: [], tractMemoryHighWater: 0 }]))
for (let run = 0; run < RUNS_PER; run++) {
  log('latency run', run)
  for (let r = 0; r < ROUNDS; r++) {
    for (const name of CORPUS) {
      const order = (run * ROUNDS + r) % 2 ? ['tract', 'baseline'] : ['baseline', 'tract']
      for (const k of order) {
        const res = await ev(page, ([kk, n]) => window.harness.segment(kk, n), k, name)
        result.latency[name][k].push(res.ms)
        // One worker serves every image and wasm memory never shrinks, so this
        // is the worker's high-water mark so far, not this image's own use.
        if (k === 'tract')
          result.latency[name].tractMemoryHighWater = Math.max(
            result.latency[name].tractMemoryHighWater,
            res.wasmMemory,
          )
      }
    }
  }
}

// 4. Failure inputs: 1×1 and 8000×8000, each engine on a fresh worker.
log('failure inputs')
result.failures = {}
for (const [name, w, h] of [
  ['synthetic-1x1', 1, 1],
  ['synthetic-8000x8000', 8000, 8000],
]) {
  await ev(page, ([n, ww, hh]) => window.harness.synthetic(n, ww, hh), name, w, h)
  result.failures[name] = {}
  for (const k of ['baseline', 'tract']) {
    await ev(page, ([kk]) => window.harness.spawn(kk), k)
    result.failures[name][k] = await ev(
      page,
      ([kk, n]) => window.harness.segment(kk, n).catch((e) => ({ error: e.message })),
      k,
      name,
    )
  }
  try {
    result.failures[name].mask = await ev(page, ([n]) => window.harness.compareMasks('baseline', 'tract', n), name)
  } catch (e) {
    result.failures[name].mask = { error: String(e) }
  }
}

// 5. Reported only: the quantized 2×2 (tract q8, ORT q8) on the portrait.
log('q8')
result.q8 = {}
result.q8.tract = await ev(page, () =>
  window.harness
    .cold('tract', '1-portrait.jpg', { model: 'model_quantized.onnx' })
    .catch((e) => ({ error: e.message })),
)
await ev(page, () => window.harness.cold('baseline', '1-portrait.jpg', { dtype: 'q8' }))
result.q8.ort = { ms: [] }
for (let i = 0; i < 5; i++)
  result.q8.ort.ms.push((await ev(page, () => window.harness.segment('baseline', '1-portrait.jpg', 'baseline-q8'))).ms)
for (const name of CORPUS) {
  await ev(page, ([n]) => window.harness.segment('baseline', n, 'baseline-q8'), name)
  result.q8[name] = await ev(page, ([n]) => window.harness.compareMasks('baseline', 'baseline-q8', n), name)
}

result.env.after = { batt: sh('pmset -g batt'), uptime: sh('uptime') }
result.env.void = !onAc(result.env.after.batt) ? 'power left AC during the run' : null
if (result.env.void) log('VOID:', result.env.void)
result.summary = {
  cold: {
    baseline: median(result.cold.baseline),
    tract: median(result.cold.tract),
    ratio: median(result.cold.tract) / median(result.cold.baseline),
  },
  latency: Object.fromEntries(
    CORPUS.map((n) => {
      const l = result.latency[n]
      return [
        n,
        {
          baseline: median(l.baseline),
          ratio: median(l.tract) / median(l.baseline),
          tract: median(l.tract),
          tractMemoryHighWaterMiB: l.tractMemoryHighWater / 2 ** 20,
        },
      ]
    }),
  ),
  maskPsnr: Object.fromEntries(
    CORPUS.map((n) => {
      const f = result.fidelity[n]
      return [
        n,
        {
          edgeMeanAbs: f.mask.edgeBand.meanAbs,
          floorPsnr: f.floor?.psnrDb ?? null,
          maxAbs: f.mask.maxAbs,
          psnr: f.mask.psnrDb,
          rawPsnr: f.raw.psnrDb,
        },
      ]
    }),
  ),
}
mkdirSync(RUNS, { recursive: true })
writeFileSync(
  join(RUNS, 'chrome.json'),
  JSON.stringify(result, (k, v) => (v === Infinity ? 'Infinity' : v), 1),
)
console.log(JSON.stringify(result.summary, (k, v) => (v === Infinity ? 'Infinity' : v), 1))
await ctx.close()
