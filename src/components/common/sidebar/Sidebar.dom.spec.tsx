/**
 * @vitest-environment jsdom
 */
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { domAnimation, LazyMotion } from 'motion/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { TOOL_REGISTRY } from '@/constants'
import { useSidebarStore } from '@/hooks'
import { nth } from '@/test/nth'

import { Sidebar } from './Sidebar'

const firstTool = nth(TOOL_REGISTRY, 0)

beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ addEventListener() {}, matches: false, removeEventListener() {} })),
  )
})

afterEach(() => {
  act(() => useSidebarStore.getState().close())
})

const renderAt = async (path: string) => {
  const rootRoute = createRootRoute({
    component: () => (
      <LazyMotion features={domAnimation}>
        <Sidebar />
        <Outlet />
      </LazyMotion>
    ),
  })
  const catchAll = createRoute({ getParentRoute: () => rootRoute, path: '$', component: () => null })
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [path] }),
    routeTree: rootRoute.addChildren([catchAll]),
  })
  render(<RouterProvider router={router} />)
  await act(() => router.load())
  return router
}

describe('Sidebar', () => {
  it('renders tools as real links with aria-current on the active route', async () => {
    await renderAt(firstTool.routePath)
    act(() => useSidebarStore.getState().open())

    const link = await screen.findByRole('link', { name: new RegExp(firstTool.name) })
    expect(link).toHaveAttribute('href', firstTool.routePath)
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Home/ })).not.toHaveAttribute('aria-current')
  })

  it('is a modal dialog that moves focus inside and closes on Escape', async () => {
    await renderAt('/')
    act(() => useSidebarStore.getState().open())

    const dialog = await screen.findByRole('dialog', { name: 'Tool navigation' })
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))

    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape' })
    expect(useSidebarStore.getState().isOpen).toBe(false)
  })

  it('returns focus to the element that opened it', async () => {
    await renderAt('/')
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()

    act(() => useSidebarStore.getState().open())
    const dialog = await screen.findByRole('dialog', { name: 'Tool navigation' })
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))

    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape' })

    await waitFor(() => expect(document.activeElement).toBe(opener))
    opener.remove()
  })

  it('closes after a plain click on a tool link', async () => {
    await renderAt('/')
    act(() => useSidebarStore.getState().open())

    fireEvent.click(await screen.findByRole('link', { name: new RegExp(firstTool.name) }))
    expect(useSidebarStore.getState().isOpen).toBe(false)
  })
})
