import { Outlet } from '@tanstack/react-router'
import { type ComponentType, lazy, Suspense } from 'react'

import { NotoEmoji, ToastProvider } from '@/components'

// components
const TwinkleStarsAnimate = lazy(() =>
  import('@/components/common/animate/TwinkleStarsAnimate').then(
    ({ TwinkleStarsAnimate }: { TwinkleStarsAnimate: ComponentType }) => ({
      default: TwinkleStarsAnimate,
    }),
  ),
)

const PageLoading = () => {
  return (
    <div className="bg-primary/10 flex grow flex-col items-center justify-center rounded-xl">
      <NotoEmoji emoji="flying-saucer" size={200} />
    </div>
  )
}

export default function App() {
  return (
    <>
      <main className="bg-pixel-texture relative flex grow flex-col pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)] [&>*:not(:first-child)]:relative">
        <Suspense fallback={<></>}>
          <TwinkleStarsAnimate />
        </Suspense>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <ToastProvider />
    </>
  )
}
