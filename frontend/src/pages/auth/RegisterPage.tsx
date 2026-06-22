import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../../services/auth.service'
import { useToast } from '../../components/Toast'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, Users } from 'lucide-react'

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
    role: 'member' as 'member' | 'admin',
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
      role: formData.role,
    })
  }

  const roles = [
    { value: 'admin', label: 'Team Manager', desc: 'Create teams, manage projects', icon: Shield },
    { value: 'member', label: 'Team Member', desc: 'Join meetings, collaborate', icon: Users },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Create account</h2>
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Role Selection */}
        <div className="space-y-3">
          <label className="text-base font-semibold text-foreground">Choose Your Role</label>
          <div className="grid grid-cols-2 gap-4">
            {roles.map(({ value, label, desc, icon: Icon }) => (
              <label
                key={value}
                className={`relative flex flex-col gap-2 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                  formData.role === value
                    ? 'border-primary bg-gradient-to-br from-primary/10 to-transparent ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={formData.role === value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  formData.role === value ? 'bg-primary/20 text-primary scale-110' : 'bg-muted/60 text-muted-foreground'
                }`}>
                  <Icon size={18} />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground block">{label}</span>
                  <span className="text-[12px] text-muted-foreground leading-snug">{desc}</span>
                </div>
                {formData.role === value && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </label>
            ))}
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
      </form>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        By registering, you agree to our{' '}
        <a href="#" className="font-semibold text-foreground hover:text-primary underline underline-offset-2 transition-colors">Terms of Service</a>
        {' '}and{' '}
        <a href="#" className="font-semibold text-foreground hover:text-primary underline underline-offset-2 transition-colors">Privacy Policy</a>.
      </p>
    </div>
  )
}
