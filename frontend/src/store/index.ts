import { configureStore } from '@reduxjs/toolkit'
import authReducer  from './authSlice'
import teamsReducer from './teamsSlice'

export const store = configureStore({
  reducer: {
    auth:  authReducer,
    teams: teamsReducer,
  },
})

export type RootState  = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
