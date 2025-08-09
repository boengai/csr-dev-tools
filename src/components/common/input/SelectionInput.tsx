import {
  Arrow,
  Content,
  Icon,
  Item,
  ItemIndicator,
  ItemText,
  Portal,
  Root,
  Trigger,
  Value,
  Viewport,
} from '@radix-ui/react-select'

import type { SelectInputProps } from '@/types'

import { CheckIcon, ChevronIcon } from '../icon'

export const SelectionInput = ({ disabled, items, name, onChange, placeholder, value }: SelectInputProps) => {
  return (
    <Root disabled={disabled} name={name} onValueChange={onChange} value={value}>
      <Trigger className="input group">
        <Value placeholder={placeholder} />
        <Icon className="text-gray-400 transition-transform duration-500 group-data-[state=open]:rotate-180">
          <ChevronIcon size={20} />
        </Icon>
      </Trigger>
      <Portal>
        <Content className="popover w-[var(--radix-select-trigger-width)]" position="popper">
          <Viewport>
            {items.map((itm: SelectInputProps['items'][number]) => (
              <Item
                className="hover:bg-primary/50 flex cursor-pointer items-center justify-between px-4 py-2 transition-colors data-[state=checked]:pointer-events-none"
                key={itm.value}
                value={itm.value}
              >
                <ItemText>{itm.label}</ItemText>
                <ItemIndicator className="text-success">
                  <CheckIcon size={20} />
                </ItemIndicator>
              </Item>
            ))}
          </Viewport>
          <Arrow />
        </Content>
      </Portal>
    </Root>
  )
}
