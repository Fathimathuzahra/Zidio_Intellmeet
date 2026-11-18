import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Area, AreaChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  ArrowRight, BarChart3, CalendarClock, CheckCircle2,
  BookOpen, ChevronLeft, ChevronRight, Clock, FileText, Lightbulb,
  MessageCircle, Minimize2, Plus, Radio,
  Sparkles, Target, TrendingUp, Users,
  Video, Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatsCard } from '../../components/dashboard/StatsCard'
import { RecentMeetings } from '../../components/dashboard/RecentMeetings'
import { PriorityActionItems } from '../../components/dashboard/PriorityActionsItems'
import { meetingsService, type Meeting } from '../../services/meetings.service'
import { useAuthStore } from '../../store/useAuthStore'

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

const UNSPLASH = {
  meeting1: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80',
  meeting2: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80',
  meeting3: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
  meeting4: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
}

const recommendationCards = [
  'Schedule fewer meetings on Fridays to protect focus time.',
  'Convert recurring status calls into async summaries when no decisions are needed.',
  'Assign owners before meetings end to keep action items moving.',
]

const heatmap = [3, 5, 2, 6, 7, 4, 1, 2, 6, 8, 5, 3, 7, 9, 4, 1, 5, 6, 3, 8, 4, 2, 7, 5, 9, 6, 3, 4]

const platformHighlights = [
  { title: 'Meeting intelligence', description: 'Turn discussion notes into concise summaries and follow-up actions.', image: UNSPLASH.meeting1, icon: Sparkles },
  { title: 'Live collaboration', description: 'Bring video, chat, shared notes, and participant presence together.', image: UNSPLASH.meeting2, icon: Video },
  { title: 'Team workspaces', description: 'Keep projects, ownership, and meeting outcomes connected.', image: UNSPLASH.meeting3, icon: Users },
]

const showcaseItems = [
  { img: UNSPLASH.meeting1, label: 'Live Video Meetings', desc: 'HD video with real-time AI transcription' },
  { img: UNSPLASH.meeting2, label: 'Smart Action Items', desc: 'Auto-extracted tasks with owner assignment' },
  { img: UNSPLASH.meeting3, label: 'Team Collaboration', desc: 'Shared workspaces and async summaries' },
  { img: UNSPLASH.meeting4, label: 'Analytics & Insights', desc: 'Productivity metrics and trend analysis' },
]

