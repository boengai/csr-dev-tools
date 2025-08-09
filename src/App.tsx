import { type ComponentType, lazy, type LazyExoticComponent } from 'react'
import { Outlet, Route, Routes } from 'react-router'

// pages
const HomePage: LazyExoticComponent<ComponentType> = lazy(() => import('@/pages/home'))
const ShowcasePage: LazyExoticComponent<ComponentType> = lazy(() => import('@/pages/showcase'))

// components
const TwinkleStarsAnimate: LazyExoticComponent<ComponentType> = lazy(() =>
  import('@/components/common/animate/TwinkleStarsAnimate').then(
    ({ TwinkleStarsAnimate }: { TwinkleStarsAnimate: ComponentType }) => ({
      default: TwinkleStarsAnimate,
    }),
  ),
)

const Wrapper = () => {
  return (
    <main className="bg-size-[16px_16px] relative flex grow flex-col bg-[linear-gradient(45deg,transparent,oklch(1_0_0_/_0.03))] pb-[var(--safe-area-inset-bottom)] pt-[var(--safe-area-inset-top)] [&>*:not(:first-child)]:relative">
      <TwinkleStarsAnimate />
      <Outlet />
    </main>
  )
}

export const App = () => {
  return (
    <Routes>
      <Route element={<Wrapper />} path="/">
        <Route element={<ShowcasePage />} path="/showcase" />
        <Route element={<HomePage />} path="/" />
      </Route>
    </Routes>
  )
}
