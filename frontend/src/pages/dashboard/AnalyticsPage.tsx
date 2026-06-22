import { useQuery } from '@tanstack/react-query'
import { Video, CheckCircle2, BarChart3, Clock, TrendingUp, Zap, Download, Target } from 'lucide-react'
import { meetingsService } from '../../services/meetings.service'
import { useToast } from '../../components/Toast'

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-muted animate-shimmer rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-52 bg-muted animate-shimmer rounded-2xl" />
        <div className="h-52 bg-muted animate-shimmer rounded-2xl" />
      </div>
      <div className="h-64 bg-muted animate-shimmer rounded-2xl" />
    </div>
  )
}

function StatCard({ label, value, sub, icon, accent = 'bg-primary/10', trend }: {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; accent?: string; trend?: string
}) {
  return (
    <div className="card-base p-5 card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
            <TrendingUp size={9} /> {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</h3>
      <p className="text-xs text-primary font-medium mt-1">{sub}</p>
    </div>
  )
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-3 h-36 pt-2">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
          <span className="text-xs font-bold text-foreground tabular-nums">{d.value}</span>
          <div className="w-full rounded-t-lg overflow-hidden bg-muted/60 relative" style={{ height: '90px' }}>
            <div
              className={`w-full ${d.color} rounded-t-lg transition-all duration-700 ease-out absolute bottom-0`}
              style={{ height: `${Math.max((d.value / max) * 90, d.value > 0 ? 4 : 0)}px` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ rate }: { rate: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (rate / 100) * circ
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/50" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="12"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        className="text-primary transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: meetingsService.getAnalytics,
  })
  const { toast } = useToast()

  const rate = data && data.totalActionItems > 0
    ? Math.round((data.completedActionItems / data.totalActionItems) * 100)
    : 0

  const exportCSV = () => {
    if (!data?.recentMeetings?.length) { toast('warning', 'No data to export.'); return }
    const rows = [
      ['Meeting', 'Date', 'Duration (min)', 'Action Items'],
      ...data.recentMeetings.map((m) => {
        const dur = m.startedAt && m.endedAt
          ? Math.round((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000) : ''
        return [m.title, m.endedAt ? new Date(m.endedAt).toLocaleDateString() : '', dur, m.actionItems.length]
      }),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `intellmeet-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast('success', 'Analytics exported as CSV!')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-slide-up">
      {/* Hero Header */}
      <div className="relative group card-base p-10 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-transparent dark:from-emerald-950/20 dark:to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <BarChart3 size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Performance Insights</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-base mt-2">Real-time meeting productivity insights and team performance metrics.</p>
          </div>
          <button onClick={exportCSV} className="btn-secondary h-12 shrink-0 text-base font-semibold shadow-lg shadow-primary/10">
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {isLoading ? <Skeleton /> : (
        <>
          {/* Stat cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Total Meetings" value={data?.total ?? 0}
              sub="All time" trend={data?.total ? `+${data.total}` : undefined}
              icon={<Video size={20} className="text-blue-500" />}
              accent="bg-blue-100 dark:bg-blue-900/30"
            />
            <StatCard
              label="Meetings Completed" value={data?.ended ?? 0}
              sub={`${data?.active ?? 0} active now`}
              icon={<CheckCircle2 size={20} className="text-emerald-500" />}
              accent="bg-emerald-100 dark:bg-emerald-900/30"
            />
            <StatCard
              label="Action Items" value={data?.totalActionItems ?? 0}
              sub={`${data?.completedActionItems ?? 0} resolved`}
              icon={<BarChart3 size={20} className="text-violet-500" />}
              accent="bg-violet-100 dark:bg-violet-900/30"
            />
            <StatCard
              label="Completion Rate" value={`${rate}%`}
              sub="Tasks resolved"
              icon={<Zap size={20} className="text-amber-500" />}
              accent="bg-amber-100 dark:bg-amber-900/30"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bar chart */}
            <div className="card-base p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" />
                <h2 className="font-bold text-foreground text-sm">Meeting Overview</h2>
              </div>
              <BarChart data={[
                { label: 'Total',     value: data?.total ?? 0,                color: 'bg-primary/70' },
                { label: 'Completed', value: data?.ended ?? 0,                color: 'bg-emerald-500/70' },
                { label: 'Active',    value: data?.active ?? 0,               color: 'bg-amber-500/70' },
                { label: 'Tasks',     value: data?.totalActionItems ?? 0,     color: 'bg-violet-500/70' },
                { label: 'Resolved',  value: data?.completedActionItems ?? 0, color: 'bg-blue-500/70' },
              ]} />
              <div className="flex flex-wrap gap-3 pt-1">
                {[
                  { label: 'Total',     color: 'bg-primary/70' },
                  { label: 'Completed', color: 'bg-emerald-500/70' },
                  { label: 'Active',    color: 'bg-amber-500/70' },
                  { label: 'Tasks',     color: 'bg-violet-500/70' },
                  { label: 'Resolved',  color: 'bg-blue-500/70' },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} /> {l.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Donut */}
            <div className="card-base p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-sm">Action Item Completion</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data?.completedActionItems ?? 0} of {data?.totalActionItems ?? 0} tasks completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <DonutChart rate={rate} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-foreground tabular-nums">{rate}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {[
                    { label: 'Progress', value: rate, color: 'gradient-primary' },
                    { label: 'Target (80%)', value: 80, color: 'bg-muted-foreground/30' },
                  ].map((bar) => (
                    <div key={bar.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{bar.label}</span>
                        <span className="font-semibold text-foreground">{bar.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${bar.color} rounded-full transition-all duration-1000`} style={{ width: `${bar.value}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                    rate >= 80
                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  }`}>
                    {rate >= 80 ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    {rate >= 80 ? '🎉 Target achieved!' : `${80 - rate}% more to reach target`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Performance Showcase */}
          <div className="relative group card-base p-8 overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/20 via-transparent to-blue-50/20 dark:from-cyan-950/10 dark:to-blue-950/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                Workspace Performance
              </h2>
              <p className="text-sm text-muted-foreground mt-1">See how your team leverages premium meeting spaces</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  image: '/alex-tyson-ozw0wVn33Ac-unsplash.jpg', 
                  title: 'Board Meetings', 
                  stat: '127 sessions',
                  desc: 'Strategic discussions'
                },
                { 
                  image: '/point3d-commercial-imaging-ltd-gOhIWNwOvbw-unsplash.jpg', 
                  title: 'Team Standups', 
                  stat: '340 sessions',
                  desc: 'Daily coordination'
                },
                { 
                  image: '/roberto-nickson-tleCJiDOri0-unsplash.jpg', 
                  title: 'Focus Sessions', 
                  stat: '89 sessions',
                  desc: 'Deep work collaboration'
                },
              ].map((perf) => (
                <div key={perf.title} className="relative group/perf overflow-hidden rounded-2xl h-44 card-base">
                  <img 
                    src={perf.image}
                    alt={perf.title}
                    className="w-full h-full object-cover group-hover/perf:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-bold text-white">{perf.title}</p>
                    <p className="text-xs text-white/80 mb-2">{perf.desc}</p>
                    <p className="text-sm font-bold text-cyan-300">{perf.stat}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent meetings table */}
          <div className="card-base overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h2 className="font-bold text-foreground">Recent Completed Meetings</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
                {data?.recentMeetings?.length ?? 0} meetings
              </span>
            </div>
            {!data?.recentMeetings?.length ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
                <BarChart3 size={32} className="opacity-30" />
                <p className="text-sm">No completed meetings yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground tracking-wider bg-muted/20">
                      <th className="px-6 py-3 font-semibold">Meeting</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Duration</th>
                      <th className="px-6 py-3 font-semibold">Action Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recentMeetings.map((m) => {
                      const duration = m.startedAt && m.endedAt
                        ? Math.round((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000)
                        : null
                      const completedCount = m.actionItems.filter((i) => i.completed).length
                      return (
                        <tr key={m._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Video size={14} className="text-primary" />
                              </div>
                              <span className="text-sm font-medium text-foreground">{m.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {m.endedAt ? new Date(m.endedAt).toLocaleDateString([], { dateStyle: 'medium' }) : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {duration != null
                              ? <span className="flex items-center gap-1"><Clock size={12} /> {duration} min</span>
                              : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="badge badge-primary">
                                <CheckCircle2 size={10} /> {m.actionItems.length} items
                              </span>
                              {completedCount > 0 && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{completedCount} done</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
