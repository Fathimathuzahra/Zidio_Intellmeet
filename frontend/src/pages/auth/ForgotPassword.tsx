import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import api from '../../lib/api'

type ApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState('')

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((p) => p - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sendRequest = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
      setCooldown(60)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!emailValid) return
    sendRequest()
  }

  const handleResend = () => {
    if (cooldown > 0 || loading) return
    sendRequest()
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 pointer-events-none" />

      <div className="relative z-10 px-7 py-8 sm:px-10 sm:py-10">
        {!submitted ? (
          <div className="space-y-7">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                <ShieldCheck size={16} /> Secure Password Recovery
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Forgot Password?</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-sm">
                  Enter your email and we'll send you a secure reset link instantly.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email Address</label>
                <div className="relative group">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="you@example.com"
                    className={`w-full h-12 rounded-2xl border bg-background/70 pl-12 pr-4 text-sm text-blue-600 placeholder:text-muted-foreground outline-none transition-all duration-300
                      ${touched && !emailValid
                        ? 'border-red-400/50 bg-red-500/5 focus:ring-4 focus:ring-red-500/10'
                        : 'border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/10'
                      }`}
                  />
                </div>
                {touched && !emailValid && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in duration-200">
                    <AlertCircle size={12} /> Please enter a valid email address.
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Sending...</>
                ) : (
                  <><Send size={15} /> Send Reset Link</>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center pt-1">
              <Link to="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-7 animate-in fade-in duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <CheckCircle2 size={38} className="text-emerald-500" />
              </div>
              <div className="mt-5 space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Check Your Inbox</h2>
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">We sent a secure password reset link to</p>
                <div className="inline-flex rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-semibold text-foreground">
                  {email}
                </div>
                <p className="text-xs text-muted-foreground">The link will expire in 15 minutes.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground">Didn't receive the email?</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Check your spam or promotions folder, or verify you entered the correct email address.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background/60 text-sm font-medium text-foreground transition-all duration-300 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" /> Resending...</>
                ) : cooldown > 0 ? (
                  `Resend available in ${cooldown}s`
                ) : (
                  'Resend Email'
                )}
              </button>

              <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
