import type { Team } from '@/types/teams'
import api from '../lib/api'

export const teamsService = {
  create: async (name: string) => {
    const { data } = await api.post('/teams', { name })
    return data.team
  },

  getTeams: async (): Promise<Team[]> => {
    const { data } = await api.get('/teams')
    return data
  },

  invite: async (teamId: string, email: string) => {
    const { data } = await api.post(`/teams/${teamId}/invite`, { email })
    return data
  },

  getJoinedTeams: async (): Promise<Team[]> => {
    const { data } = await api.get("/teams/joined");
    return data;
  },
}
