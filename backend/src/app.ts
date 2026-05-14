import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import sessionMiddleware from './middlewares/session'
import authRouter from './routes/authRouter'
import teamRouter from './routes/teamRouter'

const app = express()

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.sendStatus(204); return }
  next()
})

app.use(express.json())
app.use(sessionMiddleware)

app.use('/auth',  authRouter)
app.use('/teams', teamRouter)

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

export default app
