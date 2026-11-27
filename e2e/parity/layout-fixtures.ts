/**
 * Bad-input fixtures for the layout contract (ADR-0027, docs/ux/parity.md).
 * Shared by the jsdom suites (`src/components/common/<shell>/<Shell>.contract.dom.spec.tsx`)
 * and the Playwright suite (`e2e/parity/layout-contract.spec.ts`), so the React
 * and the Dioxus runs read the same data. Plain data: no test-runner imports.
 */
import type { ToolLayout, ToolRegistryKey } from '../../src/types/constants/tool-registry'

/**
 * One action on the opened Tool, run in order:
 * - `click`: the button with this accessible name (e.g. a mode toggle).
 * - `select` / `option`: open the combobox with this accessible name, pick the option.
 * - `type`: replace a field's text. `field` is `'source'` (default, the shell's
 *   source editor of any kind) or another field's accessible name.
 */
export type LayoutFixtureStep =
  | { click: string }
  | { option: string; select: string }
  | { field?: string; type: string }

/**
 * Bad input for the error path, one of:
 * - `storage` and/or `steps`: localStorage entries (JSON-encoded on write) seeded
 *   before the Tool opens, then steps run on it. Tools that never save their
 *   input use `steps` alone.
 * - `never`: why this tool's input cannot be invalid. Reported as a `todo` that says so.
 */
export type LayoutErrorFixture =
  | { never: string }
  | { steps: Array<LayoutFixtureStep>; storage?: Record<string, unknown> }
  | { steps?: Array<LayoutFixtureStep>; storage: Record<string, unknown> }

export type ShellLayout = Exclude<ToolLayout, 'custom'>

export type LayoutErrorFixtures = Partial<Record<ToolRegistryKey, LayoutErrorFixture>>

const ANY_TEXT = 'any text is valid'
const LENIENT_FORMATTER = 'the formatter passes malformed input through instead of rejecting it'

