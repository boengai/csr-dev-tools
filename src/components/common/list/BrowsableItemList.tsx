import type { BrowsableItemListProps } from '@/types'

export const BrowsableItemList = ({ emptyMessage, items, onSelect, selectedId }: BrowsableItemListProps) => {
  return (
    <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
      {items.length > 0 ? (
        items.map((item) => (
          <button
            aria-current={selectedId === item.id ? 'true' : undefined}
            aria-label={item.ariaLabel}
            className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none data-[state=active]:bg-gray-800 data-[state=active]:text-gray-100 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:bg-gray-900 data-[state=inactive]:hover:text-gray-200"
            data-state={selectedId === item.id ? 'active' : 'inactive'}
            key={item.id}
            onClick={() => onSelect(item)}
            type="button"
          >
            {item.badge}
            <span className="truncate text-body-xs">{item.name}</span>
          </button>
        ))
      ) : (
        <p className="px-2 py-4 text-body-xs text-gray-500">{emptyMessage}</p>
      )}
    </div>
  )
}
