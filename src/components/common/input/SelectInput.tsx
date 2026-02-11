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
import { AnimatePresence, motion } from 'motion/react'

import type { SelectInputProps } from '@/types'

import { CheckIcon, ChevronIcon } from '../icon'

export const SelectInput = ({
  disabled,
  name,
  onBlur,
  onChange,
  options: items,
  placeholder,
  value,
}: SelectInputProps) => {
  return (
    <Root disabled={disabled} name={name} onValueChange={onChange} value={value}>
      <Trigger className="input group [&>span]:first:truncate" onBlur={onBlur}>
        <Value placeholder={placeholder} />
        <Icon className="text-gray-400 transition-transform duration-500 group-data-[state=open]:rotate-180">
          <ChevronIcon size={20} />
        </Icon>
      </Trigger>
      <Portal>
        <AnimatePresence>
          <Content
            asChild
            className="popover z-50 max-h-[30dvh] w-[var(--radix-select-trigger-width)]"
            position="popper"
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{
                damping: 25,
                opacity: { duration: 0.2 },
                stiffness: 300,
                type: 'spring',
              }}
            >
              <Viewport>
                {items.map((itm) => (
                  <Item
                    className="hover:bg-primary/50 flex cursor-pointer items-center justify-between truncate px-4 py-2 transition-colors data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[state=checked]:pointer-events-none"
                    disabled={itm.disabled}
                    key={itm.value}
                    value={itm.value}
                  >
                    <ItemText className="whitespace-nowrap">{itm.label}</ItemText>
                    <ItemIndicator className="text-success">
                      <CheckIcon size={20} />
                    </ItemIndicator>
                  </Item>
                ))}
              </Viewport>
              <Arrow />
            </motion.div>
          </Content>
        </AnimatePresence>
      </Portal>
    </Root>
  )
}