export const LAYOUT_ERROR_FIXTURES: Record<ShellLayout, LayoutErrorFixtures> = {
  // Saved bad input (the mode is saved too), or typed into the dialog for AES,
  // which never saves its source. `never`: no input in any mode is rejected.
  codec: {
    'aes-encrypt-decrypt': {
      steps: [{ click: 'Decrypt mode' }, { type: '!!! not base64 !!!' }, { field: 'Password', type: 'secret' }],
    },
    'base64-codec': {
      storage: { 'csr-dev-tools-base64-decode-source': '!!! not base64', 'csr-dev-tools-base64-mode': 'decode' },
    },
    'env-file-converter': {
      storage: { 'csr-dev-tools-env-file-converter-mode': 'json-to-env', 'csr-dev-tools-json-to-env-source': '{bad' },
    },
    'escaped-json-stringifier': { storage: { 'csr-dev-tools-escaped-json-stringify-source': '{bad' } },
    'html-entity-converter': { never: 'any text encodes, and unknown entities decode as themselves' },
    'html-to-markdown-converter': { never: 'any text is valid HTML or Markdown' },
    'json-to-csv-converter': { storage: { 'csr-dev-tools-json-to-csv-source': '{bad' } },
    'json-to-toml-converter': { storage: { 'csr-dev-tools-toml-to-json-source': 'a = "unterminated' } },
    'json-to-xml-converter': { storage: { 'csr-dev-tools-xml-to-json-source': '<a><b></a>' } },
    'json-to-yaml-converter': { storage: { 'csr-dev-tools-json-to-yaml-source': '{bad' } },
    // HTML (the default format) unescapes anything; URL rejects a broken percent-escape.
    'string-escape-unescape': {
      steps: [{ option: 'URL', select: 'Escape format' }],
      storage: {
        'csr-dev-tools-string-escape-unescape-mode': 'unescape',
        'csr-dev-tools-string-escape-unescape-source': '%E0%A4%A',
      },
    },
    'url-encoder-decoder': {
      storage: { 'csr-dev-tools-url-encoder-decode-source': '%E0%A4%A', 'csr-dev-tools-url-encoder-mode': 'decode' },
    },
  },
  comparator: {
    'json-diff-checker': { storage: { 'csr-dev-tools-json-diff': { modified: '{}', original: '{bad' } } },
    'text-diff-checker': { never: 'any two texts can be diffed' },
  },
  // Files are never persisted, so there is no stored bad input. The shell's own
  // spec (FileProcessorShell.dom.spec) covers the error path with a failing `process`.
  'file-processor': {},
  // Generators produce output on open. Each fixture restores saved options the
  // tool rejects — corrupt, or a typed value it can't use (a bad hex or width).
  // Out-of-range numbers are clamped, not rejected.
  generator: {
    'color-palette-generator': {
      storage: {
        'csr-dev-tools-color-palette-generator': { harmony: 'analogous', hex: 'not-a-color' },
      },
    },
    'crontab-generator': {
      storage: {
        'csr-dev-tools-crontab-generator': {
          dayOfMonth: { mode: 'specific', values: 'mondays' },
          dayOfWeek: { mode: 'every' },
          hour: { mode: 'sometimes' },
          minute: { mode: 'every' },
          month: { mode: 'every' },
        },
      },
    },
    'lorem-ipsum-generator': {
      storage: {
        'csr-dev-tools-lorem-ipsum-generator': { count: 3, startWithLorem: true, unit: 'chapters' },
      },
    },
    'markdown-table-generator': {
      storage: {
        'csr-dev-tools-markdown-table-generator': { alignments: ['left'], cols: 3, data: 'not a grid', rows: 3 },
      },
    },
    'password-generator': {
      storage: {
        'csr-dev-tools-password-generator': {
          count: 1,
          digits: false,
          length: 16,
          lowercase: false,
          symbols: false,
          uppercase: false,
        },
      },
    },
    'placeholder-image-generator': {
      storage: {
        'csr-dev-tools-placeholder-image-generator': {
          bgColor: '#cccccc',
          bgHexInput: '#cccccc',
          height: '600',
          text: '',
          textColor: '#666666',
          textHexInput: '#666666',
          width: 'wide',
        },
      },
    },
    'rsa-key-generator': { storage: { 'csr-dev-tools-rsa-key-generator': { keySize: 1024 } } },
    'uuid-generator': { storage: { 'csr-dev-tools-uuid-generator': { count: 'many' } } },
  },
  // Every Tool has a fixture: saved bad input (`storage`), bad input typed into
  // the dialog (`steps`) for Tools that never save it, or `never` with the reason
  // its input cannot be invalid (reported as `todo`).
  transformer: {
    'base64-to-image': { steps: [{ type: '!!! not base64 !!!' }] },
    'certificate-decoder': { steps: [{ type: 'not a certificate' }] },
    'cron-expression-parser': { storage: { 'csr-dev-tools-cron-expression-parser': { source: '* * *' } } },
    'css-formatter': { never: LENIENT_FORMATTER },
    'hash-generator': { never: ANY_TEXT },
    'hmac-generator': { never: 'any message and secret key are valid' },
    'html-formatter': { never: LENIENT_FORMATTER },
    'javascript-minifier': { never: LENIENT_FORMATTER },
    'json-formatter': { storage: { 'csr-dev-tools-json-formatter': { source: '{bad' } } },
    'json-schema-validator': {
      storage: { 'csr-dev-tools-json-schema-validator': { schema: '{"type": "object"}', source: '{bad' } },
    },
    'json-to-typescript': {
      storage: {
        'csr-dev-tools-json-to-typescript': {
          optionalProps: false,
          rootName: 'Root',
          source: '{bad',
          useInterface: true,
        },
      },
    },
    'jsonpath-evaluator': {
      storage: { 'csr-dev-tools-jsonpath-evaluator-v2': { expression: '$.store', source: '{bad' } },
    },
    'jwt-decoder': { steps: [{ type: 'not.a.jwt' }] },
    'markdown-preview': { never: 'any text is valid Markdown' },
    'mermaid-renderer': { storage: { 'csr-dev-tools-mermaid-renderer': { source: 'this is not mermaid !!!' } } },
    'qr-code-generator': { steps: [{ type: 'x'.repeat(8000) }] },
    'sql-formatter': { never: LENIENT_FORMATTER },
    'ssh-key-fingerprint': { steps: [{ type: 'not an ssh key' }] },
    'svg-viewer': { steps: [{ type: '<div>not svg</div>' }] },
    'text-case-converter': { never: ANY_TEXT },
    'text-sort-dedupe': { never: ANY_TEXT },
    'timezone-converter': {
      storage: {
        'csr-dev-tools-timezone-converter': { source: 'not a date', sourceTz: 'UTC', targetTzIds: ['UTC'] },
      },
    },
    'unix-timestamp': { steps: [{ type: 'not a number' }] },
    'url-parser': { steps: [{ type: 'not a url' }] },
    'user-agent-parser': { never: 'any string parses as a user agent' },
    'word-counter': { never: ANY_TEXT },
    'yaml-formatter': {
      storage: { 'csr-dev-tools-yaml-formatter': { indent: 2, source: 'a: [1, 2', sortKeys: false } },
    },
  },
}
