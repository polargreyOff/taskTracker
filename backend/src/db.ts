import { Pool } from 'pg'
import dbConfig from './config/db'

const pool = new Pool(dbConfig)

pool.on('error', (err) => {
  console.error('Unexpected database error:', err)
})

export default pool
