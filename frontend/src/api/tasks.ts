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

export async function apiUpdateTask(
  id: string,
  patch: {
    title?:        string
    description?:  string | null
    status?:       string
    priority?:     string
    assignee_id?:  string | null
    development?:  string | null
  },
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, patch)
  return data
}

export async function apiCreateTask(payload: {
  team_id:      string
  title:        string
  description?: string | null
  priority?:    string
  development?: string | null
  assignee_id?: string | null
}): Promise<Task> {
  const { data } = await api.post<Task>('/tasks', payload)
  return data
}

