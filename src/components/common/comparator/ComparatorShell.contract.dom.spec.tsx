import { describeLayoutContract } from '@/test/layout-contract'

describeLayoutContract('comparator', {
  fixtures: {
    'json-diff-checker': { storage: { 'csr-dev-tools-json-diff': { modified: '{}', original: '{bad' } } },
    'text-diff-checker': { never: 'any two texts can be diffed' },
  },
  output: (dialog) => {
    const out = dialog.querySelector<HTMLElement>('[data-slot="tool-output"]')
    if (!out) throw new Error('No [data-slot="tool-output"] in the dialog')
    return out
  },
  showsPlaceholder: (out) => out.querySelector('[data-slot="empty-state"]') !== null,
})
