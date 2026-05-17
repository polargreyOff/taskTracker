import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiGetMyTeams } from '../api/teams'
import type { Team } from '../api/teams'
import { logout } from './authSlice'

interface TeamsState {
  items:   Team[]
  loading: boolean
  loaded:  boolean
  error:   string | null
}

const initialState: TeamsState = {
  items:   [],
  loading: false,
  loaded:  false,
  error:   null,
}

export const fetchTeams = createAsyncThunk('teams/fetch', async () => {
  return await apiGetMyTeams()
})

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    invalidateTeams(state) {
      state.loaded = false
    },
    resetTeams() {
      return initialState
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTeams.pending,   state => {
        state.loading = true
        state.error   = null
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.items   = action.payload
        state.loading = false
        state.loaded  = true
      })
      .addCase(fetchTeams.rejected,  (state, action) => {
        state.loading = false
        state.error   = action.error.message ?? 'Не удалось загрузить команды'
      })
      .addCase(logout.fulfilled, () => initialState)
  },
})

export const { invalidateTeams, resetTeams } = teamsSlice.actions
export default teamsSlice.reducer
