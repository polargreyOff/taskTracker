import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { setUser, clearUser, logout } from '../store/authSlice'
import type { User } from '../api/auth'

export function useAuth() {
  const user    = useSelector((state: RootState) => state.auth.user)
  const loading = useSelector((state: RootState) => state.auth.loading)
  const dispatch = useDispatch<AppDispatch>()

  return {
    user,
    loading,
    setUser:  (u: User) => dispatch(setUser(u)),
    clearUser: ()       => dispatch(clearUser()),
    logout:   ()        => dispatch(logout()),
  }
}
