import type { Extension } from '@codemirror/state'
import type { ReactNode } from 'react'

import type { DbmlError } from '@/types'

export type ImportSidePanelProps = {
  title: string
  onClose: () => void
  testId: string
  placeholder: string
  extensions: Array<Extension>
  onImport: (text: string, opts: { merge: boolean }) => Array<DbmlError>
  controls?: ReactNode
}
