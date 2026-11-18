import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Plus, Video, Clock, Link2, Play, FileText, Search, Calendar, Trash2, X } from 'lucide-react'
import { meetingsService, type Meeting } from '../../services/meetings.service'
import { useToast } from '../../components/Toast'
import { CreateMeetingModal } from '@/components/meeting/CreateMeetingModal'
import type { FilterTab } from '@/components/meeting/FilterTabs'

const HERO_VIDEO = 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4'
const FEATURED_SPACES = [
  {
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    title: 'Executive Room',
    desc: '12-20 participants',
  },
  {
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    title: 'Collaboration Hub',
    desc: '15-25 participants',
  },
  {
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    title: 'Strategy Room',
    desc: '4-8 participants',
  },
]

function Skeleton() {
  return (
    <div className="card-base overflow-hidden divide-y divide-border">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-muted animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted animate-shimmer rounded-lg w-48" />
            <div className="h-3 bg-muted animate-shimmer rounded-lg w-32" />
          </div>
          <div className="h-7 w-20 bg-muted animate-shimmer rounded-full" />
          <div className="h-8 w-16 bg-muted animate-shimmer rounded-lg" />
        </div>
      ))}
    </div>
  )
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Live' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'ended', label: 'Ended' },
]

export default function MeetingsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [summaryMeeting, setSummaryMeeting] = useState<Meeting | null>(null)

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: meetingsService.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: meetingsService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      toast('success', 'Meeting deleted.')
    },
    onError: () => toast('error', 'Failed to delete meeting.'),
  })

  const createMutation = useMutation({
    mutationFn: meetingsService.create,
    onSuccess: (meeting) => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      setShowModal(false)
      toast('success', `"${meeting.title}" created!`)
      navigate(`/meeting/${meeting.roomId}`)
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Unable to create the meeting. Please try again.'
        : 'Unable to create the meeting. Please try again.'
      toast('error', message)
    },
  })

  const copyLink = (roomId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`)
    toast('info', 'Invite link copied!')
  }

  const filtered = meetings.filter((meeting) => {
    const matchSearch = meeting.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || meeting.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all: meetings.length,
    active: meetings.filter((meeting) => meeting.status === 'active').length,
    scheduled: meetings.filter((meeting) => meeting.status === 'scheduled').length,
    ended: meetings.filter((meeting) => meeting.status === 'ended').length,
  }

  return (
    <div className="min-h-full overflow-y-auto">
      <div className="p-4 xl:p-8">
        <div className="space-y-10">
          <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2rem] bg-slate-950/90 border border-white/10 shadow-2xl shadow-black/40"
      >
        <div className="absolute inset-0 overflow-hidden">
          <video
            src={HERO_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/40 to-transparent" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-24">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary shadow-sm shadow-primary/10">
              <Video size={14} /> Live Collaboration
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">A professional meeting hub for every team.</h1>
            <p className="text-base sm:text-lg text-slate-200/85 max-w-xl">Run smarter meetings with one-click joins, clear summaries, and a polished interface built for presenters, participants, and remote teams.</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={() => setShowModal(true)} className="btn-primary px-6 py-3 text-sm font-semibold shadow-lg shadow-primary/25 w-full sm:w-auto">
                <Plus size={18} /> Start a meeting
              </button>
              <button onClick={() => navigate('/meetings')} className="w-full sm:w-auto text-sm font-medium text-slate-100/90 hover:text-white transition-colors">
                Browse scheduled meetings
              </button>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/40 md:p-6">
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
              <p className="font-semibold text-slate-100">Showcase your meeting culture</p>
              <p>Professional layouts, seamless join flow, and rich meeting summaries help teams stay aligned across every session.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <span className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-200">Instant participant insights</span>
                <span className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-200">Video-ready attendee cards</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          {FEATURED_SPACES.map((space) => (
            <div key={space.title} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-1">
              <div className="h-44 overflow-hidden rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${space.image})` }} />
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Featured space</p>
                <h3 className="text-xl font-bold text-white">{space.title}</h3>
                <p className="text-sm text-slate-300">{space.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">About IntellMeet</span>
          <h2 className="mt-4 text-3xl font-bold">Built for professional teams that need clarity.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">From fast host invites to elegant participant grids and AI-powered summary cards, every detail is designed to keep remote collaboration clean, intuitive, and effective.</p>
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/20 text-primary">01</span>
              <div>
                <p className="font-semibold text-white">Full meeting visibility</p>
                <p className="text-sm text-slate-400">See participants, live status, and summaries in a single pane.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/20 text-primary">02</span>
              <div>
                <p className="font-semibold text-white">Rich content previews</p>
                <p className="text-sm text-slate-400">Add images, videos, and professional sections to elevate every meeting page.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/20 text-primary">03</span>
              <div>
                <p className="font-semibold text-white">Faster team alignment</p>
                <p className="text-sm text-slate-400">Invite, join, and review meeting summaries with polished, full-width layouts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Summary snapshot</p>
          <h3 className="mt-4 text-2xl font-bold">Smart meeting recaps</h3>
          <p className="mt-3 text-sm text-slate-400">Summaries are surfaced instantly so your team can move from meeting to action without searching through chat.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Team efficiency</p>
          <h3 className="mt-4 text-2xl font-bold">Review and follow-up faster</h3>
          <p className="mt-3 text-sm text-slate-400">Detailed action items keep every attendee aligned and all next steps visible in a clean dashboard experience.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Professional experience</p>
          <h3 className="mt-4 text-2xl font-bold">Polished visual layout</h3>
          <p className="mt-3 text-sm text-slate-400">Full-width presentation sections give your meetings the enterprise-quality look and feel teams expect.</p>
        </div>
      </section>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Meetings</p>
          <h2 className="text-2xl font-semibold">All sessions</h2>
        </div>
        <div className="relative flex items-center gap-2 bg-card border border-border rounded-2xl px-3 py-2">
          <Search size={16} className="text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings by title or topic..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === tab.key
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-card text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {tab.label}
            <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-200">
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 text-center gap-6 card-base border-2 border-dashed rounded-3xl">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <Video size={32} className="text-blue-500" />
          </div>
          <div className="space-y-2 max-w-sm">
            <p className="font-bold text-foreground text-lg">
              {search || filter !== 'all' ? 'No meetings found' : 'No meetings yet'}
            </p>
            <p className="text-muted-foreground text-base">
              {search ? `No results for "${search}".` : filter !== 'all' ? `No ${filter} meetings.` : 'Create your first meeting to get started and connect with your team.'}
            </p>
          </div>
          {!search && filter === 'all' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={15} /> New Meeting
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-primary">Meetings overview</p>
                <h2 className="text-3xl font-bold">All meetings and summaries</h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-300">Browse your live, scheduled, and completed sessions with rich previews, invites, and one-click access to the meeting room.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/5 px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Total meetings</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{counts.all}</p>
                </div>
                <div className="rounded-3xl bg-white/5 px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Live</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{counts.active}</p>
                </div>
                <div className="rounded-3xl bg-white/5 px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Scheduled</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{counts.scheduled}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/30">
            <div className="hidden xl:grid grid-cols-[1.2fr_1fr_0.9fr_0.7fr] gap-4 px-6 py-5 border-b border-white/10 bg-slate-950/80 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              <span>Meeting</span>
              <span className="text-center">Status</span>
              <span className="text-center">Participants</span>
              <span className="text-center">Actions</span>
            </div>
            <div className="divide-y divide-white/5">
              {filtered.map((meeting) => {
                const date = meeting.scheduledAt || meeting.createdAt
                const participants = meeting.participants?.length ?? 0

                return (
                  <div key={meeting._id} className="flex flex-col gap-4 px-6 py-5 hover:bg-slate-950/70 transition-colors xl:flex-row xl:items-center xl:justify-between xl:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold ${
                          meeting.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : meeting.status === 'scheduled'
                              ? 'bg-sky-500/10 text-sky-300'
                              : 'bg-slate-700/20 text-slate-300'
                        }`}>
                          <Video size={12} /> {meeting.status === 'active' ? 'Live now' : meeting.status === 'scheduled' ? 'Scheduled' : 'Ended'}
                        </span>
                        <p className="text-base font-semibold text-white truncate">{meeting.title}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(date).toLocaleDateString([], { dateStyle: 'medium' })}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock size={14} />
                          {participants + 1} participants
                        </span>
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{meeting.summary ?? 'No summary available yet — start the meeting to capture notes and action items automatically.'}</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:w-72">
                      <button
                        onClick={() => copyLink(meeting.roomId)}
                        title="Copy invite link"
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                      >
                        <Link2 size={14} /> Copy Link
                      </button>

                      {meeting.status !== 'ended' ? (
                        <button
                          onClick={() => navigate(`/meeting/${meeting.roomId}`)}
                          className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                        >
                          <Play size={14} /> Join
                        </button>
                      ) : (
                        <button
                          onClick={() => setSummaryMeeting(meeting)}
                          className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                        >
                          <FileText size={14} /> Summary
                        </button>
                      )}
                      {meeting.status === 'ended' && (
                        <button
                          onClick={() => { if (confirm('Delete this meeting?')) deleteMutation.mutate(meeting._id) }}
                          className="inline-flex items-center justify-center rounded-2xl bg-red-500/10 px-3 py-3 text-sm text-red-400 transition hover:bg-red-500/20"
                          title="Delete meeting"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
              <span className="text-xs uppercase tracking-[0.3em] text-primary">Customer reviews</span>
              <h3 className="mt-4 text-2xl font-bold">Trusted by teams everywhere</h3>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="font-semibold text-white">“IntellMeet helped our team cut meeting prep time in half. The summary cards are a game changer.”</p>
                  <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">A</span>
                    <span>Amelia R., Product Lead</span>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="font-semibold text-white">“The meetings page looks great and makes it easy to see who is live and who is scheduled.”</p>
                  <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">M</span>
                    <span>Miguel S., Operations</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/30">
              <span className="text-xs uppercase tracking-[0.3em] text-primary">Spotlight</span>
              <h3 className="mt-4 text-2xl font-bold">Recent highlights</h3>
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl bg-white/5 p-5">
                  <p className="font-semibold text-white">Launch call</p>
                  <p className="mt-2 text-sm text-slate-400">A high-impact strategy session with concise follow-ups and project ownership defined.</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-5">
                  <p className="font-semibold text-white">Product sync</p>
                  <p className="mt-2 text-sm text-slate-400">Participant cards and live status made the remote standup feel polished and professional.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {summaryMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><FileText size={18} className="text-primary" /></div>
                <div>
                  <h2 className="font-bold text-lg text-white">{summaryMeeting.title}</h2>
                  <p className="text-xs text-slate-400">{summaryMeeting.endedAt ? new Date(summaryMeeting.endedAt).toLocaleDateString([], { dateStyle: 'medium' }) : ''}</p>
                </div>
              </div>
              <button onClick={() => setSummaryMeeting(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">AI Summary</p>
                <div className="bg-white/5 rounded-xl p-4 text-sm text-slate-200 leading-relaxed border border-white/10">
                  {summaryMeeting.summary || 'No summary available for this meeting.'}
                </div>
              </div>
              {summaryMeeting.actionItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Action Items ({summaryMeeting.actionItems.length})</p>
                  <ul className="space-y-2">
                    {summaryMeeting.actionItems.map((item, i) => (
                      <li key={item._id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${item.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'}`}>{i + 1}</span>
                        <div className="flex-1">
                          <span className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>{item.text}</span>
                          {item.assignee && <p className="text-xs text-slate-400 mt-0.5">→ {item.assignee}</p>}
                        </div>
                        {item.completed && <span className="text-xs text-emerald-400 font-semibold">Done</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <CreateMeetingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />
      </div>
      </div>
    </div>
  )
}
