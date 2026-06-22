import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  const acceptMutation  = useAcceptInvitation()
  const { toast }       = useToast()
  const user            = useAuthStore((state) => state.user)

  const redirectPath = user?.role === 'admin' ? '/teams' : '/my-teams'

  useEffect(() => {
    if (!token) {
      toast('error', 'Invalid invitation link')
      navigate('/meetings')
      return
    }
    acceptMutation.mutate(token, {
      onSuccess: () => {
        toast('success', 'You have successfully joined the team! 🎉')
        setTimeout(() => navigate(redirectPath), 1500)
      },
      onError: (error) => {
        const apiError = error as ApiError
        toast('error', apiError.response?.data?.message || 'Invalid or expired invitation link')
        setTimeout(() => navigate(redirectPath), 2000)
      },
    })
  }, [token])

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
          </div>
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
            <h2 className="text-lg font-bold text-foreground">Welcome to the team! 🎉</h2>
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
