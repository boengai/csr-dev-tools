import { motion } from 'motion/react'
import { type ButtonHTMLAttributes, type ComponentType, lazy, Suspense, useState } from 'react'

import type { FeatureKey } from '@/types'

import { Card, Dialog, NotoEmoji, PlusIcon } from '@/components'
import { FEATURE_TITLE } from '@/constants'
import { usePersistFeatureLayout } from '@/hooks'

// apps
const ColorConvertor = lazy(() =>
  import('@/components/feature/color/ColorConvertor').then(({ ColorConvertor }: { ColorConvertor: ComponentType }) => ({
    default: ColorConvertor,
  })),
)
const EncodingBase64 = lazy(() =>
  import('@/components/feature/encoding/EncodingBase64').then(
    ({ EncodingBase64 }: { EncodingBase64: ComponentType }) => ({
      default: EncodingBase64,
    }),
  ),
)
const ImageConvertor = lazy(() =>
  import('@/components/feature/image/ImageConvertor').then(({ ImageConvertor }: { ImageConvertor: ComponentType }) => ({
    default: ImageConvertor,
  })),
)
const ImageResize = lazy(() =>
  import('@/components/feature/image/ImageResizer').then(({ ImageResizer }: { ImageResizer: ComponentType }) => ({
    default: ImageResizer,
  })),
)
const TimeUnixTimestamp = lazy(() =>
  import('@/components/feature/time/TimeUnixTimestamp').then(
    ({ TimeUnixTimestamp }: { TimeUnixTimestamp: ComponentType }) => ({
      default: TimeUnixTimestamp,
    }),
  ),
)
const UnitPxToRem = lazy(() =>
  import('@/components/feature/unit/UnitPxToRem').then(({ UnitPxToRem }: { UnitPxToRem: ComponentType }) => ({
    default: UnitPxToRem,
  })),
)

const AddButton = ({ onClick }: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) => {
  return (
    <motion.button
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="[&>svg]:align-center flex size-full items-center justify-center rounded-xl border-3 border-dashed"
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      initial={{
        borderColor: 'var(--color-gray-800)',
        color: 'var(--color-gray-800)',
        opacity: 0,
        scale: 0.95,
        y: 10,
      }}
      onClick={onClick}
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

const AppContainer = ({ onOpenDialog, position }: { onOpenDialog: (position: number) => void; position: number }) => {
  //hook
  const { setter, value } = usePersistFeatureLayout()

  const handleClose = () => {
    setter(position, null)
  }

  switch (value[position]) {
    case 'BASE64_ENCODER':
      return (
        <Card onClose={handleClose} title={FEATURE_TITLE.BASE64_ENCODER}>
          <EncodingBase64 />
        </Card>
      )
    case 'COLOR_CONVERTER':
      return (
        <Card onClose={handleClose} title={FEATURE_TITLE.COLOR_CONVERTER}>
          <ColorConvertor />
        </Card>
      )
    case 'IMAGE_CONVERTOR':
      return (
        <Card onClose={handleClose} title={FEATURE_TITLE.IMAGE_CONVERTOR}>
          <ImageConvertor />
        </Card>
      )
    case 'IMAGE_RESIZER':
      return (
        <Card onClose={handleClose} title={FEATURE_TITLE.IMAGE_RESIZER}>
          <ImageResize />
        </Card>
      )
    case 'PX_TO_REM':
      return (
        <Card onClose={handleClose} title={FEATURE_TITLE.PX_TO_REM}>
          <UnitPxToRem />
        </Card>
      )
    case 'UNIX_TIMESTAMP':
      return (
        <Card onClose={handleClose} title={FEATURE_TITLE.UNIX_TIMESTAMP}>
          <TimeUnixTimestamp />
        </Card>
      )
    default:
      return <AddButton onClick={() => onOpenDialog(position)} />
  }
}

const AppLoading = () => {
  return (
    <div className="bg-primary/10 flex grow flex-col items-center justify-center rounded-xl">
      <NotoEmoji emoji="robot" size={120} />
    </div>
  )
}

const SelectAppDialog = ({ onDismiss, position }: { onDismiss: () => void; position: null | number }) => {
  //hook
  const { setter, value } = usePersistFeatureLayout()

  const appPosition = Object.entries(value).reduce((acc: Record<string, number>, cur) => {
    if (cur[1] !== null) {
      acc[cur[1]] = Number(cur[0])
    }
    return acc
  }, {})

  const list = Object.keys(FEATURE_TITLE).map((value) => ({
    at: appPosition[value] ?? null,
    value,
  }))

  const handleSelectApp = (value: string) => {
    if (position !== null) {
      setter(position, value as FeatureKey)
      onDismiss()
    }
  }

  return (
    <Dialog
      injected={{ open: position !== null, setOpen: onDismiss }}
      title={`Select App for Widget#${position ? position + 1 : ''}`}
    >
      <ul className="flex flex-col gap-2">
        {list.map(({ at, value }) => (
          <li key={value}>
            <button
              className="hover:bg-primary/30 flex w-full cursor-pointer items-center justify-between rounded p-2 text-left disabled:pointer-events-none disabled:opacity-50"
              disabled={at !== null}
              onClick={() => handleSelectApp(value)}
            >
              <span>{FEATURE_TITLE[value as FeatureKey]}</span>
              {at !== null && <span className="bg-secondary rounded px-1 text-xs text-white">#{at + 1}</span>}
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}

export default function HomePage() {
  const [selectedWidget, setSelectedWidget] = useState<null | number>(null)

  const handleCloseDialog = () => {
    setSelectedWidget(null)
  }

  return (
    <>
      <div className="flex grow flex-wrap gap-6 p-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <section
            className="tablet:w-[calc(100%/2-1rem)] laptop:aspect-auto laptop:h-[calc(100dvh/2-2.25rem)] laptop:w-[calc(100%/3-1rem)] flex aspect-2/3 w-full flex-col"
            key={`${idx}`}
          >
            <Suspense fallback={<AppLoading />}>
              <AppContainer onOpenDialog={setSelectedWidget} position={idx} />
            </Suspense>
          </section>
        ))}
      </div>
      <SelectAppDialog onDismiss={handleCloseDialog} position={selectedWidget} />
    </>
  )
}
