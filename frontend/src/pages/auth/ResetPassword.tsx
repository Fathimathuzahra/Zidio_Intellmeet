import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import api from '../../lib/api'

type ApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const passwordValid = password.length >= 8
  const confirmValid = confirm === password && confirm.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordValid || !confirmValid) return
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, email, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="rounded-3xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl px-7 py-10 text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Invalid Reset Link</h2>
        <p className="text-sm text-muted-foreground">This link is missing required parameters. Please request a new one.</p>
        <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          Request new link
        </Link>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 pointer-events-none" />

      <div className="relative z-10 px-7 py-8 sm:px-10 sm:py-10">
        {done ? (
          <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in duration-500">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <CheckCircle2 size={38} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Password Reset!</h2>
            <p className="text-sm text-muted-foreground">Your password has been updated. Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-7">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Set New Password</h1>
              <p className="mt-2 text-sm text-muted-foreground">For <span className="font-semibold text-foreground">{email}</span></p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full h-12 rounded-2xl border border-border bg-background/70 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className={`w-full h-12 rounded-2xl border bg-background/70 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all
                      ${confirm.length > 0 && !confirmValid ? 'border-red-400/50 focus:ring-4 focus:ring-red-500/10' : 'border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/10'}`}
                  />
                </div>
                {confirm.length > 0 && !confirmValid && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle size={12} /> Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !passwordValid || !confirmValid}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Resetting...</>
                ) : 'Reset Password'}
              </button>
            </form>

            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
