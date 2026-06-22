import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Shield, Search, Calendar, CheckSquare, Crown } from 'lucide-react'
import { teamsService } from '../../services/teams.service'
import { MyTasksBoard } from '../../components/teams/MyTasksBoard'

type FilterTab = 'teams' | 'tasks'

export default function MyTeamsPage() {
  const [search, setSearch]         = useState('')
  const [activeTab, setActiveTab]   = useState<FilterTab>('teams')

  const { data: joinedTeams = [], isLoading } = useQuery({
    queryKey: ['teams', 'joined'],
    queryFn: teamsService.getJoinedTeams,
  })

  const filtered = joinedTeams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const TABS = [
    { key: 'teams' as FilterTab, label: 'My Teams',  icon: Users,       count: joinedTeams.length },
    { key: 'tasks' as FilterTab, label: 'My Tasks',  icon: CheckSquare, count: undefined },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">My Workspace</h1>
          <p className="section-subtitle">Teams you've joined and tasks assigned to you.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams..."
          className="input-base pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit border border-border">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-card border border-border text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={15} />
            {label}
            {count !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'teams' ? (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted animate-shimmer rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-5 card-base border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users size={26} className="text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">No teams found</p>
              <p className="text-sm text-muted-foreground">
                {search ? `No results match "${search}".` : "You haven't joined any team yet. Ask your admin for an invite."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((team) => (
              <div key={team._id} className="card-base p-5 card-hover group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Users size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{team.name}</h3>
                      <p className="text-xs text-muted-foreground">{team.members?.length ?? 1} members</p>
                    </div>
                  </div>
                  <span className="badge badge-ended">
                    <Shield size={9} /> Member
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Crown size={11} className="text-amber-500 shrink-0" />
                    <span>Owner: <strong className="font-semibold text-foreground">{team.owner?.name || 'Unknown'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={11} className="shrink-0" />
                    <span>Joined {new Date(team.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card-base p-6">
          <MyTasksBoard />
        </div>
      )}
    </div>
  )
}
