import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import api from '../lib/api'
import { Loader2, Video } from 'lucide-react'

const AuthSuccess = () => {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const setAuth        = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { navigate('/login', { replace: true }); return }

    const fetchUser = async () => {
      try {
        const { data } = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAuth(data, token)
        navigate('/dashboard', { replace: true })
      } catch {
        navigate('/login', { replace: true })
      }
    }
    fetchUser()
  }, [searchParams, navigate, setAuth])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-5 bg-background">
      <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow">
        <Video size={22} className="text-white" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="animate-spin text-primary" size={24} />
        <p className="text-sm font-medium text-foreground">Signing you in...</p>
        <p className="text-xs text-muted-foreground">Please wait a moment.</p>
      </div>
    </div>
  )
}

export default AuthSuccess
