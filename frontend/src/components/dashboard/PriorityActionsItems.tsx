import { useState } from 'react'
import { Sparkles, CheckCircle2, Circle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingsService, type Meeting } from '../../services/meetings.service'

interface ActionItem {
  _id: string; text: string; assignee: string; completed: boolean
  meetingTitle?: string; meetingId?: string
}

interface Props { meetings: Meeting[]; isLoading?: boolean }

export function PriorityActionItems({ meetings, isLoading }: Props) {
  const qc = useQueryClient()
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({})

  const allItems: ActionItem[] = meetings
    .flatMap((m) => m.actionItems.map((item) => ({ ...item, meetingTitle: m.title, meetingId: m._id })))
    .slice(0, 6)

  const toggleMutation = useMutation({
    mutationFn: ({ meetingId, itemId }: { meetingId: string; itemId: string }) =>
      meetingsService.toggleActionItem(meetingId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  })

  const toggle = (item: ActionItem) => {
    if (!item.meetingId) return
    setOptimistic((p) => ({ ...p, [item._id]: !(p[item._id] ?? item.completed) }))
    toggleMutation.mutate({ meetingId: item.meetingId, itemId: item._id })
  }

  const getCompleted = (item: ActionItem) =>
    optimistic[item._id] !== undefined ? optimistic[item._id] : item.completed

  const done  = allItems.filter((i) => getCompleted(i)).length
  const total = allItems.length

  return (
    <div className="card-base overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-primary" />
          <h2 className="font-bold text-foreground text-sm">Action Items</h2>
        </div>
        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {done}/{total}
        </span>
      </div>

      {/* Progress */}
      <div className="px-5 pt-3 pb-1">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-500"
            style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="p-4 space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border">
              <div className="w-5 h-5 rounded-full bg-muted animate-shimmer shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-muted animate-shimmer rounded-lg" />
                <div className="h-3 bg-muted animate-shimmer rounded-lg w-20" />
              </div>
            </div>
          ))
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <CheckCircle2 size={24} className="opacity-30" />
            <p className="text-sm">No action items yet</p>
          </div>
        ) : (
          allItems.map((item) => {
            const completed = getCompleted(item)
            return (
              <button
                key={item._id}
                onClick={() => toggle(item)}
                disabled={toggleMutation.isPending}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 group ${
                  completed
                    ? 'bg-muted/20 border-border opacity-60'
                    : 'bg-background border-border hover:border-primary/30 hover:shadow-sm'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 ${
                  completed ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/60'
                }`}>
                  {completed
                    ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <Circle size={10} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium leading-snug ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.assignee && (
                      <span className="text-[10px] text-muted-foreground">→ {item.assignee}</span>
                    )}
                    {item.meetingTitle && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/8 px-1.5 py-0.5 rounded-full border border-primary/15">
                        {item.meetingTitle}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
