import { Clock, Users, Play, FileText, Link2, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Meeting {
  _id: string;
  roomId: string;
  title: string;
  status: "scheduled" | "active" | "ended";
  scheduledAt?: string;
  createdAt: string;
  participants: unknown[];
}

interface MeetingCardProps {
  meeting: Meeting;
  onCopyLink: (roomId: string) => void;
}

const statusStyles: Record<string, string> = {
  scheduled:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40",
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40",
  ended: "bg-muted text-muted-foreground border border-border",
};

export function MeetingCard({ meeting, onCopyLink }: MeetingCardProps) {
  const navigate = useNavigate();

  const getMeetingDate = () => {
    if (meeting.scheduledAt) {
      return new Date(meeting.scheduledAt).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
    return new Date(meeting.createdAt).toLocaleDateString([], {
      dateStyle: "medium",
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent/40 transition-colors group">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
            meeting.status === "active"
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-primary/10 group-hover:bg-primary/20 text-primary"
          }`}
        >
          <Video size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {meeting.title}
            </p>
            {meeting.status === "active" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={11} />
              {getMeetingDate()}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={11} />
              {meeting.participants.length + 1} participant
              {meeting.participants.length !== 0 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            statusStyles[meeting.status] ?? statusStyles.ended
          }`}
        >
          {meeting.status}
        </span>

        <button
          onClick={() => onCopyLink(meeting.roomId)}
          title="Copy meeting link"
          className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Link2 size={14} />
        </button>

        {meeting.status !== "ended" ? (
          <button
            onClick={() => navigate(`/meeting/${meeting.roomId}`)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/20"
          >
            <Play size={11} />
            Join
          </button>
        ) : (
          <button
            onClick={() => navigate(`/meetings/${meeting._id}`)}
            className="flex items-center gap-1.5 bg-muted text-foreground px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-accent transition-colors border border-border"
          >
            <FileText size={11} />
            Summary
          </button>
        )}
      </div>
    </div>
  );
}
