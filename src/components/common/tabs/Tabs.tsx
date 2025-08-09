import { Content, List, Root, Trigger } from '@radix-ui/react-tabs'
import { AnimatePresence, motion } from 'motion/react'

import type { TabsProps } from '@/types'

export const Tabs = ({ defaultValue, inject, items }: TabsProps) => {
  return (
    <Root
      className="flex size-full grow flex-col"
      defaultValue={defaultValue ?? items[0].value}
      onValueChange={inject?.setValue}
      value={inject?.value}
    >
      <List>
        {items
          .filter(({ trigger }: TabsProps['items'][number]) => trigger !== undefined)
          .map(({ trigger, value }: TabsProps['items'][number]) => (
            <Trigger asChild key={value} value={value}>
              {trigger}
            </Trigger>
          ))}
      </List>
      <AnimatePresence>
        {items.map(({ content, value }: TabsProps['items'][number]) => (
          <Content asChild key={value} value={value}>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex size-full grow flex-col"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 10 }}
              layout
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {content}
            </motion.div>
          </Content>
        ))}
      </AnimatePresence>
    </Root>
  )
}
