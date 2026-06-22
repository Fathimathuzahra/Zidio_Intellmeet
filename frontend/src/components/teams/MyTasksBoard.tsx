import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Calendar, User, FolderKanban, AlertCircle, Loader2Icon } from 'lucide-react';
import { useUpdateTaskStatus } from '@/hooks/use-project';
import { useMyTasks } from '@/hooks/use-tasks';
import { useToast } from '@/components/Toast';
import type { Task } from '@/types/task';

const statusColumns = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-amber-500' },
  { id: 'review', title: 'Review', color: 'bg-blue-500' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500' },
];

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export function MyTasksBoard() {
  const { data, isLoading, refetch } = useMyTasks();
  const updateTaskStatus = useUpdateTaskStatus();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

  const tasksArray = optimisticTasks.length > 0 ? optimisticTasks : data?.tasks || [];
  
  const filteredTasks = selectedProject !== "all"
    ? tasksArray.filter(t => t.projectId === selectedProject)
    : tasksArray;
  
  const tasksByStatus = statusColumns.reduce((acc, col) => {
    acc[col.id] = filteredTasks.filter(task => task?.status === col.id);
    return acc;
  }, {} as Record<string, typeof filteredTasks>);

  const projects = data?.tasks 
    ? [...new Map(data.tasks.map(t => [t.projectId, t.projectName])).entries()]
        .map(([id, name]) => ({ id, name }))
    : [];

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const taskId = draggableId;
    const newStatus = destination.droppableId as 'todo' | 'in-progress' | 'review' | 'done';
    
    const task = tasksArray.find(t => t.taskId === taskId);
    if (!task || !task.projectId) return;
    
    const updatedTasks = tasksArray.map(t => {
      if (t.taskId === taskId) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    setOptimisticTasks(updatedTasks);
    
    try {
      await updateTaskStatus.mutateAsync({
        projectId: task.projectId,
        taskId: taskId,
        status: newStatus
      });
      
      const result = await refetch();
      if (result.data) {
        setOptimisticTasks(result.data.tasks || []);
      }
      toast('success', 'Task status updated successfully');
      
    } catch (error) {
      console.error('Failed to update task status:', error);
      const result = await refetch();
      if (result.data) {
        setOptimisticTasks(result.data.tasks || []);
      }
      toast('error', 'Failed to update task status. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2Icon className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!data || data.totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <AlertCircle size={32} className="text-primary" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">No tasks assigned</h3>
          <p className="text-sm text-muted-foreground">
            You don't have any tasks assigned to you yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">My Assigned Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {tasksArray.length} tasks assigned to you across {projects.length} projects
          </p>
        </div>
        
        {projects.length > 0 && (
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {statusColumns.map(col => (
          <div key={col.id} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className={`w-2 h-2 rounded-full ${col.color}`} />
              <span className="text-2xl font-bold text-foreground">
                {tasksByStatus[col.id]?.length || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{col.title}</p>
          </div>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusColumns.map(column => (
            <div key={column.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <span className={`w-2 h-2 rounded-full ${column.color}`} />
                <h3 className="font-semibold text-foreground text-sm">{column.title}</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {tasksByStatus[column.id]?.length || 0}
                </span>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] p-2 rounded-xl transition-all ${
                      snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-muted/20'
                    }`}
                  >
                    {tasksByStatus[column.id]?.map((task, index) => {
                      const taskId = task.taskId || task._id || `${column.id}-${index}`;
                      return (
                      <Draggable key={taskId} draggableId={taskId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-card rounded-lg p-3 mb-2 shadow-sm border transition-all ${
                              snapshot.isDragging 
                                ? 'border-primary shadow-lg rotate-1 scale-105' 
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors[task.priority] || priorityColors.Medium}`}>
                                {task.priority || 'Medium'}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <FolderKanban size={10} />
                                {task.projectName}
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              {task.title}
                            </h4>
                            
                            {task.description && (
                              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                {task.dueDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar size={10} />
                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <User size={10} />
                                <span>Me</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {(!tasksByStatus[column.id] || tasksByStatus[column.id].length === 0) && (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        No tasks
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
