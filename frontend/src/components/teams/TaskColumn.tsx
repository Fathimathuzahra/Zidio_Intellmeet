import { Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { columnMeta, type TaskStatus } from "@/constants/teamsConstants";
import type { Task } from "@/types/task";

interface TaskColumnProps {
  columnId: TaskStatus;
  tasks: Task[];
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskColumn({ columnId, tasks, onEditTask, onDeleteTask }: TaskColumnProps) {
  const meta = columnMeta[columnId];

  const getTaskId = (task: Task, index: number): string => {
    return task._id || task.taskId || `${columnId}-${index}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        <h3 className="font-semibold text-foreground text-sm">{meta.label}</h3>
        <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex flex-col gap-2.5 min-h-[480px] p-2.5 rounded-2xl border transition-all duration-200 ${
              snapshot.isDraggingOver
                ? "bg-primary/5 border-primary/30 scale-[1.01]"
                : `${meta.bg} border-border`
            }`}
          >
            
            {tasks.map((task, index) => {
              const taskId = getTaskId(task, index);
              return (
                <Draggable key={taskId} draggableId={taskId} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={snapshot.isDragging ? "relative z-50" : ""}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileDrag={{ scale: 1.05, rotate: 1, transition: { duration: 0.2 } }}
                        className={snapshot.isDragging ? "shadow-2xl" : ""}
                      >
                        <TaskCard
                          task={task}
                          onEdit={() => onEditTask(taskId)}
                          onDelete={() => onDeleteTask(taskId)}
                        />
                      </motion.div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
            {tasks.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground/40 text-xs py-8">
                Drop tasks here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
