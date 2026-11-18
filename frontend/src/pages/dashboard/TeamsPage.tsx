import { useState } from "react";
import { Users, UserPlus, Loader2, FolderKanban, CheckSquare, Video } from "lucide-react";
import { useCreateTeam, useInviteMember, useTeamMembers, useTeams } from "../../hooks/use-team";
import { useAuthStore } from "@/store/useAuthStore";
import { InviteModal } from "../../components/teams/InviteModal";
import { TeamSelector } from "../../components/teams/TeamSelector";
import { CreateTeamModal } from "../../components/teams/CreateTeamModal";
import { MembersList } from "../../components/teams/MembersList";
import { EmptyTeamsState } from "../../components/teams/EmptyTeamsState";
import { ProjectsList } from "../../components/teams/ProjectsList";
import { TeamTasksBoard } from "../../components/teams/TeamTasksBoard";
import { motion } from "framer-motion";
import { type FilterTab } from "@/constants/teamsConstants";

const TEAM_HERO_VIDEO = "/teams/9025801-uhd_3840_2160_25fps.mp4";
const TEAM_IMAGES = [
  { image: '/teams/pexels-pavel-danilyuk-8761812.jpg', title: 'Creative collaboration' },
  { image: '/teams/pexels-gustavo-fring-3874108.jpg', title: 'Focused teamwork' },
  { image: '/teams/pexels-usen-parmanov-442859060-15399856.jpg', title: 'Connected people' },
];

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("projects");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);

  const { data: teams, isLoading: isLoadingTeams, refetch: refetchTeams } = useTeams();
  const activeTeamId = selectedTeamId ?? teams?.[0]?._id;
  const { data: members = [], isLoading: isLoadingMembers } = useTeamMembers(activeTeamId);
  const inviteMutation = useInviteMember();
  const createTeamMutation = useCreateTeam();
  const user = useAuthStore((s) => s.user);
  const currentTeam = teams?.find((t) => t._id === activeTeamId);
  const owner = currentTeam?.owner;
  const ownerId = typeof owner === 'string' ? owner : owner?.id;
  const canRemove = !!user && !!ownerId && user.id === ownerId;
  const hasNoTeams = !teams || teams.length === 0;

  const handleInvite = async (email: string, teamId: string) => {
    try {
      await inviteMutation.mutateAsync({ email, teamId });
      setIsInviteModalOpen(false);
    } catch {
      // keep modal open
    }
  };

  const handleCreateTeam = (teamName: string) => {
    createTeamMutation.mutate(teamName, {
      onSuccess: (newTeam) => { refetchTeams(); setSelectedTeamId(newTeam._id); },
    });
  };

  const handleViewProjectTasks = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab("project-tasks");
  };

  if (isLoadingTeams) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-full overflow-y-auto p-4 xl:p-8">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] bg-slate-950/90 border border-white/10 shadow-2xl shadow-black/40"
        >
          <div className="absolute inset-0 overflow-hidden">
            <video src={TEAM_HERO_VIDEO} autoPlay muted loop playsInline className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary shadow-sm shadow-primary/10">
                  <Video size={14} /> Team Stories
                </span>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">Teams that feel aligned, engaged, and inspired.</h1>
                <p className="max-w-3xl text-xl sm:text-2xl leading-9 text-slate-300/90">A full-width teams experience built around visual storytelling, collaboration spaces, and happy team videos.</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button onClick={() => setIsInviteModalOpen(true)} className="btn-primary px-7 py-4 text-sm font-semibold shadow-2xl shadow-primary/25 w-full sm:w-auto">
                    <UserPlus size={18} /> Invite a colleague
                  </button>
                  <button onClick={() => setIsCreateTeamModalOpen(true)} className="w-full sm:w-auto rounded-3xl border border-white/10 px-6 py-4 text-sm font-semibold text-slate-100/90 hover:text-white transition-colors">
                    Create new team
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/40 md:p-6">
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-primary/40 to-transparent blur-2xl" />
                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/70 shadow-inner">
                  <video src={TEAM_HERO_VIDEO} autoPlay muted loop playsInline className="h-72 w-full object-cover brightness-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>
                <div className="relative mt-5 space-y-3 text-sm text-slate-200">
                  <p className="font-semibold text-slate-100">Happy teams, productive work.</p>
                  <p>Showcase how your team collaborates with an immersive video-first experience.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <span className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-200">People-first culture</span>
                    <span className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-200">Visual collaboration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TEAM_IMAGES.map((item) => (
            <div key={item.title} className="overflow-hidden rounded-[2rem] bg-slate-950/90 border border-white/10 shadow-2xl shadow-black/30">
              <img src={item.image} alt={item.title} className="h-80 w-full object-cover" />
              <div className="p-6">
                <h2 className="text-xl font-bold text-white">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-400">Large, immersive visuals designed to communicate team clarity and momentum.</p>
              </div>
            </div>
          ))}
        </section>

        {!hasNoTeams && <TeamSelector teams={teams} selectedTeamId={activeTeamId} onSelectTeam={setSelectedTeamId} />}

        {!hasNoTeams && activeTeamId && (
          <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-7 shadow-2xl shadow-black/40">
              <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Team health</p>
              <h2 className="mt-4 text-3xl font-bold text-white">Big picture collaboration metrics.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300/90">Meaningful progress and team momentum, surfaced inside one polished workspace.</p>
              <div className="mt-6 grid gap-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('projects')} className="w-full rounded-3xl bg-primary px-5 py-4 text-left text-sm font-semibold text-white transition-all hover:bg-primary/90">View projects</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('team-tasks')} className="w-full rounded-3xl bg-white/5 px-5 py-4 text-left text-sm font-semibold text-slate-100 transition-all hover:bg-white/10">View team tasks</motion.button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-7 shadow-2xl shadow-black/40">
                <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Happy teams video</p>
                <div className="relative mt-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black">
                  <img src="/teams/pexels-wolfart-34676331.jpg" alt="Team collaboration" className="h-64 w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-300/90">A dynamic video showcase celebrating teams that stay aligned and energized.</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-7 shadow-2xl shadow-black/40">
                <p className="text-xs uppercase tracking-[0.32em] text-primary/80">Featured moments</p>
                <div className="mt-4 grid gap-4">
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">Onboarding success</p>
                    <p className="mt-2 text-sm text-slate-400">Teams get up to speed faster with shared meeting rituals.</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">Weekly syncs</p>
                    <p className="mt-2 text-sm text-slate-400">Clear agendas and follow-up make every update count.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!hasNoTeams && activeTeamId && (
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit border border-border">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'projects' ? 'bg-card border border-border text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <FolderKanban size={16} /> Projects
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('team-tasks')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'team-tasks' ? 'bg-card border border-border text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <CheckSquare size={16} /> All Tasks
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'members' ? 'bg-card border border-border text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Users size={16} /> Team Members
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'members' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{members.length}</span>
            </motion.button>
          </div>
        )}

        {hasNoTeams ? (
          <EmptyTeamsState onCreateTeam={() => setIsCreateTeamModalOpen(true)} />
        ) : activeTab === "projects" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <ProjectsList teamId={activeTeamId!} onViewTasks={handleViewProjectTasks} />
          </motion.div>
        ) : activeTab === "team-tasks" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <TeamTasksBoard teamId={activeTeamId!} viewMode="team" />
          </motion.div>
        ) : activeTab === "project-tasks" && selectedProjectId ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <button onClick={() => { setSelectedProjectId(undefined); setActiveTab("projects"); }}
              className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Projects
            </button>
            <TeamTasksBoard teamId={activeTeamId!} projectId={selectedProjectId} viewMode="project" />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <MembersList
              members={members.map((m) => ({ id: m.user._id, name: m.user.name, email: m.user.email, role: m.role === "admin" ? "Admin" : "Member", status: "Active" }))}
              isLoading={isLoadingMembers}
              teamId={activeTeamId}
              canRemove={canRemove}
            />
          </motion.div>
        )}

        <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} onInvite={handleInvite} teams={teams || []} selectedTeamId={activeTeamId} isLoading={inviteMutation.isPending} />
        <CreateTeamModal isOpen={isCreateTeamModalOpen} onClose={() => setIsCreateTeamModalOpen(false)} onCreateTeam={handleCreateTeam} isPending={createTeamMutation.isPending} />
      </div>
    </div>
  );
}
