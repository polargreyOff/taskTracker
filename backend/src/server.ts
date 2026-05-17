import 'dotenv/config'

import app from './app'
import pool from './db'

const port = Number(process.env.PORT) || 3000

pool.connect()
  .then(client => {
    client.release()
    console.log('Connected to database')
    app.listen(port, () => {
      console.log(`Backend is running on port ${port}`)
    })
  })
  .catch(err => {
    console.error('Failed to connect to database:', err)
    process.exit(1)
  })
