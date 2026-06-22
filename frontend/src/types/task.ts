export interface Task {
  _id?: string;
  taskId?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  assignedTo?: { _id: string; name: string; email: string };
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  projectId?: string;
  projectName?: string;
}

export interface TeamTasksResponse {
  teamId: string;
  teamName: string;
  totalTasks: number;
  tasks: Task[];
}

export interface ProjectTasksResponse {
  projectId: string;
  projectName: string;
  projectDescription: string;
  totalTasks: number;
  tasks: Task[];
  stats: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
}