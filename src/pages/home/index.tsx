import { motion } from 'motion/react'

import type { UsePersistAppLayout } from '@/types'

import { ImageConvertorCard, PlusIcon } from '@/components'
import { APP_KEY } from '@/constants'
import { usePersistAppLayout } from '@/hooks'

const AddButton = () => {
  return (
    <motion.button
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="border-3 [&>svg]:align-center flex size-full cursor-pointer items-center justify-center rounded-3xl border-dashed"
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      initial={{
        borderColor: 'var(--color-gray-800)',
        color: 'var(--color-gray-800)',
        opacity: 0,
        scale: 0.95,
        y: 10,
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{
        borderColor: 'var(--color-primary)',
        color: 'var(--color-primary)',
        transition: { duration: 0.2, ease: 'easeOut' },
        y: -4,
      }}
    >
      <PlusIcon size={120} />
    </motion.button>
  )
}

const AppContainer = ({ position }: { position: number }) => {
  const { value }: UsePersistAppLayout = usePersistAppLayout()

  switch (value[position]) {
    case APP_KEY.IMAGE_CONVERTOR:
      return <ImageConvertorCard />
    default:
      return <AddButton />
  }
}

export default function HomePage() {
  return (
    <div className="flex grow flex-wrap gap-6 p-6">
      {Array.from({ length: 6 }).map((_: unknown, idx: number) => (
        <section
          className="laptop:h-[calc(100dvh/2-2.25rem)] laptop:w-[calc(100%/3-1rem)] aspect-2/3 tablet:w-[calc(100%/2-1rem)] laptop:aspect-auto flex w-full flex-col"
          key={`${idx}`}
        >
          <AppContainer position={idx} />
        </section>
      ))}
    </div>
  )
}
