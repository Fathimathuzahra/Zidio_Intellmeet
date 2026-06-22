import type { Project } from '@/types/project';
import api from '../lib/api';
import type { Task } from '@/types/task';

export const projectService = {
  getProjectsByTeam: (teamId: string) => 
    api.get<Project[]>(`/projects/team/${teamId}`),
  
  getProject: (id: string) => 
    api.get<Project>(`/projects/${id}`),
  
  create: (data: { name: string; description?: string; teamId: string }) => 
    api.post<Project>('/projects', data),
  
  update: (id: string, data: { name?: string; description?: string }) => 
    api.put<Project>(`/projects/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/projects/${id}`),
  
  addTask: (projectId: string, data: Omit<Task, '_id' | 'createdAt' | 'updatedAt'>) => 
    api.post<Project>(`/projects/${projectId}/tasks`, data),
  
  updateTask: (projectId: string, taskId: string, data: Partial<Task>) => 
    api.put<Project>(`/projects/${projectId}/tasks/${taskId}`, data),
  
  updateTaskStatus: (projectId: string, taskId: string, status: Task['status']) => 
    api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status }),
  
  deleteTask: (projectId: string, taskId: string) => 
    api.delete(`/projects/${projectId}/tasks/${taskId}`),
};