import type { DiagramSidePanelProps } from '@/types'
import { tv } from '@/utils'

import { CloseButton } from './CloseButton'

const panelStyles = tv({
  base: 'flex shrink-0 flex-col border-l border-gray-800 bg-gray-950',
  variants: {
    size: {
      default: 'w-80',
      wide: 'w-96',
    },
  },
})

/**
 * Sidebar frame shared by the DB Diagram side panels (Import SQL,
 * Import JSON Schema, Export SQL/Mermaid/TypeScript, DBML editor).
 *
 * Owns the outer column, the header row (title + CloseButton), an
 * optional `controls` row between header and body, the body region
 * (scrollable, `p-3` padding), and the bordered footer row. Consumers
 * slot their own content into `controls`, `children` (body), and
 * `footer`.
 *
 * `DiagramListPanel` does not adopt this shell — its shape diverges
 * (narrower width, no footer, body without padding).
 */
export const DiagramSidePanel = ({
  children,
  controls,
  footer,
  onClose,
  size = 'default',
  testId,
  title,
}: DiagramSidePanelProps) => {
  return (
    <div className={panelStyles({ size })} data-testid={testId}>
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-bold text-white">{title}</span>
        <CloseButton onClick={onClose} />
      </div>

      {controls && (
        <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">{controls}</div>
      )}

      <div className="flex-1 overflow-auto p-3">{children}</div>

      <div className="border-t border-gray-800 px-3 py-2">{footer}</div>
    </div>
  )
}
