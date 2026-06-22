import { Users, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyTeamsStateProps {
  onCreateTeam: () => void;
}

export function EmptyTeamsState({ onCreateTeam }: EmptyTeamsStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-2xl bg-muted/10 p-8 text-center"
    >
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Users size={48} className="text-primary" />
      </div>
      <h3 className="font-bold text-xl text-foreground mb-2">Welcome to Teams</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Create your first team to start collaborating with members and managing projects.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateTeam}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md"
      >
        <PlusCircle size={18} />
        Create Your First Team
      </motion.button>
    </motion.div>
  );
}