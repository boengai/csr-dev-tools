import { describeLayoutContract, slottedOutput, slottedOutputShowsPlaceholder } from '@/test/layout-contract'

import { LAYOUT_ERROR_FIXTURES } from '../../../../e2e/parity/layout-fixtures'

describeLayoutContract('transformer', {
  // `fields` puts Copy on each row; `image` takes the output away with Download.
  expectsLabelCopy: (out) => out.dataset.outputKind === 'text' || out.dataset.outputKind === 'markup',
  fixtures: LAYOUT_ERROR_FIXTURES['transformer'],
  output: slottedOutput,
  showsPlaceholder: slottedOutputShowsPlaceholder,
})
