import { describeLayoutContract, toolOutput, toolOutputShowsPlaceholder } from '@/test/layout-contract'

// Generators produce output on open, so the contract checks for a value, not
// the empty state. Each fixture restores saved options the tool rejects —
// corrupt, or a typed value it can't use (a bad hex or width). Out-of-range
// numbers are clamped, not rejected.
describeLayoutContract('generator', {
  // `image` takes the output away with Download, not Copy.
  expectsLabelCopy: (out) => out.dataset.outputKind !== 'image',
  fixtures: {
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
  opensWith: 'output',
  output: toolOutput,
  showsPlaceholder: toolOutputShowsPlaceholder,
})
