import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog'
import { AnimatePresence, m } from 'motion/react'
import { useRef } from 'react'

import type { CompVariant, DialogProps, DialogVariants } from '@/types'
import { tv } from '@/utils'

import { XIcon } from '../icon'
import { useReturnFocus } from './useReturnFocus'

const contentVariants: CompVariant<DialogVariants> = tv({
  base: 'fixed top-[50%] left-[50%] z-50 flex -translate-1/2 flex-col overflow-hidden rounded-card border border-gray-800 bg-gray-900 shadow-[0_0_40px_12px] shadow-primary/30 outline-none',
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'max-h-[90dvh] w-auto max-w-[90dvw] min-w-90',
      screen: 'h-dvh w-dvw rounded-none tablet:h-[95dvh] tablet:w-[95dvw] tablet:rounded-card',
      small: 'max-h-[90dvh] w-90 max-w-[90dvw]',
    },
  },
})

export const Dialog = ({
  children,
  description,
  onAfterClose,
  onOpenChange,
  open,
  size = 'default',
  title,
  trigger,
}: DialogProps) => {
  const contentClassName = contentVariants({ size })
  const contentRef = useRef<HTMLDivElement>(null)
  // Armed only by a Radix-initiated close (Escape / overlay / close button) —
  // a parent flipping `open` itself does not fire `onAfterClose`.
  // Consumed after the exit animation so content doesn't flash empty mid-fade.
  const afterClosePendingRef = useRef(false)
  const { capture, handleCloseAutoFocus } = useReturnFocus()

  const handleOpenChange = (next: boolean) => {
    afterClosePendingRef.current = !next
    onOpenChange(next)
  }

  const handleExitComplete = () => {
    if (!afterClosePendingRef.current) return
    afterClosePendingRef.current = false
    onAfterClose?.()
  }

  const handleOpenAutoFocus = (event: Event) => {
    // Move focus into the dialog, but onto the container rather than the
    // first tabbable (the close dot). Respect a child that already
    // claimed focus via `autoFocus`.
    event.preventDefault()
    const content = contentRef.current
    capture(content)
    if (content && !content.contains(document.activeElement)) {
      content.focus({ preventScroll: true })
    }
  }

  return (
    <Root onOpenChange={handleOpenChange} open={open}>
      {trigger && <Trigger asChild>{trigger}</Trigger>}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {open && (
          <Portal forceMount>
            <Overlay asChild>
              <m.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </Overlay>
            <Content asChild onCloseAutoFocus={handleCloseAutoFocus} onOpenAutoFocus={handleOpenAutoFocus}>
              <m.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={contentClassName}
                ref={contentRef}
                tabIndex={-1}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="flex w-full shrink-0 items-center gap-3 border-b border-gray-800 px-4 py-2 pt-[calc(var(--safe-area-inset-top)+0.5rem)]">
                  <Close asChild>
                    <m.button
                      aria-label="Close dialog"
                      className="group relative size-3 shrink-0 rounded-full bg-error outline-none before:absolute before:inset-[-12px] before:content-[''] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                      title="Close"
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                      >
                        <XIcon size={10} />
                      </span>
                    </m.button>
                  </Close>
                  <Title className="grow truncate text-body-sm text-gray-400">{title}</Title>
                  <Description className="hidden">{description ?? title}</Description>
                </div>
                <div className="flex size-full grow flex-col overflow-y-auto p-4 pb-[calc(var(--safe-area-inset-bottom)+1rem)]">
                  {children}
                </div>
              </m.div>
            </Content>
          </Portal>
        )}
      </AnimatePresence>
    </Root>
  )
}
