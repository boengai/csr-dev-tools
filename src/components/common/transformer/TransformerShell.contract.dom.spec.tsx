import { describeLayoutContract, slottedOutput, slottedOutputShowsPlaceholder } from '@/test/layout-contract'

// Every Tool has a fixture: saved bad input (`storage`), bad input typed into
// the dialog (`steps`) for Tools that never save it, or `never` with the reason
// its input cannot be invalid (reported as `todo`).
const ANY_TEXT = 'any text is valid'
const LENIENT_FORMATTER = 'the formatter passes malformed input through instead of rejecting it'

describeLayoutContract('transformer', {
  // `fields` puts Copy on each row; `image` takes the output away with Download.
  expectsLabelCopy: (out) => out.dataset.outputKind === 'text' || out.dataset.outputKind === 'markup',
  fixtures: {
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
  output: slottedOutput,
  showsPlaceholder: slottedOutputShowsPlaceholder,
})
