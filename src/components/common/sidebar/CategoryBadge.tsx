import type { CategoryBadgeProps } from '@/types'

export const CategoryBadge = ({ count }: CategoryBadgeProps) => {
  return (
    <span aria-label={`${count} tools`} className="text-body-xs rounded-full bg-gray-800 px-2 py-0.5 text-gray-400">
      {count}
    </span>
  )
}
