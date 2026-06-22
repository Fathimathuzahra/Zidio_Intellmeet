import { useState } from "react";
import { X, Loader2, Users, ChevronDown, Check } from "lucide-react";
import type { Team } from "@/types/teams";


interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, teamId: string) => Promise<void>;
  teams: Team[];
  selectedTeamId?: string;
  isLoading?: boolean;
}

export function InviteModal({ 
  isOpen, 
  onClose, 
  onInvite, 
  teams,
  selectedTeamId,
  isLoading = false 
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState(selectedTeamId || "");
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const selectedTeam = teams.find(team => team._id === teamId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !teamId) return;
    
    setLoading(true);
    await onInvite(email, teamId);
    setLoading(false);
    setEmail("");
    setTeamId("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border p-6 rounded-xl shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invite a Member</h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Selection */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Select Team
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTeamSelectorOpen(!isTeamSelectorOpen)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm flex items-center justify-between hover:bg-accent/50 transition-colors"
                disabled={isLoading}
              >
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-muted-foreground" />
                  <span className={!selectedTeam ? "text-muted-foreground" : "text-foreground"}>
                    {selectedTeam ? selectedTeam.name : "Choose a team..."}
                  </span>
                </div>
                <ChevronDown size={16} className="text-muted-foreground" />
              </button>

              {isTeamSelectorOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsTeamSelectorOpen(false)} 
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-20 py-1 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                    {teams.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        No teams available
                      </div>
                    ) : (
                      teams.map((team) => (
                        <button
                          key={team._id}
                          type="button"
                          onClick={() => {
                            setTeamId(team._id);
                            setIsTeamSelectorOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{team.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Team ID: {team._id.slice(-6)}
                            </p>
                          </div>
                          {teamId === team._id && (
                            <Check size={16} className="text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Email Address
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              An invitation email will be sent to this address.
            </p>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading || !teamId || !email.trim() || isLoading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {(loading || isLoading) && <Loader2 size={16} className="animate-spin" />}
            Send Invitation
          </button>
        </form>
      </div>
    </div>
  );
}