import api from './axiosInstance'

export interface Request {
  id:             string
  user_id:        string
  template_id:    string | null
  team_id:        string | null
  classification: string | null
  area:           string | null
  name:           string | null
  created_at:     string
}

export async function apiGetMyRequests(): Promise<Request[]> {
  const { data } = await api.get<Request[]>('/requests/my')
  return data
}
