import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog'
import { motion } from 'motion/react'

import type { CompVariant, DialogProps, DialogVariants } from '@/types'

import { tv } from '@/utils'

import { XIcon } from '../icon'

const contentVariants: CompVariant<DialogVariants> = tv({
  base: 'shadow-primary/30 -translate-1/2 fixed left-[50%] top-[50%] z-50 flex flex-col shadow-[0_0_40px_12px]',
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'min-w-90 max-h-[90dvh] w-auto max-w-[90dvw]',
      screen: 'tablet:h-[95dvh] tablet:w-[95dvw] h-screen w-screen',
      small: 'w-90 max-h-[90dvh] max-w-[90dvw]',
    },
  },
})

const contentHeaderVariants: CompVariant<DialogVariants> = tv({
  base: 'text-heading-5 relative w-full shrink-0 rounded-none bg-gray-800 px-5 py-2 pr-14 pt-[calc(var(--safe-area-inset-top)+0.5rem)]',
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'rounded-t-xl',
      screen: 'tablet:rounded-t-xl',
      small: 'rounded-t-xl',
    },
  },
})

const contentBodyVariants: CompVariant<DialogVariants> = tv({
  base: 'flex size-full grow flex-col overflow-y-auto border border-gray-800 bg-white/5 p-6 pb-[calc(var(--safe-area-inset-bottom)+1.5rem)] backdrop-blur',
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'rounded-b-xl',
      screen: 'tablet:rounded-b-xl',
      small: 'rounded-b-xl',
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
  const contentClassName: string = contentVariants({ size })
  const contentHeaderClassName: string = contentHeaderVariants({ size })
  const contentBodyClassName: string = contentBodyVariants({ size })

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
            <div className={contentHeaderClassName}>
              <Title className="text-heading-5 grow truncate">{title}</Title>
              <Description className="hidden">{description && title}</Description>
              <Close asChild>
                <motion.button
                  className="bg-error absolute right-4 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-full"
                  initial={{ color: 'var(--color-error)', scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  whileHover={{ color: 'var(--color-white)' }}
                  whileTap={{
                    scale: 0.98,
                    transition: { duration: 0.1, ease: 'easeOut' },
                  }}
                >
                  <span className="sr-only">Close</span>
                  <XIcon size={12} />
                </motion.button>
              </Close>
            </div>
            <div className={contentBodyClassName}>{children}</div>
          </motion.div>
        </Content>
      </Portal>
    </Root>
  )
}
