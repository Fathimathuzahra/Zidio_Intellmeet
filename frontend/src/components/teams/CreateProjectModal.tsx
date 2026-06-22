import { useState } from "react";
import { X, FolderKanban, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCreateProject } from "@/hooks/use-project";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

export function CreateProjectModal({ isOpen, onClose, teamId }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createProject = useCreateProject();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    await createProject.mutateAsync({
      name, description, teamId 
    });
    
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Create New Project</h2>
                <p className="text-xs text-muted-foreground">Organize tasks and track progress</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mobile App Development"
                className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this project is about..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted/60 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProject.isPending || !name.trim()}
                className="flex-1 h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-55 flex items-center justify-center gap-2"
              >
                {createProject.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderKanban size={16} /> Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}