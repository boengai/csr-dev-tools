// The CSP fixture (docs/quality/gates.md → "CSP"), for the Dioxus project only.
// playwright.dioxus.config.ts maps `@playwright/test` here (e2e/tsconfig.dioxus.json),
// so every spec it runs, the unchanged React journeys included, gets this `test`.
// It imports the real module by path: the alias would send `@playwright/test` back here.
// That path has no declarations of its own, so its types are taken from `@playwright/test`,
// which is only a type import here and so is never resolved at run time.
// @ts-expect-error TS7016: typed through the cast below.
import * as playwright from '../../node_modules/@playwright/test/index.mjs'

// @ts-expect-error TS7016: the specs' types come from `@playwright/test` itself.
export * from '../../node_modules/@playwright/test/index.mjs'

const { expect, test: base } = playwright as typeof import('@playwright/test')

/** Each violation a page reported: its directive and what it blocked. */
type Violations = Array<string>

export const test = base.extend<{ cspViolations: Violations }>({
  // Auto: it runs for every test, on every page of the test's own context.
  // A worker's violations fire on the worker, not the page, so this misses them.
  cspViolations: [
    async ({ context }, use) => {
      const seen: Violations = []
      await context.exposeBinding('__reportCspViolation', (_source, violation: string) => {
        seen.push(violation)
      })
      await context.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          const report = (window as unknown as { __reportCspViolation: (v: string) => void }).__reportCspViolation
          report(`${event.effectiveDirective} blocked ${event.blockedURI || 'inline'} on ${event.documentURI}`)
        })
      })
      await use(seen)
      expect(seen, 'securitypolicyviolation events under the post-migration CSP').toEqual([])
    },
    { auto: true },
  ],
})
