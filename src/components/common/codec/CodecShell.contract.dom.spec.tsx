import { expect } from 'vitest'

import { codeOutput, codeOutputShowsPlaceholder, describeLayoutContract } from '@/test/layout-contract'

describeLayoutContract('codec', {
  extra: (dialog) => {
    // Q12: one mode toggle inside the dialog, exactly one mode pressed.
    const toggles = [...dialog.querySelectorAll('button[aria-pressed]')].filter((b) =>
      /mode$/.test(b.getAttribute('aria-label') ?? ''),
    )
    expect(toggles.length).toBeGreaterThanOrEqual(2)
    expect(toggles.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
  },
  // Saved bad input (the mode is saved too), or typed into the dialog for AES,
  // which never saves its source. `never`: no input in any mode is rejected.
  fixtures: {
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
  output: codeOutput,
  showsPlaceholder: codeOutputShowsPlaceholder,
})
