import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Lightbulb,
  Menu,
  MessageCircle,
  Minimize2,
  Plus,
  Radio,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { StatsCard } from '../../components/dashboard/StatsCard'
import { RecentMeetings } from '../../components/dashboard/RecentMeetings'
import { PriorityActionItems } from '../../components/dashboard/PriorityActionsItems'
import { ThemeToggle } from '../../components/ThemeToggle'
import { meetingsService, type Meeting } from '../../services/meetings.service'
import { useAuthStore } from '../../store/useAuthStore'
import heroImage from '../../assets/hero.png'

function Skeleton({ className = '' }) {
  return <div className={`bg-muted animate-shimmer rounded-2xl ${className}`} />
}

function getDurationMinutes(meeting: Meeting) {
  if (!meeting.startedAt || !meeting.endedAt) return null
  return Math.max(0, Math.round((new Date(meeting.endedAt).getTime() - new Date(meeting.startedAt).getTime()) / 60000))
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const enterpriseStats = [
  { label: 'Teams Trust IntellMeet', value: '450+', icon: Users },
  { label: 'Meetings Hosted', value: '12K+', icon: Video },
  { label: 'Tasks Completed', value: '24K+', icon: CheckCircle2 },
]

const recommendationCards = [
  'Schedule fewer meetings on Fridays to protect focus time.',
  'Convert recurring status calls into async summaries when no decisions are needed.',
  'Assign owners before meetings end to keep action items moving.',
]

const heatmap = [3, 5, 2, 6, 7, 4, 1, 2, 6, 8, 5, 3, 7, 9, 4, 1, 5, 6, 3, 8, 4, 2, 7, 5, 9, 6, 3, 4]

export default function DashboardHome() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [time, setTime] = useState(new Date())
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  useEffect(() => {
    const t = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: meetingsService.getAnalytics,
  })

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: meetingsService.getAll,
  })

  const d = useMemo(() => {
    const pendingTasks = meetings.reduce((acc, m) => acc + m.actionItems.filter((i) => !i.completed).length, 0)
    const totalTasks = analytics?.totalActionItems ?? meetings.reduce((acc, m) => acc + m.actionItems.length, 0)
    const completedTasks = analytics?.completedActionItems ?? meetings.reduce((acc, m) => acc + m.actionItems.filter((i) => i.completed).length, 0)
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const scheduled = analytics?.scheduled ?? meetings.filter((m) => m.status === 'scheduled').length
    const active = analytics?.active ?? meetings.filter((m) => m.status === 'active').length
    const ended = analytics?.ended ?? meetings.filter((m) => m.status === 'ended').length
    const total = analytics?.total ?? meetings.length
    const withSummaries = analytics?.aiGeneratedSummaries ?? meetings.filter((m) => Boolean(m.summary)).length
    const durations = meetings.map(getDurationMinutes).filter((v): v is number => v != null)
    const avgDuration = analytics?.averageDurationMinutes ?? (durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0)
    const recentActivity = [...meetings]
      .sort((a, b) => new Date(b.endedAt ?? b.startedAt ?? b.createdAt).getTime() - new Date(a.endedAt ?? a.startedAt ?? a.createdAt).getTime())
      .slice(0, 4)

    return { active, avgDuration, completedTasks, completionRate, ended, pendingTasks, recentActivity, scheduled, total, totalTasks, withSummaries }
  }, [analytics, meetings])

  const isLoading = analyticsLoading || meetingsLoading
  const timeSaved = ((d.withSummaries * 15) / 60).toFixed(1)
  const productivityScore = Math.min(99, Math.max(62, d.completionRate || 87))
  const participantCount = new Set(meetings.flatMap((m) => [m.host?._id, ...m.participants.map((p) => p._id)]).filter(Boolean)).size

  const quickActions = [
    { label: 'New Meeting', icon: Plus, onClick: () => navigate('/meetings'), tone: 'from-indigo-600 to-blue-600' },
    { label: 'Invite Team', icon: Users, onClick: () => navigate('/teams'), tone: 'from-blue-600 to-indigo-600' },
    { label: 'Analytics', icon: BarChart3, onClick: () => navigate('/analytics'), tone: 'from-indigo-500 to-blue-500' },
    { label: 'Reports', icon: FileText, onClick: () => navigate('/analytics'), tone: 'from-blue-500 to-indigo-500' },
  ]

  const stats = [
    { label: 'Total Meetings', value: isLoading ? '-' : String(d.total), detail: d.active ? `${d.active} live now` : `${d.scheduled} scheduled`, icon: <Video className="text-primary" size={20} /> },
    { label: 'AI Summaries', value: isLoading ? '-' : String(d.withSummaries), detail: `~${timeSaved}h time saved`, icon: <Sparkles className="text-primary" size={20} /> },
    { label: 'Pending Tasks', value: isLoading ? '-' : String(d.pendingTasks), detail: d.pendingTasks === 0 ? 'All caught up' : `${d.completionRate}% resolved`, icon: <CheckCircle2 className="text-primary" size={20} /> },
  ]

  const statusCards = [
    { label: 'Live Now', value: d.active, icon: Radio, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Scheduled', value: d.scheduled, icon: CalendarClock, color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Completed', value: d.ended, icon: CheckCircle2, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'With Summary', value: d.withSummaries, icon: FileText, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30' },
  ]

  const weeklyAnalytics = [
    { day: 'Mon', meetings: Math.max(2, d.scheduled + 2), tasks: Math.max(4, d.completedTasks), productivity: 76 },
    { day: 'Tue', meetings: Math.max(3, d.active + 3), tasks: Math.max(5, Math.round(d.completedTasks * 0.7)), productivity: 81 },
    { day: 'Wed', meetings: Math.max(4, Math.round(d.total * 0.35)), tasks: Math.max(7, d.completedTasks + 1), productivity: 84 },
    { day: 'Thu', meetings: Math.max(3, Math.round(d.total * 0.28)), tasks: Math.max(6, d.completedTasks), productivity: productivityScore },
    { day: 'Fri', meetings: Math.max(1, d.active + 1), tasks: Math.max(3, Math.round(d.completedTasks * 0.55)), productivity: 79 },
  ]

  const trendData = [
    { day: 'Mon', thisWeek: 4, lastWeek: 6 },
    { day: 'Tue', thisWeek: 6, lastWeek: 5 },
    { day: 'Wed', thisWeek: 5, lastWeek: 7 },
    { day: 'Thu', thisWeek: Math.max(3, d.total), lastWeek: Math.max(2, d.ended) },
    { day: 'Fri', thisWeek: 3, lastWeek: 5 },
  ]

  const filteredMeetings = searchTerm
    ? meetings.filter((meeting) => meeting.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 4)
    : []

  return (
    <div 
      className="min-h-screen relative bg-cover bg-center bg-fixed"
      style={{ 
        backgroundImage: `url(${heroImage})`,
        backgroundColor: '#0f172a',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Overlay with gradient for readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-indigo-950/80 backdrop-blur-[2px]"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,27,75,0.80) 50%, rgba(23,37,84,0.85) 100%)'
        }}
      />
      
      {/* Decorative grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">IntellMeet</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { label: 'Dashboard', href: '/dashboard', icon: Video, active: true },
            { label: 'Meetings', href: '/meetings', icon: CalendarClock },
            { label: 'Teams', href: '/teams', icon: Users },
            { label: 'Analytics', href: '/analytics', icon: BarChart3 },
            { label: 'Settings', href: '/settings', icon: Shield },
          ].map(({ label, href, icon: Icon, active }) => (
            <a key={label} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 text-indigo-600 dark:text-indigo-400 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Icon size={18} /> {label}
            </a>
          ))}
        </nav>
      </div>

      <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Menu size={22} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">IntellMeet</span>
          </div>
          <ThemeToggle className="h-9 w-9" />
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8 animate-slide-up">
        {/* Header, hero, quick actions, stats, etc. */}
        <div className="hidden lg:flex items-center justify-between gap-5">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search meetings..."
              className="h-12 w-full rounded-2xl border border-white/30 bg-white/20 backdrop-blur-xl pl-11 pr-4 text-sm text-white placeholder:text-white/60 shadow-xl outline-none transition focus:border-indigo-400 focus:bg-white/30"
            />
            {filteredMeetings.length > 0 && (
              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl dark:bg-slate-900/95">
                {filteredMeetings.map((meeting) => (
                  <button key={meeting._id} onClick={() => navigate(meeting.status !== 'ended' ? `/meeting/${meeting.roomId}` : '/meetings')} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                    <Video size={15} className="text-indigo-500" />
                    <span className="truncate text-slate-700 dark:text-slate-200">{meeting.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative h-11 w-11 rounded-full border border-white/30 bg-white/20 backdrop-blur-xl shadow-xl transition hover:bg-white/30" aria-label="Notifications">
              <Bell size={18} className="mx-auto text-white" />
              <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white/50" />
            </button>
            <ThemeToggle className="h-11 w-11 bg-white/20 backdrop-blur-xl border border-white/30 shadow-xl" />
            <div className="relative">
              <button onClick={() => setProfileOpen((open) => !open)} className="flex h-11 items-center gap-3 rounded-full border border-white/30 bg-white/20 backdrop-blur-xl pl-2 pr-4 shadow-xl transition hover:bg-white/30">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-sm font-bold text-white">{firstName[0]?.toUpperCase()}</span>
                <span className="text-sm font-semibold text-white">{firstName}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl dark:bg-slate-900/95">
                  {[
                    { label: 'Profile', href: '/profile' },
                    { label: 'Settings', href: '/settings' },
                    { label: 'Logout', href: '/login' },
                  ].map((item) => (
                    <button key={item.label} onClick={() => navigate(item.href)} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-indigo-950/30">
                      <Settings size={15} className="text-indigo-500" /> {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-950/90 via-indigo-950/80 to-blue-950/80 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl sm:p-12">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroImage})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-indigo-950/70 to-blue-950/60" />
          {Array.from({ length: 18 }).map((_, index) => (
            <span
              key={index}
              className="absolute h-1.5 w-1.5 animate-pulse rounded-full bg-white/40"
              style={{ left: `${8 + ((index * 17) % 84)}%`, top: `${12 + ((index * 23) % 76)}%`, animationDelay: `${index * 120}ms` }}
            />
          ))}
          <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-center">
            <div className="space-y-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-xl">
                <Sparkles size={14} /> AI-powered meeting command center
              </div>
              <div>
                <p className="text-sm font-medium text-white/75">{getGreeting()},</p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{firstName}</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-white/80">Turn live conversations into summaries, owners, decisions, and productivity signals your team can act on.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => navigate('/meetings')} className="btn-primary h-12 bg-white text-indigo-700 shadow-xl shadow-black/20 hover:bg-blue-50">
                  <Video size={18} /> Start Meeting <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/analytics')} className="btn-secondary h-12 border border-white/20 bg-white/10 text-white hover:bg-white/20">
                  <BarChart3 size={18} /> View Analytics
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Today&apos;s Focus</p>
                  <h2 className="mt-1 text-3xl font-bold">{d.scheduled + d.active || 5} Meetings</h2>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
                  <Target size={24} />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-xl font-bold">{d.pendingTasks || 12}</p>
                  <p className="text-[11px] text-white/65">Tasks</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-xl font-bold">{productivityScore}%</p>
                  <p className="text-[11px] text-white/65">Score</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-xl font-bold">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[11px] text-white/65">{time.toLocaleDateString([], { dateStyle: 'medium' })}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quote / Testimonial Section - Full width with background image */}
        <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-cover bg-center bg-fixed py-16 px-6 md:py-24 shadow-2xl" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-slate-900/80 to-blue-900/80 backdrop-blur-sm" />
          <div className="relative max-w-4xl mx-auto text-center text-white">
            <svg className="w-12 h-12 mx-auto mb-6 text-indigo-300/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4.999v10.009h-9.982zm-14.017 0v-7.391c0-5.704 3.748-9.57 9.001-10.609l.995 2.151c-2.433.917-3.995 3.638-3.995 5.849h4.999v10.009h-10z" />
            </svg>
            <blockquote className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              "IntellMeet has revolutionized how our remote teams collaborate. We've cut meeting follow-up time by 60% and boosted productivity across all departments."
            </blockquote>
            <p className="mt-6 text-lg font-medium text-white/90">— Sarah Johnson, CTO of TechFlow</p>
            <div className="flex justify-center gap-6 mt-8 text-sm text-white/70">
              <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-400" /> 450+ teams trust us</span>
              <span className="flex items-center gap-2"><Video size={18} className="text-indigo-400" /> 12K+ meetings hosted</span>
            </div>
          </div>
        </section>
        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map((action, i) => (
            <button key={action.label} onClick={action.onClick} className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/20 p-5 text-left backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/30 shadow-xl" style={{ animationDelay: `${i * 40}ms` }}>
              <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${action.tone} text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105`}>
                <action.icon size={19} />
              </div>
              <p className="text-sm font-bold text-white">{action.label}</p>
              <p className="mt-1 text-xs text-white/60">Open workspace</p>
            </button>
          ))}
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {isLoading
            ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)
            : stats.map((stat, i) => (
                <div key={stat.label} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <StatsCard {...stat} className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-xl text-white" />
                </div>
              ))}
        </section>


        {/* Status Cards */}
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {statusCards.map((item, i) => (
            <div key={item.label} className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/20 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-white/30" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${item.color} transition-transform group-hover:scale-110`}>
                <item.icon size={22} />
              </div>
              <p className="text-3xl font-bold tabular-nums text-white">{isLoading ? '-' : item.value}</p>
              <p className="text-sm font-semibold text-white/70">{item.label}</p>
            </div>
          ))}
        </section>

        {/* Analytics, Productivity, etc. */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-white/20 bg-white/20 p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Weekly Analytics</h2>
                <p className="text-sm text-white/70">Meetings, completed tasks, and productivity</p>
              </div>
              <BarChart3 className="text-indigo-300" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyAnalytics}>
                  <defs>
                    <linearGradient id="meetings" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tasks" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.4)" />
                  <YAxis tickLine={false} axisLine={false} width={32} stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)' }} />
                  <Area type="monotone" dataKey="meetings" stroke="#818cf8" fill="url(#meetings)" strokeWidth={3} />
                  <Area type="monotone" dataKey="tasks" stroke="#60a5fa" fill="url(#tasks)" strokeWidth={3} />
                  <Line type="monotone" dataKey="productivity" stroke="#34d399" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-3xl border border-white/20 bg-white/20 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Productivity Score</h2>
                  <p className="text-sm text-white/70">Based on completion velocity</p>
                </div>
                <Zap className="text-emerald-400" />
              </div>
              <div className="mx-auto h-44 max-w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: 'Score', value: productivityScore }, { name: 'Remaining', value: 100 - productivityScore }]} innerRadius={62} outerRadius={82} startAngle={90} endAngle={-270} dataKey="value">
                      <Cell fill="#818cf8" />
                      <Cell fill="rgba(255,255,255,0.15)" />
                    </Pie>
                    <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-3xl font-bold">{productivityScore}%</text>
                    <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" className="fill-white/60 text-xs">Productivity</text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/20 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white">Meeting Trend</h2>
              <p className="mb-4 text-sm text-white/70">This week vs last week</p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.4)" />
                    <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)' }} />
                    <Line type="monotone" dataKey="thisWeek" stroke="#818cf8" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="lastWeek" stroke="rgba(129,140,248,0.4)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* AI Insight, Heatmap, Team Health */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/20 bg-white/20 p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
                <Lightbulb size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">AI Insight</h2>
                <p className="text-sm text-white/70">Meeting summaries improved task completion by 18%.</p>
              </div>
            </div>
            <div className="space-y-3">
              {recommendationCards.map((recommendation) => (
                <div key={recommendation} className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4 text-sm font-medium text-indigo-100 backdrop-blur-sm">
                  {recommendation}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/20 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white">Team Activity Heatmap</h2>
            <p className="mb-5 text-sm text-white/70">Contribution intensity over the last 4 weeks</p>
            <div className="grid grid-cols-7 gap-2">
              {heatmap.map((value, index) => (
                <div key={`${value}-${index}`} title={`${value} team events`} className={`aspect-square rounded-md ${value > 7 ? 'bg-indigo-400' : value > 5 ? 'bg-indigo-300/60' : value > 3 ? 'bg-blue-300/40' : value > 1 ? 'bg-blue-200/20' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/20 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white">Team Health</h2>
            <p className="mb-5 text-sm text-white/70">Live workspace indicators</p>
            {[
              { icon: Users, label: 'Participants', value: isLoading ? '-' : String(participantCount) },
              { icon: Clock, label: 'Avg duration', value: isLoading ? '-' : `${d.avgDuration}m` },
              { icon: TrendingUp, label: 'Tasks resolved', value: isLoading ? '-' : `${d.completionRate}%` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="mb-3 flex items-center justify-between rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <span className="flex items-center gap-2 text-sm font-medium text-white/80"><Icon size={15} className="text-indigo-300" /> {label}</span>
                <span className="text-xl font-bold tabular-nums text-white">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* About Us Section - Full width with background image */}
        <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-cover bg-center bg-fixed py-16 px-6 md:py-24 shadow-2xl" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-indigo-900/80 to-blue-900/90 backdrop-blur-sm" />
          <div className="relative max-w-5xl mx-auto text-white">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">About IntellMeet</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-indigo-400 to-blue-400 mx-auto rounded-full" />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <p className="text-lg leading-relaxed text-white/90">
                  IntellMeet is an <span className="font-semibold text-indigo-300">AI-powered enterprise meeting platform</span> that transforms how teams collaborate. Built for the modern hybrid workforce, we combine real-time video conferencing, intelligent transcription, and automated action item extraction to make every meeting productive.
                </p>
                <p className="text-lg leading-relaxed text-white/90">
                  Our mission is to <span className="font-semibold text-blue-300">reduce meeting waste</span> and empower teams to focus on what matters most — turning conversations into outcomes.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                    <Sparkles size={16} className="text-indigo-300" /> AI Summaries
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                    <CheckCircle2 size={16} className="text-emerald-300" /> Action Items
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                    <Users size={16} className="text-blue-300" /> Team Collaboration
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm border border-white/10">
                  <h3 className="text-xl font-semibold text-white">Why IntellMeet?</h3>
                  <ul className="mt-3 space-y-2 text-white/80">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Reduce meeting follow-up time by up to 60%</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>AI-generated summaries and action items</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Real-time collaboration with screen sharing</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Enterprise-grade security and scalability</span>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                  <span>© 2026 IntellMeet — Built by Zidio Development</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Team Achievements & Recent Meetings */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/20 bg-white/20 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white">Recent Team Achievements</h2>
            <p className="mb-5 text-sm text-white/70">Signals from your AI meeting workflow</p>
            <div className="space-y-4">
              {enterpriseStats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
                      <stat.icon size={18} />
                    </div>
                    <p className="text-sm font-semibold text-white/90">{stat.label}</p>
                  </div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/20 bg-white/20 p-4 shadow-xl backdrop-blur-xl">
              <RecentMeetings meetings={meetings} isLoading={meetingsLoading} onViewAll={() => navigate('/meetings')} />
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/20 p-4 shadow-xl backdrop-blur-xl">
              <PriorityActionItems meetings={meetings} isLoading={meetingsLoading} />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-white/20 bg-gradient-to-br from-indigo-600/30 to-blue-600/30 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Ready to transform your meetings?</h2>
              <p className="mt-1 text-sm text-white/80">Start a live meeting and let AI capture summaries, tasks, and decisions automatically.</p>
            </div>
            <button onClick={() => navigate('/meetings')} className="btn-primary h-12 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
              <Video size={18} /> Start a Meeting <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-sm text-white/60 sm:flex-row">
          <p>Copyright 2026 IntellMeet — AI-Powered Enterprise Meeting Platform</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </footer>
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        {aiChatOpen && (
          <div className="mb-4 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <Sparkles size={18} />
                <div>
                  <p className="text-sm font-bold">Ask IntellMeet AI</p>
                  <p className="text-xs text-white/75">Insights from your workspace</p>
                </div>
              </div>
              <button onClick={() => setAiChatOpen(false)} className="rounded-full p-1 hover:bg-white/15" aria-label="Minimize AI assistant">
                <Minimize2 size={16} />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Your strongest pattern this week is faster follow-through after summarized meetings.
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                <input placeholder="Ask about meetings..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                <button className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white" aria-label="Send message">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
        <button onClick={() => setAiChatOpen((open) => !open)} className="flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-5 font-semibold text-white shadow-2xl shadow-indigo-500/35 transition hover:-translate-y-0.5" aria-label="Open AI assistant">
          <MessageCircle size={20} /> Ask IntellMeet AI
        </button>
      </div>
    </div>
  )
}