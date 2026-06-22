import { useState } from "react";
import { Users, ExternalLink, UserPlus, PlusCircle, Loader2, FolderKanban, CheckSquare } from "lucide-react";
import { useCreateTeam, useInviteMember, useTeamMembers, useTeams } from "../../hooks/use-team";
import { InviteModal } from "../../components/teams/InviteModal";
import { TeamSelector } from "../../components/teams/TeamSelector";
import { CreateTeamModal } from "../../components/teams/CreateTeamModal";
import { MembersList } from "../../components/teams/MembersList";
import { EmptyTeamsState } from "../../components/teams/EmptyTeamsState";
import { SummaryStrip } from "../../components/teams/SummaryStrip";
import { ProjectsList } from "../../components/teams/ProjectsList";
import { TeamTasksBoard } from "../../components/teams/TeamTasksBoard";
import { motion } from "framer-motion";
import { initialTasks, type FilterTab } from "@/constants/teamsConstants";

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("projects"); 
  const [tasks] = useState(initialTasks);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);

  const { data: teams, isLoading: isLoadingTeams, refetch: refetchTeams } = useTeams();
  const { data: members = [], isLoading: isLoadingMembers } = useTeamMembers(selectedTeamId);
  const inviteMutation = useInviteMember();
  const createTeamMutation = useCreateTeam();

  if (!isLoadingTeams && teams && teams.length > 0 && !selectedTeamId) {
    setSelectedTeamId(teams[0]._id);
  }

  const handleInvite = async (email: string, teamId: string) => {
    inviteMutation.mutate({ email, teamId });
  };

  const handleCreateTeam = (teamName: string) => {
    createTeamMutation.mutate(teamName, {
      onSuccess: (newTeam) => {
        refetchTeams();
        setSelectedTeamId(newTeam._id);
      },
    });
  };

  const handleViewProjectTasks = (projectId: string) => {
    console.log("Viewing tasks for project:", projectId);
    setSelectedProjectId(projectId);
    setActiveTab("project-tasks");
  };

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in-progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const hasNoTeams = !teams || teams.length === 0;

  if (isLoadingTeams) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto space-y-7">
      {/* Hero Header */}
      <div className="relative group card-base p-10 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent dark:from-indigo-950/20 dark:to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
              <Users size={14} className="text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Team Collaboration</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Team Workspace</h1>
            <p className="text-muted-foreground text-base mt-2">Manage team members, projects, and AI-generated action items with real-time collaboration.</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!hasNoTeams && (
              <>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 bg-muted/60 hover:bg-muted text-foreground px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-border hover:border-primary/30">
                  <ExternalLink size={16} /> Export
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20">
                  <UserPlus size={16} /> Invite Member
                </motion.button>
              </>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsCreateTeamModalOpen(true)} className="flex items-center gap-2 border border-primary text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/5 transition-all">
              <PlusCircle size={16} /> New Team
            </motion.button>
          </div>
        </div>
      </div>

      {/* Team Selector */}
      {!hasNoTeams && <TeamSelector teams={teams} selectedTeamId={selectedTeamId} onSelectTeam={setSelectedTeamId} />}

      {/* Summary Strip - Only in board mode */}
      {!hasNoTeams && selectedTeamId && activeTab === "board" && tasks.length > 0 && (
        <SummaryStrip todoCount={todoCount} inProgressCount={inProgressCount} doneCount={doneCount} />
      )}

      {/* Tabs */}
      {!hasNoTeams && selectedTeamId && (
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit border border-border">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => setActiveTab("projects")} 
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "projects" ? "bg-card border border-border text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <FolderKanban size={16} /> Projects
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => setActiveTab("team-tasks")} 
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "team-tasks" ? "bg-card border border-border text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <CheckSquare size={16} /> All Tasks
          </motion.button>
          {/* <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => setActiveTab("board")} 
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "board" ? "bg-card border border-border text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Layout size={16} /> Task Board
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "board" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{tasks.length}</span>
          </motion.button> */}
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => setActiveTab("members")} 
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "members" ? "bg-card border border-border text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users size={16} /> Team Members
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "members" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{members.length}</span>
          </motion.button>
        </div>
      )}

      {/* Team Collaboration Spaces */}
      {!hasNoTeams && selectedTeamId && (
        <div className="relative group card-base p-8 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-pink-50/20 dark:from-purple-950/10 dark:to-pink-950/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative mb-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              Team Collaboration Spaces
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Premium meeting environments for your team</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { image: '/alex-tyson-ozw0wVn33Ac-unsplash.jpg', title: 'Executive Boardroom', members: '12-20' },
              { image: '/point3d-commercial-imaging-ltd-gOhIWNwOvbw-unsplash.jpg', title: 'Innovation Lab', members: '15-25' },
              { image: '/roberto-nickson-tleCJiDOri0-unsplash.jpg', title: 'Focus Room', members: '4-8' },
            ].map((space) => (
              <div key={space.title} className="relative group/space overflow-hidden rounded-2xl h-44 card-base cursor-pointer">
                <img 
                  src={space.image}
                  alt={space.title}
                  className="w-full h-full object-cover group-hover/space:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-sm font-bold text-white">{space.title}</p>
                  <p className="text-xs text-white/80">Up to {space.members} members</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {hasNoTeams ? (
        <EmptyTeamsState onCreateTeam={() => setIsCreateTeamModalOpen(true)} />
      ) : activeTab === "projects" ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <ProjectsList 
            teamId={selectedTeamId!} 
            onViewTasks={handleViewProjectTasks}
          />
        </motion.div>
      ) : activeTab === "team-tasks" ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <TeamTasksBoard 
            teamId={selectedTeamId!} 
            viewMode="team"
          />
        </motion.div>
      ) : activeTab === "project-tasks" && selectedProjectId ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <button
            onClick={() => {
              setSelectedProjectId(undefined);
              setActiveTab("projects");
            }}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Projects
          </button>
          <TeamTasksBoard 
            teamId={selectedTeamId!} 
            projectId={selectedProjectId}
            viewMode="project"
          />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <MembersList members={members.map((m) => ({ name: m.user.name, email: m.user.email, role: m.role === "admin" ? "Admin" : "Member", status: "Active" }))} isLoading={isLoadingMembers} />
        </motion.div>
      )}

      {/* Modals */}
      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} onInvite={handleInvite} teams={teams || []} selectedTeamId={selectedTeamId} isLoading={inviteMutation.isPending} />
      <CreateTeamModal isOpen={isCreateTeamModalOpen} onClose={() => setIsCreateTeamModalOpen(false)} onCreateTeam={handleCreateTeam} isPending={createTeamMutation.isPending} />
    </motion.div>
  );
}