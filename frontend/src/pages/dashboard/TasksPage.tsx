import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, Search, Filter, Clock, Video, Target, Zap } from 'lucide-react'
import { meetingsService } from '../../services/meetings.service'
import { useToast } from '../../components/Toast'

type FilterTab = 'all' | 'pending' | 'completed'

function Skeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 card-base">
          <div className="w-5 h-5 rounded-full bg-muted animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted animate-shimmer rounded-lg w-3/4" />
            <div className="h-3 bg-muted animate-shimmer rounded-lg w-1/3" />
          </div>
          <div className="h-6 w-20 bg-muted animate-shimmer rounded-full" />
        </div>
      ))}
    </div>
  )
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
]

export default function TasksPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({})

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: meetingsService.getAll,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ meetingId, itemId }: { meetingId: string; itemId: string }) =>
      meetingsService.toggleActionItem(meetingId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  })

  const allItems = meetings.flatMap((m) =>
    m.actionItems.map((item) => ({
      ...item,
      meetingTitle: m.title,
      meetingId: m._id,
      meetingStatus: m.status,
    }))
  )

  const getCompleted = (id: string, base: boolean) =>
    optimistic[id] !== undefined ? optimistic[id] : base

  const toggle = (meetingId: string, itemId: string, current: boolean) => {
    setOptimistic((p) => ({ ...p, [itemId]: !current }))
    toggleMutation.mutate({ meetingId, itemId })
    toast('success', !current ? 'Task marked complete!' : 'Task marked pending.')
  }

  const filtered = allItems.filter((item) => {
    const completed = getCompleted(item._id, item.completed)
    const matchSearch =
      item.text.toLowerCase().includes(search.toLowerCase()) ||
      item.meetingTitle.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'pending' && !completed) ||
      (filter === 'completed' && completed)
    return matchSearch && matchFilter
  })

  const counts = {
    all: allItems.length,
    pending: allItems.filter((i) => !getCompleted(i._id, i.completed)).length,
    completed: allItems.filter((i) => getCompleted(i._id, i.completed)).length,
  }

  const completionRate = allItems.length > 0
    ? Math.round((counts.completed / allItems.length) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-7 animate-slide-up">
      {/* Hero Header */}
      <div className="relative group card-base p-10 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 to-transparent dark:from-violet-950/20 dark:to-transparent" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-300/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
              <Target size={14} className="text-violet-500" />
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">AI-Powered Tasks</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Action Items</h1>
            <p className="text-muted-foreground text-base mt-2">All AI-extracted tasks from your meetings with real-time tracking.</p>
          </div>
          {allItems.length > 0 && (
            <div className="flex items-center gap-4 card-base px-6 py-4 shrink-0 bg-gradient-to-br from-violet-500/10 to-transparent">
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/50" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${completionRate} ${100 - completionRate}`}
                    strokeLinecap="round"
                    className="text-violet-500 transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground">{completionRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">completion rate</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {allItems.length > 0 && (
        <div className="relative group card-base p-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-50/30 to-transparent dark:from-violet-950/20 dark:to-transparent" />
          <div className="relative flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-violet-500" />
              <span className="font-semibold text-foreground">Overall Progress</span>
            </div>
            <span className="text-sm font-bold text-foreground bg-muted/60 px-3 py-1 rounded-full">{counts.completed} of {counts.all}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden ring-1 ring-border/50">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-700 shadow-lg shadow-violet-500/50"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground mt-3">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{counts.pending} pending
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{counts.completed} completed
            </span>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or meetings..."
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
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  filter === tab.key ? 'bg-white/20' : 'bg-muted'
                }`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 text-center gap-6 card-base border-2 border-dashed rounded-3xl">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-violet-500" />
          </div>
          <div className="space-y-2 max-w-sm">
            <p className="font-bold text-foreground text-lg">
              {search || filter !== 'all' ? 'No tasks found' : 'No action items yet'}
            </p>
            <p className="text-muted-foreground text-base">
              {search ? `No results for "${search}".`
                : filter === 'completed' ? '🎉 All tasks are pending or none exist yet.'
                : filter === 'pending' ? '🎉 All tasks are completed!'
                : 'AI-extracted tasks from meetings will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const completed = getCompleted(item._id, item.completed)
            return (
              <button
                key={item._id}
                onClick={() => toggle(item.meetingId, item._id, completed)}
                disabled={toggleMutation.isPending}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-200 group ${
                  completed
                    ? 'bg-muted/20 border-border opacity-70 hover:opacity-90'
                    : 'card-base card-hover'
                }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                  completed ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/60'
                }`}>
                  {completed
                    ? <CheckCircle2 size={12} className="text-primary-foreground" />
                    : <Circle size={12} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item.text}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {item.assignee && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center">
                          {item.assignee.charAt(0).toUpperCase()}
                        </span>
                        {item.assignee}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Video size={10} />{item.meetingTitle}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`badge text-[10px] ${
                    item.meetingStatus === 'active' ? 'badge-active'
                      : item.meetingStatus === 'scheduled' ? 'badge-scheduled'
                      : 'badge-ended'
                  }`}>
                    {item.meetingStatus}
                  </span>
                  {completed ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <Clock size={10} /> Done
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to complete
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
