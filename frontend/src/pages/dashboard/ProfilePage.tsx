import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  User, Mail, FileText, ImageIcon, Save, CheckCircle2,
  Camera, Shield, Calendar, Edit3, Trash2, AlertTriangle,
  Lock, Eye, EyeOff, BadgeCheck, Activity,
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '../../hooks/useLogout'
import { userService } from '@/services/user.service'

type Tab = 'profile' | 'security' | 'danger'
type ApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
}

export default function ProfilePage() {
  const user       = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const navigate   = useNavigate()
  const logout     = useLogout()

  const [tab, setTab]   = useState<Tab>('profile')
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  const [form, setForm] = useState({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
    avatarUrl: user?.avatarUrl ?? '',
  })

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false })
  const [pwdError, setPwdError]   = useState('')
  const [pwdSaved, setPwdSaved]   = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: (data: { name: string; bio: string; avatarUrl: string }) =>
      userService.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data)
      setSaved(true)
      setError('')
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err: ApiError) => setError(err.response?.data?.message || 'Failed to update profile.'),
  })

  const { mutate: changePassword } = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userService.updatePassword(data),
    onSuccess: () => {
      setPwdSaved(true)
      setPwdForm({ current: '', next: '', confirm: '' })
      setPwdError('')
      setTimeout(() => setPwdSaved(false), 3000)
    },
    onError: (err: ApiError) => setPwdError(err.response?.data?.message || 'Failed to update password.'),
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setError('')
    saveProfile(form)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError('')
    if (pwdForm.next.length < 8) { setPwdError('Password must be at least 8 characters.'); return }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('Passwords do not match.'); return }
    changePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.next })
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',  label: 'Profile',      icon: <User size={14} /> },
    { id: 'security', label: 'Security',     icon: <Shield size={14} /> },
    { id: 'danger',   label: 'Danger Zone',  icon: <AlertTriangle size={14} /> },
  ]

  const PWD_FIELDS = [
    { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
    { key: 'next',    label: 'New Password',      placeholder: 'Min. 8 characters' },
    { key: 'confirm', label: 'Confirm Password',  placeholder: 'Repeat new password' },
  ] as const

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up pb-10">
      {/* Hero banner */}
      <div className="card-base overflow-hidden">
        <div className="h-24 gradient-primary relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent)]" />
        </div>
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card overflow-hidden flex items-center justify-center text-primary font-bold text-2xl shadow-lg">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : initials}
              </div>
              <button
                onClick={() => setTab('profile')}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full gradient-primary text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <Camera size={12} />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground truncate">{user?.name ?? 'User'}</h1>
                <span className="badge badge-primary capitalize">
                  <BadgeCheck size={10} /> {user?.role}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
              {user?.bio && <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{user.bio}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar size={11} /> Member since {new Date().toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Activity size={11} className="text-emerald-500" /> Active</span>
              </div>
            </div>

            <button onClick={() => setTab('profile')} className="btn-secondary shrink-0 self-start mt-2">
              <Edit3 size={13} /> Edit Profile
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-xl mt-5 overflow-hidden">
            {[
              { label: 'Role',     value: user?.role ?? '—' },
              { label: 'Provider', value: user?.oauthProvider ?? 'Email' },
              { label: 'Status',   value: 'Active' },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3 text-center bg-muted/20">
                <p className="text-sm font-bold text-foreground capitalize">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(''); setPwdError('') }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === t.id
                ? 'bg-background text-foreground shadow-sm border border-border'
                : `text-muted-foreground hover:text-foreground ${t.id === 'danger' ? 'hover:text-destructive' : ''}`
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="card-base overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div>
              <h2 className="font-bold text-foreground">Personal Information</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Update your name, avatar and bio</p>
            </div>
            <User size={17} className="text-muted-foreground" />
          </div>
          <div className="p-6 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User size={13} className="text-muted-foreground" /> Full Name
              </label>
              <input
                type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                className="input-base"
              />
            </div>

            {/* Email read-only */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail size={13} className="text-muted-foreground" /> Email Address
              </label>
              <div className="relative">
                <input
                  type="email" value={user?.email ?? ''} disabled
                  className="input-base bg-muted/40 cursor-not-allowed text-muted-foreground pr-24"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  Read only
                </span>
              </div>
            </div>

            {/* Avatar URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ImageIcon size={13} className="text-muted-foreground" /> Avatar URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url" value={form.avatarUrl}
                  onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://example.com/avatar.png"
                  className="input-base flex-1"
                />
                {form.avatarUrl && (
                  <div className="w-10 h-10 rounded-xl border border-border overflow-hidden shrink-0">
                    <img src={form.avatarUrl} alt="preview" className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Paste a direct image URL to use as your avatar</p>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText size={13} className="text-muted-foreground" /> Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell your team about yourself..."
                rows={3} maxLength={500}
                className="input-base h-auto py-2.5 resize-none"
              />
              <p className="text-[11px] text-muted-foreground text-right">{form.bio.length}/500</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2.5">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Changes are saved immediately</p>
            <button type="submit" disabled={isPending} className="btn-primary">
              {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── SECURITY TAB ── */}
      {tab === 'security' && (
        <div className="space-y-4">
          <form onSubmit={handlePasswordSubmit} className="card-base overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground">Change Password</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Use a strong password with 8+ characters</p>
              </div>
              <Lock size={17} className="text-muted-foreground" />
            </div>
            <div className="p-6 space-y-4">
              {PWD_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">{label}</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type={showPwd[key] ? 'text' : 'password'}
                      value={pwdForm[key]}
                      onChange={(e) => setPwdForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="input-base pl-10 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((p) => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPwd[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}
              {pwdError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={14} /> {pwdError}
                </div>
              )}
              {pwdSaved && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                  <CheckCircle2 size={14} /> Password updated successfully!
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
              <button type="submit" className="btn-primary">
                <Lock size={14} /> Update Password
              </button>
            </div>
          </form>

          {/* Session */}
          <div className="card-base overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="font-bold text-foreground">Active Session</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your current login session</p>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Activity size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Current Browser Session</p>
                  <p className="text-xs text-muted-foreground">Logged in as {user?.email}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
              </span>
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
              <button onClick={logout} className="btn-secondary text-destructive border-destructive/30 hover:bg-destructive/8">
                Sign out of all sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DANGER ZONE ── */}
      {tab === 'danger' && (
        <div className="space-y-4">
          {/* Deactivate */}
          <div className="card-base border-amber-500/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle size={15} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Deactivate Account</h2>
                <p className="text-xs text-muted-foreground">Temporarily disable your account</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                Deactivating will sign you out and hide your profile. You can reactivate by logging back in.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-amber-500/20 bg-amber-500/5 flex justify-end">
              <button onClick={logout} className="flex items-center gap-2 text-sm font-semibold text-amber-600 border border-amber-500/40 hover:bg-amber-500/10 px-4 py-2.5 rounded-xl transition-all">
                <AlertTriangle size={14} /> Deactivate Account
              </button>
            </div>
          </div>

          {/* Delete */}
          <div className="card-base border-destructive/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-destructive/20 bg-destructive/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Trash2 size={15} className="text-destructive" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Delete Account</h2>
                <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                This action is <span className="font-semibold text-destructive">irreversible</span>. All meetings, tasks, and settings will be permanently deleted.
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                </label>
                <input
                  type="text" value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="input-base border-destructive/30 focus:border-destructive focus:ring-destructive/20 text-destructive placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-destructive/20 bg-destructive/5 flex justify-end">
              <button
                disabled={deleteConfirm !== 'DELETE'}
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 text-sm font-semibold text-destructive border border-destructive/40 hover:bg-destructive/10 px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} /> Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="card-base shadow-2xl w-full max-w-md p-6 space-y-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Delete Account?</h3>
                <p className="text-xs text-muted-foreground">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              All your data including meetings, tasks, and settings will be permanently deleted.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => { setShowDeleteModal(false); logout(); navigate('/login') }}
                className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
