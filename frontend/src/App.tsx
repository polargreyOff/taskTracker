import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from './store'
import { fetchMe } from './store/authSlice'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage           from './pages/LoginPage'
import RegisterPage        from './pages/RegisterPage'
import ClientRequestsPage  from './pages/client/RequestsPage'
import NewRequestPage      from './pages/client/NewRequestPage'
import RequestDetailPage   from './pages/client/RequestDetailPage'
import BoardPage           from './pages/developer/BoardPage'
import DevRequestsListPage from './pages/developer/RequestsListPage'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div>Загрузка...</div>
  if (!user)   return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'client' ? '/client/requests' : '/developer/board'} replace />
}

export default function App() {
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => { dispatch(fetchMe()) }, [dispatch])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/"         element={<RootRedirect />} />

        <Route path="/client/requests" element={
          <ProtectedRoute role="client"><ClientRequestsPage /></ProtectedRoute>
        } />
        <Route path="/client/requests/new" element={
          <ProtectedRoute role="client"><NewRequestPage /></ProtectedRoute>
        } />
        <Route path="/client/requests/:id" element={
          <ProtectedRoute role="client"><RequestDetailPage /></ProtectedRoute>
        } />

        <Route path="/developer/board" element={
          <ProtectedRoute role="developer"><BoardPage /></ProtectedRoute>
        } />
        <Route path="/developer/requests" element={
          <ProtectedRoute role="developer"><DevRequestsListPage /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
