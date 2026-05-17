import api from './axiosInstance'

export interface TeamMember {
  id:             string
  username:       string
  name:           string
  surname:        string
  role:           string
  specialization: string | null
}

export interface Team {
  id:         string
  created_by: string | null
  name:       string
  members:    TeamMember[]
}

export async function apiGetMyTeams(): Promise<Team[]> {
  const { data } = await api.get<Team[]>('/teams/my')
  return data
}

export async function apiCreateTeam(name: string): Promise<Team> {
  const { data } = await api.post<Team>('/teams', { name })
  return data
}

export async function apiAddMember(
  teamId:         string,
  username:       string,
  specialization: string,
): Promise<void> {
  await api.post(`/teams/${teamId}/members`, { username, specialization })
}

export async function apiRemoveMember(teamId: string, userId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${userId}`)
}
