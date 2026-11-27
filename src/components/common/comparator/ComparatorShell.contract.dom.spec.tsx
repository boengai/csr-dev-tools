import { describeLayoutContract } from '@/test/layout-contract'

import { LAYOUT_ERROR_FIXTURES } from '../../../../e2e/parity/layout-fixtures'

describeLayoutContract('comparator', {
  fixtures: LAYOUT_ERROR_FIXTURES['comparator'],
  output: (dialog) => {
    const out = dialog.querySelector<HTMLElement>('[data-slot="tool-output"]')
    if (!out) throw new Error('No [data-slot="tool-output"] in the dialog')
    return out
  },
  showsPlaceholder: (out) => out.querySelector('[data-slot="empty-state"]') !== null,
})
