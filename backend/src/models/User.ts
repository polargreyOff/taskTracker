import bcrypt from 'bcryptjs'
import pool from '../db'

export interface UserRow {
  id:            string
  username:      string
  name:          string
  surname:       string
  password_hash: string
  role:          string
  created_at:    Date
}

export interface PublicUser {
  id:         string
  username:   string
  name:       string
  surname:    string
  role:       string
  created_at: Date
}

export class User {
  id:            string
  username:      string
  name:          string
  surname:       string
  password_hash: string
  role:          string
  created_at:    Date

  constructor(row: UserRow) {
    this.id            = row.id
    this.username      = row.username
    this.name          = row.name
    this.surname       = row.surname
    this.password_hash = row.password_hash
    this.role          = row.role
    this.created_at    = row.created_at
  }

  static async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )
    return rows[0] ? new User(rows[0]) : null
  }

  static async findByUsername(username: string): Promise<User | null> {
    const { rows } = await pool.query<UserRow>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    )
    return rows[0] ? new User(rows[0]) : null
  }

  static async create(data: {
    username: string
    name:     string
    surname:  string
    password: string
    role:     string
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10)
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (username, name, surname, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.username, data.name, data.surname, passwordHash, data.role]
    )
    return new User(rows[0])
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash)
  }

  toPublicJSON(): PublicUser {
    return {
      id:         this.id,
      username:   this.username,
      name:       this.name,
      surname:    this.surname,
      role:       this.role,
      created_at: this.created_at,
    }
  }
}
