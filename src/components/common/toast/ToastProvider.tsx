import { Provider, Root, Title, Viewport } from '@radix-ui/react-toast'
import { AnimatePresence, motion } from 'motion/react'

import { useToast } from '@/hooks'
import { type CompVariant, type ToastItemProps, type ToastItemVariant, type UseToast } from '@/types'
import { tv } from '@/utils'

import { CheckIcon, XIcon } from '../icon'

const iconVariants: CompVariant<ToastItemVariant> = tv({
  base: 'rounded-full p-0.5',
  defaultVariants: {
    type: 'success',
  },
  variants: {
    type: {
      error: 'bg-error',
      success: 'bg-success',
    },
  },
})

const ToastTypeIcon = ({ type }: Pick<ToastItemProps, 'type'>) => {
  switch (type) {
    case 'error':
      return <XIcon size={12} />
    case 'success':
      return <CheckIcon size={12} />
    default:
      return <></>
  }
}

const ToastItem = ({ duration = 1500, label, type }: Omit<ToastItemProps, 'id'>) => {
  const iconClassname: string = iconVariants({ type })

  return (
    <AnimatePresence>
      <Root asChild duration={duration === 0 ? Infinity : duration}>
        <motion.li
          animate={{ opacity: 1, y: 0 }}
          className="popover text-body-sm flex w-fit items-center gap-2 rounded-sm p-2"
          exit={{ opacity: 0, y: -20 }}
          initial={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut',
            opacity: { duration: 0.15 },
          }}
        >
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.2, 1],
            }}
            className={iconClassname}
            transition={{
              duration: 0.6,
              ease: 'easeInOut',
              times: [0, 0.3, 1],
            }}
          >
            <ToastTypeIcon type={type} />
          </motion.div>
          <Title className="capitalize">{label}</Title>
        </motion.li>
      </Root>
    </AnimatePresence>
  )
}

export const ToastProvider = () => {
  const { items }: UseToast = useToast()

  return (
    <Provider>
      {items.map((item: ToastItemProps) => (
        <ToastItem key={item.id} {...item} />
      ))}
      <Viewport className="pointer-events-none fixed left-1/2 top-0 z-[999] mt-[var(--header-height)] flex w-full -translate-x-1/2 flex-col-reverse items-center gap-2 p-2 outline-none" />
    </Provider>
  )
}
