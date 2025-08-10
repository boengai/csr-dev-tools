import { motion } from 'motion/react'
import { type ComponentType, lazy, type LazyExoticComponent, Suspense } from 'react'

import type { UsePersistAppLayout } from '@/types'

import { NotoEmoji, PlusIcon } from '@/components'
import { APP_KEY } from '@/constants'
import { usePersistAppLayout } from '@/hooks'

// apps
const ColorConverterCard: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/color/card/ColorConvertorCard').then(
    ({ ColorConvertorCard }: { ColorConvertorCard: ComponentType }) => ({
      default: ColorConvertorCard,
    }),
  ),
)
const ImageConvertorCard: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/image/card/ImageConvertorCard').then(
    ({ ImageConvertorCard }: { ImageConvertorCard: ComponentType }) => ({
      default: ImageConvertorCard,
    }),
  ),
)
const UnitPxToRemCard: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/unit/card/UnitPxToRemCard').then(
    ({ UnitPxToRemCard }: { UnitPxToRemCard: ComponentType }) => ({
      default: UnitPxToRemCard,
    }),
  ),
)
const UnixTimestampCard: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/time/card/UnixTimestampCard').then(
    ({ UnixTimestampCard }: { UnixTimestampCard: ComponentType }) => ({
      default: UnixTimestampCard,
    }),
  ),
)

const AddButton = () => {
  return (
    <motion.button
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="border-3 [&>svg]:align-center flex size-full items-center justify-center rounded-xl border-dashed"
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
    case APP_KEY.COLOR_CONVERTER:
      return <ColorConverterCard />
    case APP_KEY.IMAGE_CONVERTOR:
      return <ImageConvertorCard />
    case APP_KEY.PX_TO_REM:
      return <UnitPxToRemCard />
    case APP_KEY.UNIX_TIMESTAMP:
      return <UnixTimestampCard />
    default:
      return <AddButton />
  }
}

const AppLoading = () => {
  return (
    <div className="bg-primary/10 flex grow flex-col items-center justify-center rounded-xl">
      <NotoEmoji emoji="robot" size={120} />
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="flex grow flex-wrap gap-6 p-6">
      {Array.from({ length: 6 }).map((_: unknown, idx: number) => (
        <section
          className="laptop:h-[calc(100dvh/2-2.25rem)] laptop:w-[calc(100%/3-1rem)] aspect-2/3 tablet:w-[calc(100%/2-1rem)] laptop:aspect-auto flex w-full flex-col"
          key={`${idx}`}
        >
          <Suspense fallback={<AppLoading />}>
            <AppContainer position={idx} />
          </Suspense>
        </section>
      ))}
    </div>
  )
}
