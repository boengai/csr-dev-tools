import { expect } from 'vitest'

import { codeOutput, codeOutputShowsPlaceholder, describeLayoutContract } from '@/test/layout-contract'

import { LAYOUT_ERROR_FIXTURES } from '../../../../e2e/parity/layout-fixtures'

describeLayoutContract('codec', {
  extra: (dialog) => {
    // Q12: one mode toggle inside the dialog, exactly one mode pressed.
    const toggles = [...dialog.querySelectorAll('button[aria-pressed]')].filter((b) =>
      /mode$/.test(b.getAttribute('aria-label') ?? ''),
    )
    expect(toggles.length).toBeGreaterThanOrEqual(2)
    expect(toggles.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
  },
  fixtures: LAYOUT_ERROR_FIXTURES['codec'],
  output: codeOutput,
  showsPlaceholder: codeOutputShowsPlaceholder,
})
