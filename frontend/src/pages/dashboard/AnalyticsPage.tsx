import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, CheckCircle2, BarChart3, Clock, TrendingUp, Zap, Download } from 'lucide-react'
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
    <div className="card-base p-8 min-h-[240px] card-hover rounded-[2rem] bg-slate-950/85 border-white/10 border shadow-black/30">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-14 h-14 rounded-3xl ${accent} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
            <TrendingUp size={10} /> {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">{label}</p>
      <h3 className="text-4xl sm:text-5xl font-black text-white mt-4 tabular-nums">{value}</h3>
      <p className="text-base text-slate-300 font-medium mt-4 leading-7">{sub}</p>
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

const HERO_VIDEO = 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4'
const HERO_VIDEO_MOBILE = 'https://videos.pexels.com/video-files/4487971/4487971-hd_1920_1080_25fps.mp4'

export default function AnalyticsPage() {
  const navigate = useNavigate()
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
    <div className="min-h-full overflow-y-auto p-4 xl:p-8">
      <div className="space-y-10">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-[2rem] bg-slate-950/95 border border-white/10 shadow-2xl shadow-black/40"
          >
            <div className="absolute inset-0 overflow-hidden">
              <video
                src={HERO_VIDEO}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/30 to-transparent" />
            </div>
            <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-24">
              <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
                <div className="space-y-6">
                  <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 shadow-sm shadow-cyan-500/10">
                    <Video size={14} /> Live Analytics
                  </span>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] font-[var(--font-heading)] text-gradient">See your meeting impact in one beautiful workspace.</h1>
                  <p className="max-w-3xl text-xl sm:text-2xl leading-9 text-slate-300/90">Turn raw meeting data into polished summaries, rich visuals, and meaningful insights for every team conversation.</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button onClick={exportCSV} className="btn-primary px-7 py-4 text-sm font-semibold shadow-2xl shadow-primary/25 w-full sm:w-auto">
                      <Download size={18} /> Export report
                    </button>
                    <button onClick={() => navigate('/meetings')} className="w-full sm:w-auto text-sm font-semibold text-slate-100/90 hover:text-white transition-colors">
                      Browse meeting history
                    </button>
                  </div>
                  <p className="mt-5 max-w-2xl text-base text-slate-300/85">Live video highlights, smart trend cards, and executive-ready export tools help your team move faster with every meeting.</p>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/40 md:p-6">
                  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-primary/40 to-transparent blur-2xl" />
                  <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/70 shadow-inner">
                    <video
                      src={HERO_VIDEO}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-72 w-full object-cover brightness-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  </div>
                  <div className="relative mt-5 space-y-3 text-sm text-slate-200">
                    <p className="font-semibold text-slate-100">Explore modern meeting analytics</p>
                    <p>Professional visuals, instant trend signals, and export-ready reports keep your leadership updates crisp.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <span className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-200">Realtime performance</span>
                      <span className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-200">Action item insights</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-black/40">
              <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Visual snapshot</p>
              <h2 className="mt-3 text-3xl font-bold text-white font-[var(--font-heading)]">Horizontal image insights</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300/90">A dedicated image row for polished data storytelling, fully fitted and equal across the section.</p>
              <div className="mt-6">
                <div className="group overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <div className="h-[520px] w-full overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1700&q=110" alt="Executive review" className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5 bg-slate-950/90">
                    <p className="text-lg font-semibold text-white">Executive insight</p>
                    <p className="mt-2 text-sm text-slate-400">A single oversized visual that matches the scale of three fitted cards in one elegant view.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-7 shadow-2xl shadow-black/40">
                <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Feature spotlight</p>
                <h2 className="mt-4 text-3xl font-bold text-white font-[var(--font-heading)]">A refined analytics experience for every team.</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300/90">From sleek metric cards to immersive image-driven insights, the Analytics page is designed to feel premium, polished, and easy to scan.</p>
                <div className="mt-6 grid gap-4">
                  {[
                    { icon: <Video size={18} className="text-primary" />, title: 'Video-rich stories', desc: 'Embed motion previews in your analytics dashboards.' },
                    { icon: <BarChart3 size={18} className="text-primary" />, title: 'Polished chart layouts', desc: 'Clear metric blocks with bold headlines and gradient accents.' },
                    { icon: <Zap size={18} className="text-primary" />, title: 'Fast insight cards', desc: 'Quickly surface the most important meeting signals.' },
                  ].map((feature) => (
                    <div key={feature.title} className="flex items-start gap-3 rounded-3xl bg-white/5 p-4">
                      <div className="grid h-12 w-12 place-items-center rounded-3xl bg-gradient-to-br from-primary/15 to-cyan-500/10 text-primary">
                        {feature.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{feature.title}</p>
                        <p className="text-sm text-slate-400 mt-1">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-7 shadow-2xl shadow-black/40">
                <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Performance highlights</p>
                <h3 className="mt-4 text-2xl font-bold text-white">Big, bold numbers that stand out.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300/90">The status section is now cleaner, roomier, and more attractive so your top goals feel immediately clear.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-black/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Analytics pulse</p>
                <h2 className="mt-3 text-3xl font-bold text-white font-[var(--font-heading)]">Metrics, motion, and visual storytelling.</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live update
              </div>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.75rem] bg-slate-950/80 border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-3xl bg-gradient-to-br from-primary/15 to-cyan-500/15 text-primary">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Meeting Overview</p>
                    <p className="text-sm text-slate-400">Clear, bold insight across all core metrics.</p>
                  </div>
                </div>
                <div className="mt-6">
                  <BarChart data={[
                    { label: 'Total',     value: data?.total ?? 0,                color: 'bg-primary/70' },
                    { label: 'Completed', value: data?.ended ?? 0,                color: 'bg-emerald-500/70' },
                    { label: 'Active',    value: data?.active ?? 0,               color: 'bg-amber-500/70' },
                    { label: 'Tasks',     value: data?.totalActionItems ?? 0,     color: 'bg-violet-500/70' },
                    { label: 'Resolved',  value: data?.completedActionItems ?? 0, color: 'bg-blue-500/70' },
                  ]} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {[
                    { label: 'Total',     color: 'bg-primary/70' },
                    { label: 'Completed', color: 'bg-emerald-500/70' },
                    { label: 'Active',    color: 'bg-amber-500/70' },
                    { label: 'Tasks',     color: 'bg-violet-500/70' },
                    { label: 'Resolved',  color: 'bg-blue-500/70' },
                  ].map((item) => (
                    <span key={item.label} className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-200">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} /> {item.label}
                    </span>
                  ))}
                </div>
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-950/85 p-4">
                  <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Analysis</p>
                  <p className="mt-3 text-sm text-slate-300/90">Growth is strongest for resolved action items, while active meetings remain steady. This analysis helps identify the next focus area for team coordination.</p>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="rounded-[2rem] bg-slate-950/85 border border-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Motion preview</p>
                  <div className="relative mt-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                    <video
                      src={HERO_VIDEO_MOBILE}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-99 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  </div>
                  <p className="mt-11 text-sm leading-6 text-slate-300/90">Immerse your analytics in motion with video-first highlights and context-aware storytelling.</p>
                </div>
               
              </div>
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

                <div className="space-y-5">
                  <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/40">
                    <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Visual stories</p>
                    <h3 className="mt-4 text-3xl font-bold text-white font-[var(--font-heading)]">Imagery and insight in one place.</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-300/90">Add images, quotes, and rich cards to keep the bottom of the page engaging and easy to scan.</p>
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] overflow-hidden border border-white/10 bg-black shadow-xl">
                        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80" alt="Analytics visual" className="h-[320px] w-full object-cover" />
                        <div className="p-4">
                          <p className="text-sm font-semibold text-white">Dashboard snapshot</p>
                          <p className="mt-2 text-sm text-slate-400">Rich card designs and elegant contrast help every insight stand out.</p>
                        </div>
                      </div>
                      <div className="rounded-[1.5rem] overflow-hidden border border-white/10 bg-black shadow-xl">
                        <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" alt="Team reviewing analytics" className="h-[320px] w-full object-cover" />
                        <div className="p-4">
                          <p className="text-sm font-semibold text-white">Team review</p>
                          <p className="mt-2 text-sm text-slate-400">Bringing analytics to life with visual storytelling and live video context.</p>
                        </div>
                      </div>
                    </div>
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
                    <p className="text-sm">There are currently no completed meetings to display.</p>
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
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{completedCount} completed</span>
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
    </div>
  )
}
