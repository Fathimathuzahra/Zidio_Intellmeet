import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Shield, Search, Sparkles } from 'lucide-react'
import { teamsService } from '../../services/teams.service'
import { MyTasksBoard } from '../../components/teams/MyTasksBoard'

type FilterTab = 'teams' | 'tasks'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'teams', label: 'My Teams' },
  { key: 'tasks', label: 'My Tasks' },
]

export default function MyTeamsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('teams')

  const { data: joinedTeams = [], isLoading } = useQuery({
    queryKey: ['teams', 'joined'],
    queryFn: teamsService.getJoinedTeams,
  })

  const filteredTeams = useMemo(
    () => joinedTeams.filter((team) => team.name.toLowerCase().includes(search.toLowerCase())),
    [joinedTeams, search]
  )

  const totalMembers = useMemo(
    () => joinedTeams.reduce((sum, team) => sum + (team.members?.length ?? 1), 0),
    [joinedTeams]
  )

  return (
    <div className="min-h-full overflow-y-auto p-4 xl:p-8">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-black/20"
        >
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] p-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                <Sparkles size={14} /> Workspace overview
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">My Workspace</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                  Stay on top of your joined teams, active members, and workload with a cleaner workspace experience.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-400">Teams joined</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{joinedTeams.length}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-400">Total members</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{totalMembers}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <p className="text-sm text-slate-400">Tasks summary</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{activeTab === 'tasks' ? 'Assigned' : 'Available'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 shadow-inner shadow-black/20">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Workspace spotlight</p>
              <h2 className="mt-4 text-2xl font-bold text-white">Your current organization at a glance</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">Review your joined teams, see member counts, and keep your tasks front and center without switching context.</p>
              <div className="mt-6 space-y-3">
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Team activity</p>
                  <p className="mt-2 text-sm text-slate-200">Your teams are ready for collaboration. Check for invites, new assignments, or follow-up actions from your admin.</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Focus mode</p>
                  <p className="mt-2 text-sm text-slate-200">Collapse the sidebar to expand content, then dive into tasks or team details with no distractions.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Team workspace</h2>
                <p className="text-sm text-slate-400">Browse the teams you belong to or jump to your task board.</p>
              </div>
              <div className="relative max-w-md w-full">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search teams..."
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20'
                      : 'bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'teams' ? (
              isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-3xl bg-slate-900/70 animate-pulse" />)}
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="card-base border-dashed p-10 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <Users size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">No workspace teams found</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {search ? `No results match "${search}".` : "You haven't joined any team yet. Ask your admin for an invite."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredTeams.map((team) => (
                    <div key={team._id} className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Team</p>
                          <h3 className="mt-2 text-xl font-semibold text-white">{team.name}</h3>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          <Shield size={12} /> Member
                        </span>
                      </div>
                      <div className="mt-5 space-y-3 text-sm text-slate-400">
                        <p>{team.members?.length ?? 1} members • Owner {team.owner?.name || 'Unknown'}</p>
                        <p>Joined {new Date(team.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/teams/${team._id}`)}
                        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                      >
                        View team
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="card-base overflow-hidden">
                <MyTasksBoard />
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quick actions</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Need a team invite?</p>
                  <p className="mt-2 text-sm text-slate-400">Ask your workspace admin to send a new invitation link or accept it on the invite page.</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Pro tip</p>
                  <p className="mt-2 text-sm text-slate-400">Toggle the sidebar to focus on work and keep the layout uncluttered.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Members breakdown</p>
              <div className="mt-4 space-y-3 text-slate-300">
                <div className="flex items-center justify-between text-sm">
                  <span>Teams joined</span>
                  <span className="font-semibold text-white">{joinedTeams.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total members</span>
                  <span className="font-semibold text-white">{totalMembers}</span>
                </div>
                <div className="rounded-3xl bg-white/5 p-4 text-sm text-slate-400">
                  Want more details? Select a team card or head to the Teams page for admin controls.
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
