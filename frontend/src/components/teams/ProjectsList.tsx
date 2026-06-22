import { useState } from "react";
import { FolderKanban, Plus, MoreVertical, Edit2, Trash2, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { CreateProjectModal } from "./CreateProjectModal";
import { useDeleteProject, useProjects } from "@/hooks/use-project";
import type { Project } from "@/types/project";

interface ProjectsListProps {
  teamId: string;
  onViewTasks?: (projectId: string) => void;
}

export function ProjectsList({ teamId,  onViewTasks }: ProjectsListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { data: projects, isLoading } = useProjects(teamId);
  const deleteProject = useDeleteProject();

  const handleDelete = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProject.mutateAsync(projectId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FolderKanban size={32} className="text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground">Create your first project to start tracking tasks</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus size={16} />
            Create Project
          </button>
        </div>

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          teamId={teamId}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">All Projects</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all"
          >
            <Plus size={14} />
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: Project) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FolderKanban size={16} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{project.name}</h3>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setSelectedProject(selectedProject?._id === project._id ? null : project)}
                    className="p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {selectedProject?._id === project._id && (
                    <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          console.log("Edit project", project._id);
                          setSelectedProject(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(project._id);
                          setSelectedProject(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                  <button
                        onClick={() => onViewTasks?.(project._id)}
                        className="text-xs text-primary hover:underline"
                    >
                        View Tasks →
                    </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {project.description || "No description"}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={12} />
                  <span>{project.tasks?.length || 0} tasks</span>
                </div>
              </div>

              {project.tasks && project.tasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex gap-1">
                    {['todo', 'in-progress','review', 'done'].map(status => {
                      const count = project.tasks.filter((t: { status: string }) => t.status === status).length;
                      if (count === 0) return null;
                      const percentage = (count / project.tasks.length) * 100;
                      return (
                        <div key={status} className="flex-1">
                          <div 
                            className={`h-1 rounded-full ${
                              status === 'todo' ? 'bg-gray-500' :
                              status === 'in-progress' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        teamId={teamId}
      />
    </>
  );
}