export default function DashboardHome() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [time, setTime] = useState(new Date())
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [activePage, setActivePage] = useState(0)

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
  const productivityScore = d.completionRate
  const participantCount = new Set(meetings.flatMap((m) => [m.host?._id, ...m.participants.map((p) => p._id)]).filter(Boolean)).size
  const workspaceStats = [
    { label: 'Meetings', value: isLoading ? '-' : String(d.total), icon: Video },
    { label: 'Summaries', value: isLoading ? '-' : String(d.withSummaries), icon: Sparkles },
    { label: 'Actions completed', value: isLoading ? '-' : String(d.completedTasks), icon: CheckCircle2 },
  ]

  const quickActions = [
    { label: 'New Meeting', icon: Plus, onClick: () => navigate('/meetings'), tone: 'from-indigo-600 to-violet-600', glow: 'shadow-indigo-500/40' },
    { label: 'Invite Team', icon: Users, onClick: () => navigate('/teams'), tone: 'from-blue-600 to-cyan-600', glow: 'shadow-blue-500/40' },
    { label: 'Analytics', icon: BarChart3, onClick: () => navigate('/analytics'), tone: 'from-violet-600 to-purple-600', glow: 'shadow-violet-500/40' },
    { label: 'Reports', icon: FileText, onClick: () => navigate('/analytics'), tone: 'from-cyan-600 to-blue-600', glow: 'shadow-cyan-500/40' },
  ]

  const stats = [
    { label: 'Total Meetings', value: isLoading ? '-' : String(d.total), detail: d.active ? `${d.active} live now` : `${d.scheduled} scheduled`, icon: <Video className="text-primary" size={20} /> },
    { label: 'AI Summaries', value: isLoading ? '-' : String(d.withSummaries), detail: `~${timeSaved}h estimated (15 min per summary)`, icon: <Sparkles className="text-primary" size={20} /> },
    { label: 'Pending Tasks', value: isLoading ? '-' : String(d.pendingTasks), detail: d.pendingTasks === 0 ? 'All caught up' : `${d.completionRate}% resolved`, icon: <CheckCircle2 className="text-primary" size={20} /> },
  ]

  const statusCards = [
    { label: 'Live Now', value: d.active, icon: Radio, color: 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30' },
    { label: 'Scheduled', value: d.scheduled, icon: CalendarClock, color: 'text-amber-400 bg-amber-500/20 border border-amber-500/30' },
    { label: 'Completed', value: d.ended, icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/20 border border-blue-500/30' },
    { label: 'With Summary', value: d.withSummaries, icon: FileText, color: 'text-violet-400 bg-violet-500/20 border border-violet-500/30' },
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
    ? meetings.filter((m) => m.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 4)
    : meetings.slice(0, 4)

  const liveMeetings = meetings.filter((m) => m.status === 'active').slice(0, 3)

  const playbookPages = [
    {
      title: 'Live Meetings',
      subtitle: 'Start or join rooms',
      route: '/meetings',
      icon: Video,
      accent: 'from-sky-500 to-indigo-600',
      image: UNSPLASH.meeting1,
      metric: d.active > 0 ? `${d.active} live` : `${d.scheduled} planned`,
      text: 'Launch HD video rooms, invite teammates, and keep every decision attached to the meeting record.',
      checklist: ['One-click join links', 'Realtime participants', 'Meeting history'],
    },
    {
      title: 'AI Summaries',
      subtitle: 'Turn talk into clarity',
      route: '/meetings',
      icon: Sparkles,
      accent: 'from-violet-500 to-fuchsia-600',
      image: UNSPLASH.meeting2,
      metric: `${d.withSummaries} ready`,
      text: 'Capture summaries, decisions, and action items so follow-up work starts before the call fades.',
      checklist: [`${timeSaved}h saved`, 'Action item extraction', 'Searchable notes'],
    },
    {
      title: 'Team Workspaces',
      subtitle: 'Projects and members',
      route: '/teams',
      icon: Users,
      accent: 'from-cyan-500 to-blue-600',
      image: UNSPLASH.meeting3,
      metric: `${participantCount} tracked`,
      text: 'Organize admins, members, projects, and collaboration into one clean operating space.',
      checklist: ['Team invitations', 'Project boards', 'Member roles'],
    },
    {
      title: 'Analytics',
      subtitle: 'Measure momentum',
      route: '/analytics',
      icon: BarChart3,
      accent: 'from-emerald-500 to-teal-600',
      image: UNSPLASH.meeting4,
      metric: `${productivityScore}% score`,
      text: 'Understand meeting load, completion rates, trends, and where your team can reclaim focus time.',
      checklist: ['Productivity charts', 'CSV exports', 'Trend insights'],
    },
  ]

  const activePlaybook = playbookPages[activePage]
  const nextPage = () => setActivePage((page) => (page + 1) % playbookPages.length)
  const prevPage = () => setActivePage((page) => (page - 1 + playbookPages.length) % playbookPages.length)

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="relative min-h-full overflow-x-hidden rounded-2xl" style={{ backgroundColor: '#060b18' }}>

      {/* ── Video Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay muted loop playsInline
          onCanPlay={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-25' : 'opacity-0'}`}
          poster={UNSPLASH.office}
        >
          <source src="https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4" type="video/mp4" />
        </video>
        {!videoLoaded && (
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${UNSPLASH.office})` }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(6,11,24,0.93) 0%,rgba(17,12,50,0.89) 40%,rgba(10,20,60,0.93) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.45) 0%,transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(59,130,246,0.4) 0%,transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse,rgba(139,92,246,0.3) 0%,transparent 70%)' }} />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10">

        <motion.main
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-none px-3 sm:px-6 xl:px-10 2xl:px-12 py-6 lg:py-8 space-y-8 lg:pl-0"
        >

          {/* ── Hero Section with Video Overlay ── */}
          <section className="relative overflow-hidden rounded-3xl border border-white/15 shadow-2xl shadow-indigo-500/20">
            {/* Background layers */}
            <div className="absolute inset-0">
              <img src={UNSPLASH.office} alt="" className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(6,11,24,0.88) 0%,rgba(30,20,80,0.82) 50%,rgba(10,30,80,0.88) 100%)' }} />
            </div>
            {/* Animated particles */}
            {Array.from({ length: 20 }).map((_, idx) => (
              <motion.span key={idx}
                className="absolute h-1 w-1 rounded-full bg-indigo-400/60"
                style={{ left: `${5 + ((idx * 19) % 90)}%`, top: `${8 + ((idx * 27) % 84)}%` }}
                animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
                transition={{ duration: 2 + (idx % 3), repeat: Infinity, delay: idx * 0.15 }}
              />
            ))}

            <div className="relative p-8 sm:p-12">
              <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
                <div className="space-y-6 text-white">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/15 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-sm">
                      <Sparkles size={12} /> AI-Powered Meeting Platform
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {d.active > 0 ? `${d.active} Live Now` : 'Ready to Meet'}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white/60 tracking-wide uppercase">{getGreeting()},</p>
                    <h1 className="mt-1 text-4xl sm:text-5xl font-bold tracking-tight">
                      <span className="bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">{firstName}</span>
                    </h1>
                    <p className="mt-3 max-w-xl text-base leading-7 text-white/65">
                      Turn live conversations into AI summaries, action items, and productivity signals your team can act on instantly.
                    </p>
                  </div>

                  {/* Hero stat pills */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Est. Time Saved', value: `${timeSaved}h`, icon: '⚡' },
                      { label: 'Completion', value: `${d.completionRate}%`, icon: '🎯' },
                      { label: 'Meetings', value: String(d.total || 0), icon: '📹' },
                    ].map((pill) => (
                      <div key={pill.label} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                        <span className="text-base">{pill.icon}</span>
                        <div>
                          <p className="text-xs text-white/50 leading-none">{pill.label}</p>
                          <p className="text-sm font-bold text-white">{pill.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <motion.button onClick={() => navigate('/meetings')}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-shadow">
                      <Video size={18} /> Start Meeting <ArrowRight size={16} />
                    </motion.button>
                    <motion.button onClick={() => navigate('/analytics')}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl border border-white/20 bg-white/10 text-white font-semibold backdrop-blur-sm hover:bg-white/18 transition-colors">
                      <BarChart3 size={18} /> View Analytics
                    </motion.button>
                  </div>
                </div>

                {/* Focus card */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-3xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl"
                  style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(139,92,246,0.10) 100%)' }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-white/55 uppercase tracking-wider">Today's Focus</p>
                      <h2 className="mt-1 text-3xl font-bold">{d.scheduled + d.active} Meetings</h2>
                    </div>
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-white/20">
                      <Target size={24} className="text-indigo-300" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { val: d.pendingTasks, label: 'Tasks' },
                      { val: `${productivityScore}%`, label: 'Score' },
                      { val: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), label: time.toLocaleDateString([], { month: 'short', day: 'numeric' }) },
                    ].map((item, i) => (
                      <div key={i} className="rounded-2xl bg-white/10 border border-white/10 p-3">
                        <p className="text-xl font-bold">{item.val}</p>
                        <p className="text-[11px] text-white/55 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <Users size={15} className="text-indigo-300" />
                    <p className="text-xs text-white/55">{participantCount} unique participants in meeting history</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── Quick Actions ── */}
          <section className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/8 p-4 shadow-2xl shadow-indigo-500/15 backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                  <BookOpen size={13} /> Workspace Playbook
                </span>
                <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Flip through your live command center</h2>
                <p className="mt-1 max-w-2xl text-sm text-white/55">
                  Every page is clickable, dynamic, and connected to a real IntellMeet workflow.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={prevPage} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white/70 transition hover:bg-white/18 hover:text-white" aria-label="Previous playbook page">
                  <ChevronLeft size={18} />
                </button>
                <div className="rounded-full border border-white/15 bg-black/20 px-3 py-2 text-xs font-semibold text-white/55">
                  {activePage + 1} / {playbookPages.length}
                </div>
                <button type="button" onClick={nextPage} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white/70 transition hover:bg-white/18 hover:text-white" aria-label="Next playbook page">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="relative min-h-[430px] rounded-[1.75rem] border border-white/15 bg-[#f7f2e7] p-3 shadow-2xl sm:p-5" style={{ perspective: '1600px' }}>
                <div className="absolute inset-y-8 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-900/25 to-transparent lg:block" />
                <AnimatePresence mode="wait">
                  <motion.button
                    key={activePlaybook.title}
                    type="button"
                    onClick={() => navigate(activePlaybook.route)}
                    initial={{ opacity: 0, rotateY: -18, x: 34 }}
                    animate={{ opacity: 1, rotateY: 0, x: 0 }}
                    exit={{ opacity: 0, rotateY: 18, x: -34 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="group grid h-full min-h-[390px] w-full overflow-hidden rounded-[1.35rem] text-left shadow-[0_30px_80px_rgba(15,23,42,0.28)] lg:grid-cols-2"
                    style={{ transformStyle: 'preserve-3d', background: 'linear-gradient(90deg,#fffaf0 0%,#f8f0dc 49%,#efe3ca 50%,#fff9ef 51%,#fffdf7 100%)' }}
                  >
                    <div className="relative overflow-hidden p-6 sm:p-8">
                      <img src={activePlaybook.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/55 to-transparent" />
                      <div className="relative flex h-full flex-col justify-between text-white">
                        <div>
                          <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${activePlaybook.accent} shadow-xl`}>
                            <activePlaybook.icon size={24} />
                          </div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{activePlaybook.subtitle}</p>
                          <h3 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{activePlaybook.title}</h3>
                          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">{activePlaybook.text}</p>
                        </div>
                        <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 transition-transform group-hover:translate-x-1">
                          Open page <ArrowRight size={15} />
                        </div>
                      </div>
                    </div>

                    <div className="relative flex flex-col justify-between p-6 text-slate-900 sm:p-8">
                      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(#d7c8aa 1px,transparent 1px)', backgroundSize: '100% 30px' }} />
                      <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Current signal</p>
                        <div className="mt-3 rounded-3xl border border-slate-900/10 bg-white/70 p-5 shadow-sm">
                          <p className="text-5xl font-black tracking-tight">{activePlaybook.metric}</p>
                          <p className="mt-2 text-sm text-slate-500">Live data from your workspace</p>
                        </div>
                        <div className="mt-6 space-y-3">
                          {activePlaybook.checklist.map((item) => (
                            <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-900/5 px-4 py-3 text-sm font-semibold">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative mt-8 flex items-center justify-between border-t border-slate-900/10 pt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        <span>IntellMeet</span>
                        <span>Chapter {activePage + 1}</span>
                      </div>
                    </div>
                  </motion.button>
                </AnimatePresence>
              </div>

              <div className="grid gap-3">
                {playbookPages.map((page, index) => (
                  <motion.button
                    key={page.title}
                    type="button"
                    onClick={() => setActivePage(index)}
                    whileHover={{ x: 4 }}
                    className={`group flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition-all ${
                      activePage === index
                        ? 'border-indigo-400/55 bg-indigo-500/18 shadow-xl shadow-indigo-500/15'
                        : 'border-white/12 bg-white/8 hover:bg-white/13'
                    }`}
                  >
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${page.accent} text-white shadow-lg`}>
                      <page.icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white">{page.title}</p>
                      <p className="truncate text-xs text-white/45">{page.metric} - {page.subtitle}</p>
                    </div>
                    <ArrowRight size={16} className="text-white/30 transition group-hover:text-white/80" />
                  </motion.button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {quickActions.map((action, i) => (
              <motion.button key={action.label} onClick={action.onClick}
                className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/8 p-5 text-left backdrop-blur-xl hover:bg-white/14 transition-all shadow-xl"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              >
                <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${action.tone} text-white shadow-lg ${action.glow} transition-transform group-hover:scale-110`}>
                  <action.icon size={20} />
                </div>
                <p className="text-sm font-bold text-white">{action.label}</p>
                <p className="mt-1 text-xs text-white/45">Open workspace</p>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl bg-gradient-to-br ${action.tone} opacity-5`} />
              </motion.button>
            ))}
          </section>

          {/* ── Stats Cards ── */}
          <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {isLoading
              ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)
              : stats.map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <StatsCard {...stat} className="bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl text-white" />
                </motion.div>
              ))}
          </section>

          {/* ── Status Cards ── */}
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {statusCards.map((item, i) => (
              <motion.div key={item.label}
                className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/8 p-6 shadow-xl backdrop-blur-xl hover:bg-white/14 transition-all"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }}
              >
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${item.color} transition-transform group-hover:scale-110`}>
                  <item.icon size={22} />
                </div>
                <p className="text-3xl font-bold tabular-nums text-white">{isLoading ? '-' : item.value}</p>
                <p className="text-sm font-medium text-white/55 mt-1">{item.label}</p>
              </motion.div>
            ))}
          </section>

          {/* ── Feature Showcase (Images) ── */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">IntellMeet in Action</h2>
                <p className="text-sm text-white/50 mt-1">Everything your team needs in one place</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {showcaseItems.map((item, i) => (
                <motion.div key={item.label}
                  className="group relative overflow-hidden rounded-2xl border border-white/15 shadow-xl cursor-pointer"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                >
                  <img src={item.img} alt={item.label} className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-xs text-white/60 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/50 rounded-2xl transition-all duration-300" />
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Live Meetings + Calendar + Team Activity ── */}
          <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Live Meetings */}
            <motion.div className="rounded-3xl border border-white/15 bg-white/8 p-5 shadow-xl backdrop-blur-xl"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Radio size={18} className="text-emerald-400" /> Live Meetings
              </h2>
              <div className="space-y-3">
                {liveMeetings.length > 0 ? liveMeetings.map((m) => (
                  <div key={m._id} className="flex items-center justify-between rounded-2xl bg-white/8 border border-white/10 p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm font-medium text-white truncate">{m.title}</span>
                    </div>
                    <button onClick={() => navigate(`/meeting/${m.roomId}`)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Join →</button>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/8 flex items-center justify-center mb-3">
                      <Video size={20} className="text-white/30" />
                    </div>
                    <p className="text-sm text-white/40">No live meetings</p>
                    <button onClick={() => navigate('/meetings')} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">Start one →</button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Calendar */}
            <motion.div className="rounded-3xl border border-white/15 bg-white/8 p-5 shadow-xl backdrop-blur-xl"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <CalendarClock size={18} className="text-indigo-400" />
                {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-white/40 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div key={d} className="py-1 font-medium">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`e-${i}`} />)}
                {calendarDays.map((day) => (
                  <div key={day}
                    className={`py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${day === today.getDate()
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-white/60 hover:bg-white/10'}`}>
                    {day}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Team Activity with Avatars */}
            <motion.div className="rounded-3xl border border-white/15 bg-white/8 p-5 shadow-xl backdrop-blur-xl"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Users size={18} className="text-blue-400" /> Recent Meeting Activity
              </h2>
              <div className="space-y-3">
                {d.recentActivity.length > 0 ? d.recentActivity.map((meeting) => (
                  <div key={meeting._id} className="flex items-start gap-3">
                    <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-white/20 bg-indigo-500/20 text-xs font-bold text-indigo-200">
                      {(meeting.host?.name || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm leading-snug text-white/80">
                        <span className="font-semibold text-white">{meeting.host?.name || 'Team member'}</span>
                        {' '}{meeting.status === 'active' ? 'started' : meeting.status === 'scheduled' ? 'scheduled' : 'held'}{' '}
                        “{meeting.title}”
                      </p>
                      <p className="mt-0.5 text-xs text-white/35">
                        {new Date(meeting.endedAt ?? meeting.startedAt ?? meeting.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )) : <p className="py-4 text-sm text-white/45">Your recent meetings will appear here.</p>}
              </div>
            </motion.div>
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-indigo-600/20 via-white/8 to-cyan-500/10 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">One connected workspace</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Move from meeting decisions to project delivery.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Create team boards, assign owners, and keep every follow-up connected to your collaboration space.</p>
              </div>
              <button onClick={() => navigate('/teams')} className="btn-primary shrink-0">
                Explore teams <ArrowRight size={16} />
              </button>
            </div>
          </section>

          {/* ── Analytics Charts ── */}
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Weekly Analytics</h2>
                  <p className="text-sm text-white/50 mt-0.5">Illustrative trend data; use Analytics for recorded workspace totals</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-400" />Meetings</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" />Tasks</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Score</span>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyAnalytics}>
                    <defs>
                      <linearGradient id="gMeetings" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gTasks" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} width={32} stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(10,15,40,0.95)', backdropFilter: 'blur(12px)', color: '#fff' }} />
                    <Area type="monotone" dataKey="meetings" stroke="#818cf8" fill="url(#gMeetings)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="tasks" stroke="#60a5fa" fill="url(#gTasks)" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="productivity" stroke="#34d399" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-5">
              {/* Productivity Donut */}
              <div className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-xl backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Productivity</h2>
                    <p className="text-sm text-white/50">Completion velocity</p>
                  </div>
                  <Zap className="text-emerald-400" size={20} />
                </div>
                <div className="mx-auto h-44 max-w-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ value: productivityScore }, { value: 100 - productivityScore }]}
                        innerRadius={62} outerRadius={82} startAngle={90} endAngle={-270} dataKey="value">
                        <Cell fill="url(#donutGrad)" />
                        <Cell fill="rgba(255,255,255,0.08)" />
                      </Pie>
                      <defs>
                        <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                      </defs>
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={26} fontWeight={700}>{productivityScore}%</text>
                      <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.45)" fontSize={11}>Productivity</text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trend */}
              <div className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="text-lg font-bold text-white">Meeting Trend</h2>
                <p className="mb-4 text-sm text-white/50">Sample trend view (not a measured comparison)</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(10,15,40,0.95)', color: '#fff' }} />
                      <Line type="monotone" dataKey="thisWeek" stroke="#818cf8" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="lastWeek" stroke="rgba(129,140,248,0.35)" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* ── Meeting Playbook + Heatmap + Team Health ── */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-600/15 to-violet-600/10 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Meeting Playbook</h2>
                  <p className="text-xs text-white/50">Practical habits for more focused meetings</p>
                </div>
              </div>
              <div className="space-y-3">
                {recommendationCards.map((rec, i) => (
                  <motion.div key={                    rec} className="rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-4 text-sm text-indigo-100/90 backdrop-blur-sm"
                                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.1 }}>
                                      <div className="flex items-start gap-2">
                                        <span className="text-indigo-400 mt-0.5 flex-shrink-0">✦</span>
                                        {rec}
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-xl backdrop-blur-xl">
                                <h2 className="text-lg font-bold text-white">Activity Heatmap</h2>
                                <p className="mb-5 text-sm text-white/50">Illustrative activity view — last 4 weeks</p>
                                <div className="grid grid-cols-7 gap-1.5">
                                  {['S','M','T','W','T','F','S'].map((d, i) => (
                                    <div key={i} className="text-center text-[10px] text-white/30 mb-1">{d}</div>
                                  ))}
                                  {heatmap.map((value, idx) => (
                                    <motion.div key={idx} title={`${value} events`}
                                      className={`aspect-square rounded-md cursor-pointer transition-transform hover:scale-110 ${
                                        value > 7 ? 'bg-indigo-400 shadow-sm shadow-indigo-400/50'
                                        : value > 5 ? 'bg-indigo-400/60'
                                        : value > 3 ? 'bg-indigo-400/35'
                                        : value > 1 ? 'bg-indigo-400/18'
                                        : 'bg-white/8'}`}
                                      initial={{ opacity: 0, scale: 0.5 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: idx * 0.015 }}
                                    />
                                  ))}
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs text-white/35">
                                  <span>Less</span>
                                  <div className="flex gap-1">
                                    {['bg-white/8','bg-indigo-400/18','bg-indigo-400/35','bg-indigo-400/60','bg-indigo-400'].map((c, i) => (
                                      <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
                                    ))}
                                  </div>
                                  <span>More</span>
                                </div>
                              </div>

                              <div className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-xl backdrop-blur-xl">
                                <h2 className="text-lg font-bold text-white">Team Health</h2>
                                <p className="mb-5 text-sm text-white/50">Live workspace indicators</p>
                                <div className="space-y-3">
                                  {[
                                    { icon: Users, label: 'Participants', value: isLoading ? '-' : String(participantCount), color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/25' },
                                    { icon: Clock, label: 'Avg Duration', value: isLoading ? '-' : `${d.avgDuration}m`, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/25' },
                                    { icon: TrendingUp, label: 'Tasks Resolved', value: isLoading ? '-' : `${d.completionRate}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25' },
                                    { icon: Sparkles, label: 'AI Summaries', value: isLoading ? '-' : String(d.withSummaries), color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/25' },
                                  ].map(({ icon: Icon, label, value, color, bg }) => (
                                    <div key={label} className={`flex items-center justify-between rounded-2xl border ${bg} p-3.5 backdrop-blur-sm`}>
                                      <span className={`flex items-center gap-2.5 text-sm font-medium text-white/75`}>
                                        <Icon size={16} className={color} /> {label}
                                      </span>
                                      <span className="text-xl font-bold tabular-nums text-white">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>

                            {/* ── Platform Highlights ── */}
                            <section>
                              <div className="mb-5 text-center">
                                <h2 className="text-2xl font-bold text-white">Everything your team needs to stay aligned</h2>
                                <p className="text-sm text-white/50 mt-1">A connected workflow from live conversation to completed work</p>
                              </div>
                              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                {platformHighlights.map((item, i) => (
                                  <motion.div key={item.title}
                                    className="group overflow-hidden rounded-3xl border border-white/15 bg-white/8 shadow-xl backdrop-blur-xl"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ y: -4, borderColor: 'rgba(99,102,241,0.4)' }}
                                  >
                                    <div className="relative h-36 overflow-hidden">
                                      <img src={item.image} alt="" className="h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent" />
                                      <div className="absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur">
                                        <item.icon size={18} />
                                      </div>
                                    </div>
                                    <div className="p-5">
                                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                                      <p className="mt-2 text-sm leading-6 text-white/60">{item.description}</p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </section>

                            {/* ── Achievements + Recent Meetings + Action Items ── */}
                            <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                              <div className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-xl backdrop-blur-xl">
                                <h2 className="text-lg font-bold text-white mb-1">Workspace Snapshot</h2>
                                <p className="text-sm text-white/50 mb-5">Live totals from your meeting history</p>
                                <div className="space-y-3">
                                  {workspaceStats.map((stat) => (
                                    <motion.div key={stat.label}
                                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/8 p-4"
                                      whileHover={{ x: 4 }}>
                                      <div className="flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 border border-indigo-500/25 text-indigo-300">
                                          <stat.icon size={18} />
                                        </div>
                                        <p className="text-sm font-medium text-white/80">{stat.label}</p>
                                      </div>
                                      <p className="text-xl font-bold text-white">{stat.value}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>

                              <div className="lg:col-span-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <div className="rounded-3xl border border-white/15 bg-white/8 p-4 shadow-xl backdrop-blur-xl">
                                  <RecentMeetings
                                    meetings={filteredMeetings}
                                    isLoading={meetingsLoading}
                                    onViewAll={() => navigate('/meetings')}
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                  />
                                </div>
                                <div className="rounded-3xl border border-white/15 bg-white/8 p-4 shadow-xl backdrop-blur-xl">
                                  <PriorityActionItems meetings={meetings} isLoading={meetingsLoading} />
                                </div>
                              </div>
                            </section>

                            {/* ── CTA Banner ── */}
                            <section className="relative overflow-hidden rounded-3xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
                              <img src={UNSPLASH.meeting3} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/80 via-violet-600/70 to-blue-600/80" />
                              <div className="relative p-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-white">
                                  <h2 className="text-2xl font-bold">Ready to transform your meetings?</h2>
                                  <p className="mt-1 text-sm text-white/75 max-w-md">
                                    Start a live meeting and let AI capture summaries, tasks, and decisions automatically.
                                  </p>
                                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/60">
                                    {['✓ AI Summaries', '✓ Auto Action Items', '✓ Real-time Analytics', '✓ Team Collaboration'].map((f) => (
                                      <span key={f}>{f}</span>
                                    ))}
                                  </div>
                                </div>
                                <motion.button onClick={() => navigate('/meetings')}
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                  className="flex-shrink-0 inline-flex items-center gap-2 h-12 px-7 rounded-2xl bg-white text-indigo-700 font-bold shadow-xl shadow-black/20 hover:bg-indigo-50 transition-colors">
                                  <Video size={18} /> Start a Meeting <ArrowRight size={16} />
                                </motion.button>
                              </div>
                            </section>

                            <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-sm text-white/35 sm:flex-row">
                              <p>© 2026 IntellMeet — AI-Powered Enterprise Meeting Platform</p>
                              <div className="flex items-center gap-5">
                                {['Privacy', 'Terms'].map((l) => (
                                  <a key={l} href={l === 'Privacy' ? '/privacy' : '/terms'} className="hover:text-white/70 transition-colors">{l}</a>
                                ))}
                              </div>
                            </footer>
                          </motion.main>
                        </div>

                        {/* ── AI Assistant Panel ── */}
                        <div className="fixed bottom-6 right-6 z-40">
                          <AnimatePresence>
                            {aiChatOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="mb-4 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/15 shadow-2xl backdrop-blur-2xl"
                                style={{ background: 'rgba(10,15,40,0.97)' }}
                              >
                                <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                                      <Sparkles size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold">Meeting AI</p>
                                      <p className="text-xs text-white/65">Summaries and actions from meeting notes</p>
                                    </div>
                                  </div>
                                  <button onClick={() => setAiChatOpen(false)} className="rounded-full p-1.5 hover:bg-white/15 transition-colors" aria-label="Close">
                                    <Minimize2 size={15} />
                                  </button>
                                </div>
                                <div className="space-y-3 p-5">
                                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4 text-sm leading-relaxed text-white/75">
                                    Open a meeting to create a summary and action items from its transcript or notes. Add an AI provider key to enable provider-backed analysis.
                                  </div>
                                  <button
                                    onClick={() => { setAiChatOpen(false); navigate('/meetings') }}
                                    className="btn-primary w-full"
                                  >
                                    Open meetings <ArrowRight size={15} />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <motion.button
                            onClick={() => setAiChatOpen((o) => !o)}
                            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                            className="flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 font-semibold text-white shadow-2xl shadow-indigo-500/40"
                            aria-label="Open meeting AI information">
                            <MessageCircle size={20} /> Meeting AI
                          </motion.button>
                        </div>

                        {/* ── Floating Ambient Blobs ── */}
                        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                          <motion.div className="absolute w-96 h-96 rounded-full blur-3xl opacity-15"
                            style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.6) 0%,transparent 70%)', top: '8%', left: '3%' }}
                            animate={{ x: ['0%', '8%', '0%'], y: ['0%', '4%', '0%'] }}
                            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.div className="absolute w-80 h-80 rounded-full blur-3xl opacity-12"
                            style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.5) 0%,transparent 70%)', bottom: '12%', right: '5%' }}
                            animate={{ x: ['0%', '-8%', '0%'], y: ['0%', '-4%', '0%'] }}
                            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.div className="absolute w-64 h-64 rounded-full blur-3xl opacity-10"
                            style={{ background: 'radial-gradient(circle,rgba(59,130,246,0.5) 0%,transparent 70%)', top: '50%', right: '20%' }}
                            animate={{ x: ['0%', '5%', '0%'], y: ['0%', '-6%', '0%'] }}
                            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </div>
                      </div>
                    )
                  }
