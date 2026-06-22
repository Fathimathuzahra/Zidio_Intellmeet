import { useState } from "react";
import { Users, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Team } from "@/types/teams";

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string | undefined;
  onSelectTeam: (teamId: string) => void;
}

export function TeamSelector({ teams, selectedTeamId, onSelectTeam }: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTeam = teams.find((team) => team._id === selectedTeamId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent transition-all"
      >
        <Users size={16} className="text-primary" />
        <span>{selectedTeam?.name || "Select a team"}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-20 py-1"
            >
              {teams.map((team) => (
                <button
                  key={team._id}
                  onClick={() => {
                    onSelectTeam(team._id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Owner: {typeof team.owner === 'object' ? team.owner.name : team.owner}
                    </p>
                  </div>
                  {selectedTeamId === team._id && <Check size={16} className="text-primary" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}