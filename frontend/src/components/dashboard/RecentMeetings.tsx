import { Video, Clock, ChevronRight, Search, Sparkles, Radio } from 'lucide-react'
import type { Meeting } from '../../services/meetings.service'
import { useNavigate } from 'react-router-dom'

interface RecentMeetingsProps {
  meetings: Meeting[]
  isLoading?: boolean
  onViewAll?: () => void
  searchTerm?: string
  onSearchChange?: (value: string) => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

function getMeetingDuration(m: Meeting) {
  if (!m.startedAt || !m.endedAt) return null
  const mins = Math.round((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000)
  return mins > 0 ? `${mins}m` : null
}

export function RecentMeetings({ meetings, isLoading, onViewAll, searchTerm = '', onSearchChange }: RecentMeetingsProps) {
  const navigate = useNavigate()
  return (
    <div className="card-base overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Video size={15} className="text-primary" />
          <h2 className="font-bold text-foreground text-sm">Recent Meetings</h2>
        </div>
        <div className="flex items-center gap-3">
          {onSearchChange && (
            <label className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-muted-foreground focus-within:border-primary">
              <Search size={13} aria-hidden="true" />
              <input
                aria-label="Search meetings"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search"
                className="w-24 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
          )}
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-4 transition-colors"
          >
            View all <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-xl bg-muted animate-shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-muted animate-shimmer rounded-lg w-36" />
                <div className="h-3 bg-muted animate-shimmer rounded-lg w-20" />
              </div>
              <div className="h-6 w-16 bg-muted animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Video size={26} className="opacity-30" />
          <p className="text-sm">No meetings yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {meetings.slice(0, 5).map((m) => (
            <button
              key={m._id}
              onClick={() => m.status !== 'ended' ? navigate(`/meeting/${m.roomId}`) : undefined}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors group ${
                m.status !== 'ended' ? 'cursor-pointer hover:bg-accent/40' : 'cursor-default hover:bg-muted/20'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                m.status === 'active'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary'
              }`}>
                {m.status === 'active' ? <Radio size={14} /> : <Video size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{m.title}</p>
                  {m.status === 'active' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <Clock size={10} />
                  <span>{timeAgo(m.endedAt ?? m.startedAt ?? m.createdAt)}</span>
                  {getMeetingDuration(m) && <><span>·</span><span>{getMeetingDuration(m)}</span></>}
                </div>
              </div>
              {m.status === 'ended' && m.summary ? (
                <span className="shrink-0 badge badge-primary"><Sparkles size={9} />AI</span>
              ) : (
                <span className={`shrink-0 badge ${
                  m.status === 'active' ? 'badge-active' : m.status === 'scheduled' ? 'badge-scheduled' : 'badge-ended'
                }`}>{m.status}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
