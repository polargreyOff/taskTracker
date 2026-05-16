import api from './axiosInstance'
import type { Task } from './tasks'

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

export interface SurveyAnswers {
  request_text:      string
  change_type:       string
  area_type:         string
  area_name?:        string
  expected_behavior: string
  target_audience:   string
  urgency:           string
}

export interface CreateRequestResult {
  request:        Request
  tasks:          Task[]
  confidence:     number
  classification: string
  area:           string
  template_name:  string
}

export async function apiGetMyRequests(): Promise<Request[]> {
  const { data } = await api.get<Request[]>('/requests/my')
  return data
}

export async function apiGetRequestsByTeam(teamId: string): Promise<Request[]> {
  const { data } = await api.get<Request[]>('/requests', { params: { team_id: teamId } })
  return data
}

export async function apiCreateRequest(payload: {
  team_id: string
  answers: SurveyAnswers
}): Promise<CreateRequestResult> {
  const { data } = await api.post<CreateRequestResult>('/requests', payload)
  return data
}
