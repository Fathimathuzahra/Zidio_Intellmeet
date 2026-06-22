import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActionMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActionMenu({ onEdit, onDelete }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreVertical size={13} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 mt-1.5 w-36 bg-card border border-border rounded-xl shadow-xl z-20 py-1"
            >
              <button
                onClick={() => {
                  onEdit?.();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors"
              >
                Edit Task
              </button>
              <button
                onClick={() => {
                  onDelete?.();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                Delete Task
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}