import type { Page } from '@playwright/test'

/** At least `count` (default 1) visible, enabled elements matching `selector`, each with `text` in its value or content. */
export type DomCondition = { count?: number; selector: string; text?: string }

export type PerfPage = {
  /** Uses the page the way a visitor would, once `ready` holds. */
  act: (page: Page) => Promise<void>
  /** `h1` of a tool page. An unknown URL is answered with the home page, so this catches measuring the wrong page. */
  heading?: string
  key: string
  path: string
  /** The controls the visitor needs can be operated. They may still be fading in. */
  ready: DomCondition
  /** The correct result of `act` is on screen. */
  result: DomCondition
}

// Most of these hooks are the ones the e2e specs use. A build in another framework must keep all of them;
// docs/perf/README.md lists the ones no spec covers.
const SURFACE = '[data-slot="tool-surface"]'
const OUTPUT = `${SURFACE} pre[data-has-value]`

// `force` skips Playwright's wait for animations to settle: a visitor does not wait either.
const clickButton = (page: Page, name: string) =>
  page.getByRole('button', { exact: true, name }).first().click({ force: true })

const typeIntoEditor = async (page: Page, index: number, text: string) => {
  await page.locator(`${SURFACE} .cm-content`).nth(index).click({ force: true })
  await page.keyboard.insertText(text)
}

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==',
  'base64',
)

export const PERF_PAGES: Array<PerfPage> = [
  {
    act: (page) => clickButton(page, 'Format'),
    key: 'home',
    path: '/',
    ready: { count: 6, selector: '[data-testid="dashboard-widget"] h3' },
    result: { selector: '[role="dialog"] .cm-content' },
  },
  {
    // SHA-256, the default, uses the browser's WebCrypto; MD5 is the algorithm that loads WebAssembly.
    act: async (page) => {
      await clickButton(page, 'Select MD5 algorithm')
      await page.locator(`${SURFACE} textarea`).first().fill('Hello, World!')
    },
    heading: 'Hash Generator',
    key: 'hash-generator',
    path: '/tools/hash-generator/',
    ready: { selector: `${SURFACE} textarea` },
    result: { selector: OUTPUT, text: '65a8e27d8879283831b664bd8b7f0ad4' },
  },
  {
    act: (page) => typeIntoEditor(page, 0, '{"name":"John"}'),
    heading: 'Escaped JSON Stringifier',
    key: 'escaped-json-stringifier',
    path: '/tools/escaped-json-stringifier/',
    ready: { selector: `${SURFACE} .cm-content` },
    result: { selector: OUTPUT, text: '\\"name\\"' },
  },
  {
    act: async (page) => {
      await page
        .locator('input[name="images"]')
        .setInputFiles(['a.png', 'b.png'].map((name) => ({ buffer: ONE_PIXEL_PNG, mimeType: 'image/png', name })))
      await clickButton(page, 'Convert 2 images')
    },
    heading: 'Image Converter',
    key: 'image-converter',
    path: '/tools/image-converter/',
    ready: { selector: `${SURFACE} [aria-label="Upload area"] button` },
    // A failed conversion is also a row in Results; only a converted file has a download button.
    result: { count: 2, selector: '[aria-label="Results"] button[aria-label^="Download csr-dev-tools_"]' },
  },
  {
    // A random generator fills its output on open, so there is nothing to type.
    act: async () => {},
    heading: 'UUID Generator',
    key: 'uuid-generator',
    path: '/tools/uuid-generator/',
    ready: { selector: `${SURFACE} button`, text: 'Generate' },
    result: { selector: `${SURFACE} button[aria-label="Copy all UUIDs to clipboard"]` },
  },
  {
    act: async (page) => {
      await typeIntoEditor(page, 0, '{"a":1}')
      await typeIntoEditor(page, 1, '{"a":2}')
    },
    heading: 'JSON Diff',
    key: 'json-diff-checker',
    path: '/tools/json-diff-checker/',
    ready: { count: 2, selector: `${SURFACE} .cm-content` },
    result: { selector: `${SURFACE} [aria-label="Diff output"]`, text: '"a": 2' },
  },
  {
    act: (page) => page.locator(`${SURFACE} input[name="decimal"]`).fill('42'),
    heading: 'Number Base Converter',
    key: 'number-base-converter',
    path: '/tools/number-base-converter/',
    ready: { selector: `${SURFACE} input[name="decimal"]` },
    result: { selector: `${SURFACE} input[name="hex"]`, text: '2a' },
  },
]
