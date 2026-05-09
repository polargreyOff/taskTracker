import pool from '../db'

export interface User {
  id:            string
  username:      string
  password_hash: string
  role:          string
  created_at:    Date
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    'SELECT * FROM users WHERE username = $1',
    [username]
  )
  return rows[0] ?? null
}

export async function createUser(
  username: string,
  passwordHash: string,
  role: string
): Promise<User> {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [username, passwordHash, role]
  )
  return rows[0]
}
