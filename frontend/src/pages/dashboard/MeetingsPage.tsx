import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Video, Clock, Link2, Play, FileText, Search, Filter, Calendar } from 'lucide-react'
import { meetingsService } from '../../services/meetings.service'
import { useToast } from '../../components/Toast'
import { CreateMeetingModal } from '@/components/meeting/CreateMeetingModal'
import type { FilterTab } from '@/components/meeting/FilterTabs'

const STATUS_STYLES: Record<string, string> = {
  active:    'badge-active',
  scheduled: 'badge-scheduled',
  ended:     'badge-ended',
}

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

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: meetingsService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: meetingsService.create,
    onSuccess: (meeting) => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      setShowModal(false)
      toast('success', `"${meeting.title}" created!`)
      navigate(`/meeting/${meeting.roomId}`)
    },
    onError: () => toast('error', 'Failed to create meeting.'),
  })

  const copyLink = (roomId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`)
    toast('info', 'Invite link copied!')
  }

  const filtered = meetings.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || m.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all: meetings.length,
    active: meetings.filter((m) => m.status === 'active').length,
    scheduled: meetings.filter((m) => m.status === 'scheduled').length,
    ended: meetings.filter((m) => m.status === 'ended').length,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-slide-up">
      {/* Hero Header */}
      <div className="relative group card-base p-10 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent dark:from-blue-950/20 dark:to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
              <Video size={14} className="text-blue-500" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Meeting Management</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Your Meetings</h1>
            <p className="text-muted-foreground text-base mt-2">Schedule, join, and review all your team meetings in one place.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary h-12 text-base font-semibold shadow-lg shadow-primary/30 shrink-0">
            <Plus size={18} /> New Meeting
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings by title or topic..."
            className="input-base pl-12 h-11 text-base"
          />
        </div>
        <div className="flex items-center gap-2 bg-card p-2 rounded-2xl border border-border shrink-0">
          <Filter size={14} className="text-muted-foreground ml-2 shrink-0" />
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === tab.key
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  filter === tab.key ? 'bg-primary-foreground/20' : 'bg-muted'
                }`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Meeting Spaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { image: '/alex-tyson-ozw0wVn33Ac-unsplash.jpg', title: 'Executive Room', desc: '12-20 participants' },
          { image: '/point3d-commercial-imaging-ltd-gOhIWNwOvbw-unsplash.jpg', title: 'Collaboration Hub', desc: '15-25 participants' },
          { image: '/roberto-nickson-tleCJiDOri0-unsplash.jpg', title: 'Strategy Room', desc: '4-8 participants' },
        ].map((space) => (
          <button
            key={space.title}
            onClick={() => setShowModal(true)}
            className="relative group overflow-hidden rounded-2xl h-40 card-base hover:shadow-lg transition-all cursor-pointer"
          >
            <img 
              src={space.image} 
              alt={space.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-base font-bold text-white">{space.title}</h3>
              <p className="text-xs text-white/80">{space.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
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
        <div className="card-base overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Meeting</span>
            <span className="w-24 text-center">Status</span>
            <span className="w-8" />
            <span className="w-20" />
          </div>
          <div className="divide-y divide-border">
            {filtered.map((meeting) => {
              const date = meeting.scheduledAt || meeting.createdAt
              return (
                <div key={meeting._id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors group">
                  {/* Icon + info */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    meeting.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                  }`}>
                    <Video size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{meeting.title}</p>
                      {meeting.status === 'active' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar size={11} />
                        {new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={11} />
                        {meeting.participants.length + 1} participant{meeting.participants.length !== 0 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`hidden sm:inline-flex shrink-0 ${STATUS_STYLES[meeting.status] ?? 'badge-ended'}`}>
                    {meeting.status}
                  </span>

                  {/* Copy link */}
                  <button
                    onClick={() => copyLink(meeting.roomId)}
                    title="Copy invite link"
                    className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  >
                    <Link2 size={14} />
                  </button>

                  {/* Action */}
                  {meeting.status !== 'ended' ? (
                    <button
                      onClick={() => navigate(`/meeting/${meeting.roomId}`)}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/20 shrink-0"
                    >
                      <Play size={11} /> Join
                    </button>
                  ) : (
                    <button className="flex items-center gap-1.5 btn-secondary px-3.5 py-1.5 h-auto text-xs shrink-0">
                      <FileText size={11} /> Summary
                    </button>
                  )}
                </div>
              )
            })}
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
  )
}
