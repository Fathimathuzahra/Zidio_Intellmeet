import api from "@/lib/api";
import type { ProjectTasksResponse, TeamTasksResponse } from "@/types/task";

export const taskService = {
  getTeamTasks: (teamId: string) => 
    api.get<TeamTasksResponse>(`/projects/tasks/team/${teamId}`),
  
  getProjectTasks: (projectId: string) => 
    api.get<ProjectTasksResponse>(`/projects/${projectId}/tasks`),
  
  getMyTasks: () => api.get<ProjectTasksResponse>('/projects/tasks/me'),

  getMyTasksInTeam: (teamId: string) => 
    api.get<TeamTasksResponse>(`/projects/tasks/team/${teamId}/user`),
  
  getUserTasksInTeam: (teamId: string, userId: string) => 
    api.get<TeamTasksResponse>(`/projects/tasks/team/${teamId}/user/${userId}`),
};