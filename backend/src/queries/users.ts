import pool from '../db'

export interface User {
  id:            string
  username:      string
  name:          string
  surname:       string
  password_hash: string
  role:          string
  created_at:    Date
}

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
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
  name: string,
  surname: string,
  passwordHash: string,
  role: string
): Promise<User> {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (username, name, surname, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [username, name, surname, passwordHash, role]
  )
  return rows[0]
}
