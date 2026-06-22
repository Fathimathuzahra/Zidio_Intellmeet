import type { Task } from "./task";

export interface Project {
  _id: string;
  name: string;
  description: string;
  team: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  tasks: Task[];
  status: 'active' | 'archived' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export const taskStatuses = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-amber-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'done', label: 'Done', color: 'bg-emerald-500' },
] as const;

export const taskPriorities = [
  { value: 'Critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'High', label: 'High', color: 'bg-orange-500' },
  { value: 'Medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'Low', label: 'Low', color: 'bg-gray-500' },
] as const;