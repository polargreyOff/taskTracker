import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { apiMe, apiLogout } from '../api/auth'
import type { User } from '../api/auth'

interface AuthState {
  user:    User | null
  loading: boolean
}

const initialState: AuthState = { user: null, loading: true }

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  return await apiMe()
})

export const logout = createAsyncThunk('auth/logout', async () => {
  await apiLogout()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
    },
    clearUser(state) {
      state.user = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending,   (state) => { state.loading = true })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user    = action.payload
        state.loading = false
      })
      .addCase(fetchMe.rejected,  (state) => {
        state.user    = null
        state.loading = false
      })
      .addCase(logout.fulfilled, (state) => { state.user = null })
  },
})

export const { setUser, clearUser } = authSlice.actions
export default authSlice.reducer
