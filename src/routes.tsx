/* eslint-disable @typescript-eslint/typedef */
import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Navigate } from '@tanstack/react-router'

import { ROUTE_PATH } from './constants/route'

const rootRoute = createRootRoute({
  component: lazyRouteComponent(() => import('@/App')),
  notFoundComponent: () => <Navigate to={ROUTE_PATH.HOME} />,
})

const routeTree = rootRoute.addChildren([
  createRoute({
    component: lazyRouteComponent(() => import('@/pages/home')),
    getParentRoute: () => rootRoute,
    path: ROUTE_PATH.HOME,
  }),
  createRoute({
    component: lazyRouteComponent(() => import('@/pages/showcase')),
    getParentRoute: () => rootRoute,
    path: ROUTE_PATH.SHOWCASE,
  }),
])

export const router = createRouter({
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  routeTree,
  scrollRestoration: true,
})
