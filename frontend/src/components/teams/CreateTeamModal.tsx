import { useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (name: string) => void;
  isPending: boolean;
}

export function CreateTeamModal({ isOpen, onClose, onCreateTeam, isPending }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    onCreateTeam(teamName);
    setTeamName("");
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
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PlusCircle size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Create New Team</h2>
              <p className="text-xs text-muted-foreground">Start collaborating with your team</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Team Name</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Engineering, Design, Marketing"
                className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 transition-all"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted/60 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !teamName.trim()}
                className="flex-1 h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20 disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                Create Team
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}