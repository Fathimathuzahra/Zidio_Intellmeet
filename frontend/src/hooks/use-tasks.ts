import { useQuery } from '@tanstack/react-query';
import { taskService } from '../services/task.service';

export const useTeamTasks = (teamId: string) => {
  return useQuery({
    queryKey: ['tasks', 'team', teamId],
    queryFn: () => taskService.getTeamTasks(teamId),
    enabled: !!teamId,
    select: (data) => data.data,
  });
};

export const useProjectTasks = (projectId: string) => {
  return useQuery({
    queryKey: ['tasks', 'project', projectId],
    queryFn: () => taskService.getProjectTasks(projectId),
    enabled: !!projectId,
    select: (data) => data.data,
  });
};

export const useMyTasksInTeam = (teamId: string) => {
  return useQuery({
    queryKey: ['tasks', 'my', teamId],
    queryFn: () => taskService.getMyTasksInTeam(teamId),
    enabled: !!teamId,
    select: (data) => data.data,
  });
};


export const useMyTasks = () => {
  return useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => taskService.getMyTasks(),
    select: (data) => data.data,
  });
};