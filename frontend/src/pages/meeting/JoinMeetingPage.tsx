import { useParams, useNavigate } from 'react-router-dom'
import { Video, Users, ArrowRight, LogIn, UserPlus, Shield, Zap, Wifi } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

export default function JoinMeetingPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate   = useNavigate()
  const isAuth     = useAuthStore((s) => s.isAuthenticated())

  const joinNow = () => {
    if (isAuth) {
      navigate(`/meeting/${roomId}`)
    } else {
      sessionStorage.setItem('redirectAfterLogin', `/meeting/${roomId}`)
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md glow-sm">
          <Video size={16} className="text-white" />
        </div>
        <span className="font-bold text-xl text-foreground tracking-tight">IntellMeet</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md card-base overflow-hidden animate-slide-up shadow-xl">
        {/* Header */}
        <div className="gradient-primary px-6 py-8 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto animate-float">
              <Video size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">You're invited!</h1>
              <p className="text-white/70 text-sm mt-1">Join this live meeting session</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Room info */}
          <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3 border border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users size={16} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Room ID</p>
              <p className="text-sm font-mono font-semibold text-foreground truncate">{roomId}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Zap size={13} className="text-primary" />,   text: 'HD Video' },
              { icon: <Shield size={13} className="text-primary" />, text: 'Encrypted' },
              { icon: <Wifi size={13} className="text-primary" />,   text: 'Real-time' },
            ].map((f) => (
              <div key={f.text} className="flex flex-col items-center gap-1.5 bg-muted/30 rounded-xl px-3 py-2.5">
                {f.icon}
                <span className="text-[11px] text-muted-foreground font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          <button onClick={joinNow} className="btn-primary w-full h-12">
            <Video size={17} />
            Join Meeting Now
            <ArrowRight size={15} />
          </button>

          {!isAuth && (
            <div className="space-y-3 pt-1">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">or sign in first</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { sessionStorage.setItem('redirectAfterLogin', `/meeting/${roomId}`); navigate('/login') }}
                  className="btn-secondary h-10"
                >
                  <LogIn size={14} /> Sign in
                </button>
                <button
                  onClick={() => { sessionStorage.setItem('redirectAfterLogin', `/meeting/${roomId}`); navigate('/register') }}
                  className="h-10 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={14} /> Register
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                A free account is required to join meetings.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">© 2026 IntellMeet · Built with ❤️</p>
    </div>
  )
}
