import express from 'express'
import sessionMiddleware from './middlewares/session'
import authRouter from './routes/authRouter'

const app = express()

app.use(express.json())
app.use(sessionMiddleware)

app.use('/auth', authRouter)

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

export default app
