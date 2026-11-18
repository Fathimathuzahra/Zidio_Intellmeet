import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAcceptInvitation } from '../hooks/use-team'
import { Loader2, CheckCircle2, XCircle, Users } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useAuthStore } from '@/store/useAuthStore'

type ApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
}

export default function AcceptInvitationPage() {
  const { token }       = useParams()
  const navigate        = useNavigate()
  const location        = useLocation()
  const acceptMutation  = useAcceptInvitation()
  const { toast }       = useToast()
  const user            = useAuthStore((state) => state.user)
  const hasSubmitted    = useRef(false)
  const [longPending, setLongPending] = useState(false)
  const retryRef = useRef(0)

  const redirectPath = user?.role === 'admin' ? '/teams' : '/my-teams'

  useEffect(() => {
    if (hasSubmitted.current) return
    hasSubmitted.current = true

    if (!token) {
      toast('error', 'Invalid invitation link')
      navigate('/meetings')
      return
    }
    // If not signed in, send to login and preserve path so token can be handled after auth
    if (!user) {
      const next = encodeURIComponent(location.pathname)
      navigate(`/login?next=${next}`)
      return
    }
    acceptMutation.mutate(token, {
      onSuccess: () => {
        setLongPending(false)
        toast('success', 'You have successfully joined the team!')
        setTimeout(() => navigate(redirectPath), 1500)
      },
      onError: (error) => {
        setLongPending(false)
        const apiError = error as ApiError
        toast('error', apiError.response?.data?.message || 'Invalid or expired invitation link')
        setTimeout(() => navigate(redirectPath), 2000)
      },
    })
  }, [acceptMutation, location.pathname, navigate, redirectPath, toast, token, user])

  // Show a helpful message if the accept request is taking too long
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
    if (acceptMutation.isPending) {
      t = setTimeout(() => {
        setLongPending(true)
      }, 12000)
    }

    return () => {
      if (t) clearTimeout(t)
    }
  }, [acceptMutation.isPending])

  const base = 'min-h-screen bg-background flex items-center justify-center p-4'

  if (acceptMutation.isPending) {
    return (
      <div className={base}>
        <div className="card-base p-10 text-center max-w-sm w-full shadow-xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Users size={26} className="text-primary" />
          </div>
          <Loader2 className="animate-spin text-primary mx-auto" size={28} />
          <div>
            <h2 className="text-lg font-bold text-foreground">Processing Invitation</h2>
            <p className="text-sm text-muted-foreground mt-1">Please wait, joining the team...</p>
            {longPending && (
              <p className="text-sm text-muted-foreground mt-2">This is taking longer than expected. You can retry or go to login.</p>
            )}
          </div>
          {longPending && (
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={() => {
                  retryRef.current += 1
                  hasSubmitted.current = false
                  acceptMutation.reset()
                  setLongPending(false)
                  // re-run effect
                  window.location.reload()
                }}
                className="btn-secondary"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (acceptMutation.isError) {
    return (
      <div className={base}>
        <div className="card-base border-destructive/30 p-10 text-center max-w-sm w-full shadow-xl space-y-5">
          <XCircle className="w-14 h-14 text-destructive mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-foreground">Invitation Failed</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {(acceptMutation.error as ApiError)?.response?.data?.message || 'This link is invalid or has expired.'}
            </p>
          </div>
          <button onClick={() => navigate(redirectPath)} className="btn-secondary w-full">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (acceptMutation.isSuccess) {
    return (
      <div className={base}>
        <div className="card-base border-emerald-500/30 p-10 text-center max-w-sm w-full shadow-xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-emerald-500" size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Welcome to the team!</h2>
            <p className="text-sm text-muted-foreground mt-1">You've successfully joined. Redirecting...</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-primary rounded-full animate-[grow_1.5s_ease-out_forwards]" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    )
  }

  return null
}
