import type { ReactNode } from 'react'

export type BrowsableItem = {
  /**
   * Pre-rendered aria-label for the item's button. Tools format this with
   * their own kind vocabulary (e.g., "User - Object type" vs "Foo - Message type").
   */
  ariaLabel?: string
  /**
   * Pre-rendered badge element (typically a `KindBadge`). Per-Tool because the
   * kind vocabularies differ — GraphQL uses Enum/Input/Interface/Object/Scalar/Union;
   * Protobuf uses message/enum.
   */
  badge?: ReactNode
  /** Unique key, used for selection comparison. */
  id: string
  /** Displayed text. */
  name: string
}

export type BrowsableItemListProps = {
  emptyMessage: string
  items: Array<BrowsableItem>
  onSelect: (item: BrowsableItem) => void
  selectedId: string | null
}
