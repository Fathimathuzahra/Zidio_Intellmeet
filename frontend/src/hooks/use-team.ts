import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";
import type { Team, TeamMember } from "@/types/teams";

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export const teamKeys = {
  all: ["teams"] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
  members: (teamId: string) => [...teamKeys.detail(teamId), "members"] as const,
  invitations: (teamId: string) => [...teamKeys.detail(teamId), "invitations"] as const,
};

export function useTeams() {
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: async () => {
      const { data } = await api.get<Team[]>("/teams");
      return data;
    },
  });
}

export function useTeamMembers(teamId?: string) {
 
  return useQuery({
    queryKey: teamKeys.members(teamId || "no-id"),
    queryFn: async () => {
      const { data } = await api.get<TeamMember[]>(`/teams/${teamId}/members`);
      return data;
    },
    enabled: !!teamId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, teamId }: { email: string; teamId: string }) => {
      const { data } = await api.post(`/teams/${teamId}/invite`, { email });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.invitations(variables.teamId) });
      toast.success("Invitation sent successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    },
  });
}

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/teams/invitations/${token}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
    },
  });
};

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamName: string) => {
      const { data } = await api.post<{ team: Team }>("/teams", { name: teamName });
      return data.team;
    },
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      toast.success(`Team "${team.name}" created successfully`);
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || "Failed to create team");
    },
  });
}

export function useRemoveMember(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete(`/teams/${teamId}/members/${userId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      toast.success("Member removed successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || "Failed to remove member");
    },
  });
}

export function useUpdateMemberRole(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "member" }) => {
      const { data } = await api.patch(`/teams/${teamId}/members/${userId}`, { role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      toast.success("Member role updated successfully");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || "Failed to update member role");
    },
  });
}
