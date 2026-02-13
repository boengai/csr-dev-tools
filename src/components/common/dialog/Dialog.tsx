import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog'
import { motion } from 'motion/react'

import type { CompVariant, DialogProps, DialogVariants } from '@/types'

import { tv } from '@/utils'

const contentVariants: CompVariant<DialogVariants> = tv({
  base: 'rounded-card shadow-primary/30 fixed top-[50%] left-[50%] z-50 flex -translate-1/2 flex-col overflow-hidden border border-gray-800 bg-gray-950 shadow-[0_0_40px_12px]',
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'max-h-[90dvh] w-auto max-w-[90dvw] min-w-90',
      screen: 'tablet:h-[95dvh] tablet:w-[95dvw] tablet:rounded-card h-dvh w-dvw rounded-none',
      small: 'max-h-[90dvh] w-90 max-w-[90dvw]',
    },
  },
})

export const Dialog = ({
  children,
  description,
  injected,
  onAfterClose,
  size = 'default',
  title,
  trigger,
}: DialogProps) => {
  const contentClassName = contentVariants({ size })

  const handleOpenChange = (open: boolean) => {
    injected?.setOpen(open)
    if (!open) {
      onAfterClose?.()
    }
  }

  return (
    <Root onOpenChange={handleOpenChange} open={injected?.open}>
      {trigger && <Trigger asChild>{trigger}</Trigger>}
      <Portal>
        <Overlay asChild forceMount>
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        </Overlay>
        <Content asChild autoFocus={false} forceMount>
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={contentClassName}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="flex w-full shrink-0 items-center gap-3 border-b border-gray-800 px-4 py-2 pt-[calc(var(--safe-area-inset-top)+0.5rem)]">
              <Close asChild>
                <motion.button
                  className="bg-error size-3 shrink-0 rounded-full"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  whileHover={{ opacity: 0.8, scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="sr-only">Close</span>
                </motion.button>
              </Close>
              <Title className="text-body-sm grow truncate text-gray-400">{title}</Title>
              <Description className="hidden">{description ?? title}</Description>
            </div>
            <div className="flex size-full grow flex-col overflow-y-auto p-4 pb-[calc(var(--safe-area-inset-bottom)+1rem)]">
              {children}
            </div>
          </motion.div>
        </Content>
      </Portal>
    </Root>
  )
}
