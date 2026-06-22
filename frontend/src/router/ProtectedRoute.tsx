import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.accessToken)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const redirect = sessionStorage.getItem('redirectAfterLogin')
  if (redirect) {
    sessionStorage.removeItem('redirectAfterLogin')
    return <Navigate to={redirect} replace />
  }

  return <Outlet />
}
