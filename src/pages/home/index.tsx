import { motion } from 'motion/react'
import { type ComponentType, lazy, type LazyExoticComponent, Suspense } from 'react'

import type { UsePersistAppLayout } from '@/types'

import { Card, NotoEmoji, PlusIcon } from '@/components'
import { APP, APP_TITLE } from '@/constants'
import { usePersistAppLayout } from '@/hooks'

// apps
const ColorConvertor: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/color/ColorConvertor').then(({ ColorConvertor }: { ColorConvertor: ComponentType }) => ({
    default: ColorConvertor,
  })),
)
const EncodingBase64: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/encoding/EncodingBase64').then(
    ({ EncodingBase64 }: { EncodingBase64: ComponentType }) => ({
      default: EncodingBase64,
    }),
  ),
)
const ImageConvertor: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/image/ImageConvertor').then(({ ImageConvertor }: { ImageConvertor: ComponentType }) => ({
    default: ImageConvertor,
  })),
)
const ImageResize: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/image/ImageResizer').then(({ ImageResizer }: { ImageResizer: ComponentType }) => ({
    default: ImageResizer,
  })),
)
const TimeUnixTimestamp: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/time/TimeUnixTimestamp').then(
    ({ TimeUnixTimestamp }: { TimeUnixTimestamp: ComponentType }) => ({
      default: TimeUnixTimestamp,
    }),
  ),
)
const UnitPxToRem: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/feature/unit/UnitPxToRem').then(({ UnitPxToRem }: { UnitPxToRem: ComponentType }) => ({
    default: UnitPxToRem,
  })),
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
    case APP.BASE64_ENCODER:
      return (
        <Card title={APP_TITLE.BASE64_ENCODER}>
          <EncodingBase64 />
        </Card>
      )
    case APP.COLOR_CONVERTER:
      return (
        <Card title={APP_TITLE.COLOR_CONVERTER}>
          <ColorConvertor />
        </Card>
      )
    case APP.IMAGE_CONVERTOR:
      return (
        <Card title={APP_TITLE.IMAGE_CONVERTOR}>
          <ImageConvertor />
        </Card>
      )
    case APP.IMAGE_RESIZER:
      return (
        <Card title={APP_TITLE.IMAGE_RESIZER}>
          <ImageResize />
        </Card>
      )
    case APP.PX_TO_REM:
      return (
        <Card title={APP_TITLE.PX_TO_REM}>
          <UnitPxToRem />
        </Card>
      )
    case APP.UNIX_TIMESTAMP:
      return (
        <Card title={APP_TITLE.UNIX_TIMESTAMP}>
          <TimeUnixTimestamp />
        </Card>
      )
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
