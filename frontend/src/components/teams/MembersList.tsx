import { useState } from "react";
import { Search, Users, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/Toast";
import { useRemoveMember } from "../../hooks/use-team";

interface Member {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface MembersListProps {
  members: Member[];
  isLoading: boolean;
  teamId?: string;
  canRemove?: boolean;
}

export function MembersList({ members, isLoading, teamId, canRemove = false }: MembersListProps) {
  const { toast } = useToast();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const removeMember = useRemoveMember(teamId || "");
  const [search, setSearch] = useState("");

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
        <Users size={28} className="opacity-30" />
        <p className="text-sm">No members found</p>
        <p className="text-xs opacity-70">
          {search ? "Try a different search term" : "Invite members to get started"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full h-9 bg-background border border-input rounded-xl py-2 px-4 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 transition-all"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filteredMembers.length} of {members.length} members
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground tracking-wider bg-muted/10">
              <th className="px-6 py-3.5 font-semibold">User</th>
              <th className="px-6 py-3.5 font-semibold">Role</th>
              <th className="px-6 py-3.5 font-semibold">Status</th>
              <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredMembers.map((member, index) => (
              <motion.tr
                key={member.id ?? member.email}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-muted/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      member.role === "Admin"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        member.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-sm text-foreground">{member.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canRemove && (
                      <button
                        onClick={async () => {
                          if (!member.id) return;
                          if (!confirm(`Remove ${member.name} from the team?`)) return;
                          setRemovingId(member.id);
                          try {
                            await removeMember.mutateAsync(member.id);
                            toast('success', `${member.name} removed`);
                          } catch {
                            toast('error', 'Failed to remove member');
                          } finally {
                            setRemovingId(null);
                          }
                        }}
                        disabled={!member.id || removingId === member.id}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove member"
                      >
                        {removingId === member.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
