import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Navigate } from '@tanstack/react-router'

import { ROUTE_PATH } from '@/constants'

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
  createRoute({
    component: lazyRouteComponent(() => import('@/pages/tool')),
    getParentRoute: () => rootRoute,
    path: `${ROUTE_PATH.TOOL}/$toolKey`,
  }),
])

export const router = createRouter({
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  routeTree,
  scrollRestoration: true,
})
