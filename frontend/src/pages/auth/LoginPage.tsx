import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../../services/auth.service'
import { useToast } from '../../components/Toast'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const { toast } = useToast()

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      toast('success', `Welcome back, ${data.user.name}!`)
      const params = new URLSearchParams(location.search)
      const next = params.get('next') || '/dashboard'
      navigate(next)
    },
    onError: () => toast('error', 'Invalid email or password.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({ email, password })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:p-7"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          <ShieldCheck size={12} />
          Secure access
        </div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground text-sm">
          Sign in with your work email and password to continue.
        </p>
        <p className="text-muted-foreground text-sm">
          New here?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Email address</label>
          <div className="relative group">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="input-base pl-10"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline underline-offset-4 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input-base pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="btn-primary w-full h-11 mt-2"
        >
          {loginMutation.isPending ? (
            <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Signing in...</>
          ) : (
            <>Sign in <ArrowRight size={15} /></>
          )}
        </button>
      </motion.form>
    </motion.div>
  )
}
