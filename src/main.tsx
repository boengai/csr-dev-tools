import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { router } from './routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 3_600_000, // 1 hour
      retry: false,
      staleTime: 60_000, // 1 minute
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
