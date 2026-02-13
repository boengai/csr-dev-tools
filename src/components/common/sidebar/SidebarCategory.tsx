import type { SidebarCategoryProps } from '@/types'

export const SidebarCategory = ({ categoryName, children }: SidebarCategoryProps) => {
  return (
    <div className="flex flex-col">
      <span className="px-3 pt-4 pb-1 text-[0.6rem] tracking-[0.12em] text-gray-500 uppercase">{categoryName}</span>
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}
