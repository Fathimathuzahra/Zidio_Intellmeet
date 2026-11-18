import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../../services/auth.service'
import { useToast } from '../../components/Toast'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'

type ApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { toast } = useToast()
  const [showPwd, setShowPwd] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [pwdMismatch, setPwdMismatch] = useState(false)

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      toast('success', 'Account created! Welcome to IntellMeet.')
      navigate('/dashboard')
    },
    onError: (error: ApiError) => {
      toast('error', error.response?.data?.message || 'Registration failed.')
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      setPwdMismatch(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setPwdMismatch(true)
      return
    }
    registerMutation.mutate({
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
    })
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
          <Shield size={12} />
          Join the workspace
        </div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Create account</h2>
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline underline-offset-4">
            Sign in
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
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Full name</label>
          <div className="relative group">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
            <input
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
              className="input-base pl-10"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Email address</label>
          <div className="relative group">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
              className="input-base pl-10"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Create Password</label>
          <div className="relative group">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
            <input
              name="password"
              type={showPwd ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              required
              className="input-base pl-12 pr-12 h-11"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Confirm Password</label>
          <div className="relative group">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
            <input
              name="confirmPassword"
              type={showPwd ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              required
              className={`input-base pl-12 h-11 transition-all ${pwdMismatch ? 'border-destructive/50 bg-destructive/5 focus:border-destructive focus:ring-destructive/10' : ''}`}
            />
          </div>
          {pwdMismatch && (
            <p className="text-xs text-destructive flex items-center gap-1.5 font-medium animate-in fade-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">!</text></svg>
              Passwords don't match
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          New accounts start as team members. Ask a workspace administrator if you need management access.
        </p>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="btn-primary w-full h-12 mt-3 text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
        >
          {registerMutation.isPending ? (
            <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Creating account...</>
          ) : (
            <>Create Account <ArrowRight size={16} /></>
          )}
        </button>
      </motion.form>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        By registering, you agree to our{' '}
        <Link to="/terms" className="font-semibold text-foreground hover:text-primary underline underline-offset-2 transition-colors">Terms of Service</Link>
        {' '}and{' '}
        <Link to="/privacy" className="font-semibold text-foreground hover:text-primary underline underline-offset-2 transition-colors">Privacy Policy</Link>.
      </p>
    </motion.div>
  )
}
