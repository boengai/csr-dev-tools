import { within } from '@testing-library/react'
import { expect } from 'vitest'

import { describeLayoutContract } from '@/test/layout-contract'

import { LAYOUT_ERROR_FIXTURES } from '../../../../e2e/parity/layout-fixtures'

describeLayoutContract('file-processor', {
  extra: (dialog) => {
    // The upload area is the only way in, and it takes a file.
    const area = within(dialog).getByRole('region', { name: 'Upload area' })
    expect(area.querySelector('input[type="file"]')).not.toBeNull()
    // Nothing to process yet: no Process / "Choose another" input pane.
    expect(dialog.querySelector('[data-slot="tool-input"]')).toBeNull()
  },
  fixtures: LAYOUT_ERROR_FIXTURES['file-processor'],
  // The shell's own spec covers the error path with a failing `process`.
  fixturesUnavailable: 'files are never persisted, so there is no stored bad input — see FileProcessorShell.dom.spec',
  output: (dialog) => {
    const out = dialog.querySelector<HTMLElement>('[data-slot="upload-area"], [data-slot="tool-output"]')
    if (!out) throw new Error('No upload area or [data-slot="tool-output"] in the dialog')
    return out
  },
  outputAction: { inEmptyState: false, name: /^Download/ },
  showsPlaceholder: (out) => out.dataset.slot === 'upload-area',
  tile: (tile) => {
    // One way in: the tile is a plain button that opens the dialog, not an upload control.
    expect(within(tile).getAllByRole('button')).toHaveLength(1)
    expect(tile.querySelector('input[type="file"]')).toBeNull()
  },
})
