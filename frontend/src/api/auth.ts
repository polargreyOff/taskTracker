import api from './axiosInstance'

export interface User {
  id:         string
  username:   string
  name:       string
  surname:    string
  role:       string
  created_at: string
}

export async function apiMe(): Promise<User | null> {
  try {
    const { data } = await api.get<User>('/auth/me')
    return data
  } catch {
    return null
  }
}

export async function apiLogin(username: string, password: string): Promise<User> {
  const { data } = await api.post<User>('/auth/login', { username, password })
  return data
}

export async function apiRegister(payload: {
  username:        string
  name:            string
  surname:         string
  password:        string
  role:            string
  specialization?: string
}): Promise<User> {
  const { data } = await api.post<User>('/auth/register', payload)
  return data
}

export async function apiLogout(): Promise<void> {
  await api.post('/auth/logout')
}
