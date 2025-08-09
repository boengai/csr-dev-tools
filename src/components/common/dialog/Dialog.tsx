import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import type { CompVariant, DialogProps, DialogVariants } from '@/types'

import { tv } from '@/utils'

import { XIcon } from '../icon'

const contentVariants: CompVariant<DialogVariants> = tv({
  base: 'shadow-primary/30 popover fixed left-[50%] top-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 p-4 shadow-[0_0_40px_12px]',
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'max-h-[90dvh] w-auto max-w-[90dvw]',
      screen: 'max-h-[90dvh] w-[90dvw]',
      small: 'max-h-[90dvh] w-[350px] max-w-[90dvw]',
    },
  },
})

export const Dialog = ({ children, description, size = 'default', title, trigger }: DialogProps) => {
  const [open, setOpen]: [boolean, (value: boolean) => void] = useState<boolean>(false)
  const [shouldRender, setShouldRender]: [boolean, (value: boolean) => void] = useState<boolean>(false)
  const cn: string = contentVariants({ size })

  useEffect(() => {
    if (open) {
      setShouldRender(true)
    }
  }, [open])

  const handleExitComplete = (): void => {
    if (!open) {
      setShouldRender(false)
    }
  }

  return (
    <Root onOpenChange={setOpen} open={open}>
      {trigger && <Trigger asChild>{trigger}</Trigger>}
      {shouldRender && (
        <Portal>
          <AnimatePresence onExitComplete={handleExitComplete}>
            {open && (
              <Overlay asChild forceMount>
                <motion.div
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              </Overlay>
            )}
          </AnimatePresence>
          <AnimatePresence onExitComplete={handleExitComplete}>
            {open && (
              <Content asChild autoFocus={false} forceMount>
                <motion.div
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Title className="hidden">{title}</Title>
                  <Description className="hidden">{description}</Description>
                  <Close className="hover:bg-primary absolute right-4 top-4 cursor-pointer rounded-full p-1 text-gray-800 transition-colors hover:text-white focus:outline-none disabled:pointer-events-none">
                    <span className="sr-only">Close</span>
                    <XIcon size={20} />
                  </Close>
                  {children}
                </motion.div>
              </Content>
            )}
          </AnimatePresence>
        </Portal>
      )}
    </Root>
  )
}
