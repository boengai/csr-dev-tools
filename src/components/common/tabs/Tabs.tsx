import { Content, List, Root, Trigger } from '@radix-ui/react-tabs'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { TabsProps } from '@/types'

export const Tabs = ({ defaultValue, injected, items }: TabsProps) => {
  // ref
  const listRef = useRef<HTMLDivElement>(null)

  // state
  const [indicator, setIndicator] = useState({ translateX: 0, width: 30 })

  const navTriggers = useMemo(() => {
    return items.filter(({ trigger }) => trigger !== undefined)
  }, [items])

  const updateIndicator = () => {
    if (!listRef.current) {
      return
    }

    const activeTab = listRef.current.querySelector<HTMLElement>('button[data-state="active"]')
    if (!activeTab) {
      return
    }

    setIndicator({ translateX: activeTab.offsetLeft, width: activeTab.clientWidth })
  }

  const handleValueChange = (value: string) => {
    injected?.setValue(value)
  }

  // update indicator when value changes or on mount
  useEffect(() => {
    updateIndicator()
  }, [injected?.value])

  return (
    <Root
      className="flex size-full grow flex-col"
      defaultValue={defaultValue ?? items[0].value}
      onValueChange={handleValueChange}
      value={injected?.value}
    >
      <List
        className="relative mb-2 flex w-full flex-row gap-2 px-2 data-[hidden=true]:hidden"
        data-hidden={navTriggers.length === 0}
        ref={listRef}
      >
        <div
          className="absolute bottom-0 left-0 z-0 size-full data-[hidden=true]:hidden"
          data-hidden={navTriggers.length === 0}
        >
          <motion.div
            animate={{
              width: indicator.width,
              x: indicator.translateX,
            }}
            className="absolute left-0 h-10 rounded-t-md border border-b-0 border-primary/30"
            initial={{
              width: indicator.width,
              x: indicator.translateX,
            }}
            transition={{
              damping: 30,
              mass: 2,
              stiffness: 300,
              type: 'spring',
            }}
          />
          <motion.div
            animate={{
              width: indicator.translateX,
            }}
            className="absolute bottom-0 left-0 h-0.5 bg-primary/30"
            initial={{
              width: indicator.translateX,
            }}
            transition={{
              damping: 30,
              mass: 2,
              stiffness: 300,
              type: 'spring',
            }}
          />
          <motion.div
            animate={{
              width: `calc(100% - ${indicator.width}px - ${indicator.translateX}px)`,
            }}
            className="absolute right-0 bottom-0 h-0.5 bg-primary/30"
            initial={{
              width: `calc(100% - ${indicator.width}px - ${indicator.translateX}px)`,
            }}
            transition={{
              damping: 30,
              mass: 2,
              stiffness: 300,
              type: 'spring',
            }}
          />
        </div>
        {navTriggers.map(({ trigger, value }) => (
          <Trigger
            asChild
            className="relative shrink-0 rounded-t-md px-4 py-2 text-gray-400 transition-colors delay-300 hover:bg-primary/10 data-[state=active]:pointer-events-none data-[state=active]:text-white"
            key={value}
            value={value}
          >
            {trigger}
          </Trigger>
        ))}
      </List>
      <AnimatePresence>
        {items.map(({ content, value }) => (
          <Content asChild key={value} value={value}>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex size-full grow flex-col overflow-y-auto"
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
