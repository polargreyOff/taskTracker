import express from 'express'
import sessionMiddleware from './middlewares/session'

const app = express()

app.use(express.json())
app.use(sessionMiddleware)

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

export default app
