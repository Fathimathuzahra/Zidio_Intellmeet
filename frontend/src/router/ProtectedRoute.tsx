import { useMemo } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()

  const guestUser = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = sessionStorage.getItem('guestUser')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  if (!token) {
    const allowGuest = guestUser && location.pathname.startsWith('/meeting/')
    if (allowGuest) {
      return <Outlet />
    }
    return <Navigate to="/login" replace />
  }

  const redirect = sessionStorage.getItem('redirectAfterLogin')
  if (redirect) {
    sessionStorage.removeItem('redirectAfterLogin')
    return <Navigate to={redirect} replace />
  }

  return <Outlet />
}
