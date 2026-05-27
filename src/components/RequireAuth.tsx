import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store'

export function RequireAuth() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <span className="text-sm text-text-muted">Loading...</span>
        </div>
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
