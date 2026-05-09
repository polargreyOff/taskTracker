import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: ReactNode
  role?:    string
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth()

  if (loading) return <div>Загрузка...</div>
  if (!user)   return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'client' ? '/client/requests' : '/developer/board'} replace />
  }

  return <>{children}</>
}
