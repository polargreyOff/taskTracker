import api from './axiosInstance'

export interface Task {
  id:          string
  request_id:  string | null
  assignee_id: string | null
  team_id:     string | null
  title:       string
  description: string | null
  status:      string
  priority:    string
  development: string | null
  created_at:  string
  updated_at:  string
}

export async function apiGetTasksByTeam(teamId: string): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/tasks', { params: { team_id: teamId } })
  return data
}
