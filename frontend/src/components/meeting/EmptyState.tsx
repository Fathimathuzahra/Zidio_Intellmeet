import { Video, Plus } from "lucide-react";

interface EmptyStateProps {
  search: string;
  filter: string;
  onNewMeeting: () => void;
}

export function EmptyState({ search, filter, onNewMeeting }: EmptyStateProps) {
  const getMessage = () => {
    if (search) return `No results for "${search}".`;
    if (filter !== "all") return `No ${filter} meetings.`;
    return "Create your first meeting to get started.";
  };

  const showButton = !search && filter === "all";

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-5 bg-card rounded-2xl border border-dashed border-border">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Video size={26} className="text-primary" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">
          {search || filter !== "all" ? "No meetings found" : "No meetings yet"}
        </p>
        <p className="text-sm text-muted-foreground">{getMessage()}</p>
      </div>
      {showButton && (
        <button
          onClick={onNewMeeting}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20"
        >
          <Plus size={15} />
          New Meeting
        </button>
      )}
    </div>
  );
}