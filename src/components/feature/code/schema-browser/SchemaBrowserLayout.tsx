import { BrowsableItemList } from '@/components/common'
import type { SchemaBrowserLayoutProps } from '@/types'

/**
 * Two-pane schema browser: an optional filter plus a selectable entry list on
 * the left, the selected entry's detail on the right. Shared by the GraphQL
 * schema viewer and Protobuf → JSON.
 */
export const SchemaBrowserLayout = ({ detail, filter, list }: SchemaBrowserLayoutProps) => (
  <div className="flex flex-col gap-4 tablet:flex-row">
    <div className="flex w-full shrink-0 flex-col gap-2 tablet:w-64">
      {filter}
      <BrowsableItemList {...list} />
    </div>
    <div aria-live="polite" className="min-w-0 grow">
      {detail}
    </div>
  </div>
)
