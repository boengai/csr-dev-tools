// Reported check for #44: does today's background-remover journey (React,
// built from develop) pass under the production CSP without 'unsafe-eval'?
// `vite preview` does not serve public/_headers, so the CSP is read from it
// and added to every document response here. Run from the repo root with
// `pnpm exec vite preview --port 5198 --strictPort` serving `dist/`.
//   node .../unsafe-eval.mjs with      (control: the CSP as shipped)
//   node .../unsafe-eval.mjs without   (the CSP minus 'unsafe-eval')
//   node .../unsafe-eval.mjs control   (minus jsdelivr: must fail, proving the CSP applies)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { chromium } from '@playwright/test'

const H = 'docs/research/tract-bg-removal-trial/harness'
const shipped = readFileSync('public/_headers', 'utf8')
  .match(/Content-Security-Policy: (.*)/)[1]
  .trim()
const mode = process.argv[2]
const csp =
  mode === 'without'
    ? shipped.replace(" 'unsafe-eval'", '')
    : mode === 'control'
      ? shipped.replaceAll(' https://cdn.jsdelivr.net', '')
      : shipped
if (process.argv[2] === 'without' && csp === shipped) throw new Error("no 'unsafe-eval' to remove")

const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext()
const violations = []
await ctx.route('http://localhost:5198/**', async (route) => {
  const res = await route.fetch()
  const type = res.headers()['content-type'] ?? ''
  const headers = { ...res.headers() }
  if (type.includes('text/html') || /worker/.test(route.request().url())) headers['content-security-policy'] = csp
  await route.fulfill({ headers, response: res })
})
const page = await ctx.newPage()
page.on('console', (m) => {
  if (/Content Security Policy|unsafe-eval|EvalError/i.test(m.text())) violations.push(m.text())
})
page.on('pageerror', (e) => violations.push(`pageerror: ${e.message}`))
await page.goto('http://localhost:5198/tools/background-remover')
await page.evaluate(() =>
  document.addEventListener('securitypolicyviolation', (e) =>
    console.error(`Content Security Policy violation: ${e.violatedDirective} ${e.blockedURI}`),
  ),
)
const chooser = page.waitForEvent('filechooser')
await page.getByRole('button', { name: 'Select image to remove background' }).click()
await (await chooser).setFiles(join(H, 'corpus', '1-portrait.jpg'))
let ok = false
try {
  await page.locator('img[alt="result"]').waitFor({ timeout: mode === 'control' ? 60_000 : 180_000 })
  ok = true
} catch {}
console.log(JSON.stringify({ csp: process.argv[2], resultShown: ok, violations }, null, 1))
await browser.close()
