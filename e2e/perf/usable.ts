import type { Browser, BrowserContext, Page } from '@playwright/test'

import { assertOnPage, MOBILE, timeWhen } from './dom.ts'
import type { PerfPage } from './pages.ts'
import { SLOW_4G } from './throttle.ts'

/** Milliseconds since navigation start. */
export type UsableRun = { firstResult: number; ready: number; repeatReady: number }

const newThrottledPage = async (context: BrowserContext): Promise<Page> => {
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    downloadThroughput: (SLOW_4G.downloadKbps * 1024) / 8,
    latency: SLOW_4G.latencyMs,
    offline: false,
    uploadThroughput: (SLOW_4G.uploadKbps * 1024) / 8,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: SLOW_4G.cpuSlowdown })
  return page
}

export const measureUsable = async (browser: Browser, origin: string, target: PerfPage): Promise<UsableRun> => {
  const context = await browser.newContext(MOBILE)
  try {
    const first = await newThrottledPage(context)
    await first.goto(`${origin}${target.path}`, { waitUntil: 'commit' })
    const ready = await timeWhen(first, target.ready)
    // Watching starts before acting, so a result that appears while `act` is still returning is timed when it appears.
    const [firstResult] = await Promise.all([timeWhen(first, target.result), target.act(first)])
    await assertOnPage(first, target)
    // The repeat load needs everything in the HTTP cache.
    await first.waitForLoadState('networkidle')
    await first.close()

    const repeat = await newThrottledPage(context)
    await repeat.goto(`${origin}${target.path}`, { waitUntil: 'commit' })
    return { firstResult, ready, repeatReady: await timeWhen(repeat, target.ready) }
  } finally {
    await context.close()
  }
}
