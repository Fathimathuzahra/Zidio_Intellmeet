export function MeetingSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0"
        >
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded-lg w-48" />
            <div className="h-3 bg-muted animate-pulse rounded-lg w-32" />
          </div>
          <div className="h-7 w-16 bg-muted animate-pulse rounded-lg" />
        </div>
      ))}
    </div>
  );
}