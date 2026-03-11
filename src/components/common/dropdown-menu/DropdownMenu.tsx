import { Content, Item, Portal, Root, Trigger } from '@radix-ui/react-dropdown-menu'

import type { DropdownMenuProps } from '@/types'

export const DropdownMenu = ({ items, trigger }: DropdownMenuProps) => {
  return (
    <Root>
      <Trigger asChild>{trigger}</Trigger>
      <Portal>
        <Content
          className="animate-in fade-in-0 zoom-in-95 z-50 min-w-[160px] rounded-md border border-gray-800 bg-gray-900 py-1 shadow-lg"
          sideOffset={4}
        >
          {items.map((item) => (
            <Item
              className="cursor-pointer px-3 py-1.5 text-body-sm transition-colors outline-none hover:bg-gray-800 focus:bg-gray-800 data-[state=active]:text-primary data-[state=inactive]:text-gray-300"
              data-state={item.active ? 'active' : 'inactive'}
              data-testid={item['data-testid']}
              key={item.label}
              onSelect={item.onSelect}
            >
              {item.label}
            </Item>
          ))}
        </Content>
      </Portal>
    </Root>
  )
}
