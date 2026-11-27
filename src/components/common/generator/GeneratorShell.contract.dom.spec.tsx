import { describeLayoutContract, toolOutput, toolOutputShowsPlaceholder } from '@/test/layout-contract'

import { LAYOUT_ERROR_FIXTURES } from '../../../../e2e/parity/layout-fixtures'

// Generators produce output on open, so the contract checks for a value, not
// the empty state.
describeLayoutContract('generator', {
  // `image` takes the output away with Download, not Copy.
  expectsLabelCopy: (out) => out.dataset.outputKind !== 'image',
  fixtures: LAYOUT_ERROR_FIXTURES['generator'],
  opensWith: 'output',
  output: toolOutput,
  showsPlaceholder: toolOutputShowsPlaceholder,
})
