import { Calendar1Icon } from "lucide-react";
import { ActionMenu } from "./ActionMenu";
import { priorityStyles } from "@/constants/teamsConstants";
import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm group cursor-grab active:cursor-grabbing transition-all border-border hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            priorityStyles[task.priority]
          }`}
        >
          {task.priority}
        </span>
        <ActionMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
      <h4 className="text-sm font-semibold text-foreground leading-snug">
        {task.title}
      </h4>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        {/* <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
            {task.assignedTo?.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
            {task.assignedTo?.name}
          </span>
        </div> */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar1Icon size={10} />
          <span className="truncate max-w-[80px]">{task.dueDate?.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}