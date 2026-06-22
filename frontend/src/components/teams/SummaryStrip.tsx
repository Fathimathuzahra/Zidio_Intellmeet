import { motion } from "framer-motion";

interface SummaryStripProps {
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
}

export function SummaryStrip({ todoCount, inProgressCount, doneCount }: SummaryStripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3"
    >
      <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">To Do</p>
          <p className="text-lg font-bold text-foreground tabular-nums">{todoCount}</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">In Progress</p>
          <p className="text-lg font-bold text-foreground tabular-nums">{inProgressCount}</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">Done</p>
          <p className="text-lg font-bold text-foreground tabular-nums">{doneCount}</p>
        </div>
      </div>
    </motion.div>
  );
}