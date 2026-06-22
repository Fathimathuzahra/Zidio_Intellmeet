import { useState } from "react";
import { X, Calendar, User, Flag, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAddTask } from "@/hooks/use-project";
import { useTeamMembers } from "@/hooks/use-team";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  teamId: string;
}

const priorities = [
  { value: 'Critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'High', label: 'High', color: 'bg-orange-500' },
  { value: 'Medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'Low', label: 'Low', color: 'bg-gray-500' },
];

const statuses = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

interface Member {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  role: string;
}

export function CreateTaskModal({ isOpen, onClose, projectId, teamId }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("todo");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  const addTask = useAddTask();
  const { data: members } = useTeamMembers(teamId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedMember = members?.find((m: Member) => m.user._id === assignedTo);
    
    await addTask.mutateAsync({
      projectId,
      data: {
        title,
        description,
        priority: priority as 'Critical' | 'High' | 'Medium' | 'Low',
        status: status as 'todo' | 'in-progress' | 'review' | 'done',

        assignedTo: selectedMember ? {
          _id: selectedMember.user._id,
          name: selectedMember.user.name,
          email: selectedMember.user.email,
        } : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      }
    });

    setTitle("");
    setDescription("");
    setPriority("Medium");
    setStatus("todo");
    setAssignedTo("");
    setDueDate("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Create New Task</h2>
              <p className="text-xs text-muted-foreground mt-1">Add a task to track progress</p>
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
                Task Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Implement login functionality"
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
                placeholder="Describe what needs to be done..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground flex items-center gap-2">
                  <Flag size={14} /> Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 transition-all"
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 transition-all"
                >
                  {statuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground flex items-center gap-2">
                  <User size={14} /> Assign to
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 transition-all"
                >
                  <option value="">Unassigned</option>
                  {members?.map((member: Member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name} ({member.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground flex items-center gap-2">
                  <Calendar size={14} /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 transition-all"
                />
              </div>
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
                disabled={addTask.isPending || !title.trim()}
                className="flex-1 h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-55 flex items-center justify-center gap-2"
              >
                {addTask.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create Task</>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}