import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'

const GamePage = lazy(() => import('@/pages/GamePage').then((m) => ({ default: m.GamePage })))
const ResultsPage = lazy(() => import('@/pages/ResultsPage').then((m) => ({ default: m.ResultsPage })))

function PageFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-surface-primary">
      <span className="font-mono text-xs text-text-muted animate-pulse">Loading…</span>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <Suspense fallback={<PageFallback />}><GamePage /></Suspense>,
      },
      {
        path: '/results/:sessionId',
        element: <Suspense fallback={<PageFallback />}><ResultsPage /></Suspense>,
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
