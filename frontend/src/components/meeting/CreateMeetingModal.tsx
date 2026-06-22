import { useState } from 'react'
import { CalendarClock, Play, X, Users, ChevronDown, Check, Sparkles } from 'lucide-react'
import { useTeams } from '../../hooks/use-team'
import type { Team } from '../../types/teams'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { title: string; scheduledAt?: string; teamId?: string }) => void
  isPending: boolean
}

function TeamSelect({ value, onChange, teams }: { value: string; onChange: (v: string) => void; teams: Team[] | undefined }) {
  const [open, setOpen] = useState(false)
  const selected = teams?.find((t) => t._id === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-base flex items-center justify-between pr-3 text-left"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? selected.name : 'No team (personal meeting)'}
        </span>
        <ChevronDown size={15} className={`text-muted-foreground transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1.5 w-full bg-card border border-border rounded-xl shadow-xl z-20 py-1.5 max-h-56 overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">No team</p>
                  <p className="text-[11px] text-muted-foreground">Personal meeting</p>
                </div>
                {value === '' && <Check size={15} className="text-primary" />}
              </button>
              {teams?.map((team) => (
                <button
                  key={team._id}
                  type="button"
                  onClick={() => { onChange(team._id); setOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{team.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Owner: {typeof team.owner === 'object' ? team.owner.name : team.owner}
                    </p>
                  </div>
                  {value === team._id && <Check size={15} className="text-primary" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function CreateMeetingModal({ isOpen, onClose, onCreate, isPending }: Props) {
  const [title, setTitle]           = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [teamId, setTeamId]         = useState('')
  const { data: teams } = useTeams()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({ title, scheduledAt: scheduledAt || undefined, teamId: teamId || undefined })
    setTitle(''); setScheduledAt(''); setTeamId('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="card-base shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarClock size={17} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">New Meeting</h2>
              <p className="text-xs text-muted-foreground">You'll join the room immediately.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Meeting title</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Product Sync"
              required autoFocus
              className="input-base"
            />
          </div>

          {/* Schedule */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Schedule <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local" value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input-base"
            />
          </div>

          {/* Team */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users size={13} className="text-muted-foreground" />
              Team <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <TeamSelect value={teamId} onChange={setTeamId} teams={teams} />
            {teamId && (
              <div className="flex items-center gap-2 text-xs text-primary bg-primary/8 border border-primary/15 rounded-lg px-3 py-2 mt-1">
                <Sparkles size={12} />
                Team members will receive email invitations
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="btn-primary flex-1"
            >
              {isPending
                ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Creating...</>
                : <><Play size={14} /> Start Meeting</>
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
