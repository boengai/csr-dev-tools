import type { ReactNode } from 'react'

import type { BrowsableItemListProps } from '@/types/components/common/browsableItemList'

export type KindBadgeStyle = {
  /** Tailwind classes for the badge's border/background/text colours. */
  badge: string
  /** One- or two-letter glyph rendered inside the badge. */
  label: string
}

export type KindBadgeProps<K extends string> = {
  ariaLabel: string
  kind: K
  styles: Record<K, KindBadgeStyle>
}

export type SchemaBrowserLayoutProps = {
  /** Detail pane for the current selection (or an empty-state prompt). */
  detail: ReactNode
  /** Optional control rendered above the list (e.g. a filter input). */
  filter?: ReactNode
  list: BrowsableItemListProps
}
