import pool from '../db'

export interface TeamRow {
  id:         string
  created_by: string | null
  name:       string
}

export interface TeamMember {
  id:             string
  username:       string
  name:           string
  surname:        string
  role:           string
  specialization: string | null
}

export class Team {
  id:         string
  created_by: string | null
  name:       string

  constructor(row: TeamRow) {
    this.id         = row.id
    this.created_by = row.created_by
    this.name       = row.name
  }

  static async create(name: string, createdBy: string): Promise<Team> {
    const { rows } = await pool.query<TeamRow>(
      `INSERT INTO teams (name, created_by)
       VALUES ($1, $2)
       RETURNING *`,
      [name, createdBy]
    )
    return new Team(rows[0])
  }

  static async findById(id: string): Promise<Team | null> {
    const { rows } = await pool.query<TeamRow>(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    )
    return rows[0] ? new Team(rows[0]) : null
  }

  static async findByNameAndCreator(name: string, createdBy: string): Promise<Team | null> {
    const { rows } = await pool.query<TeamRow>(
      'SELECT * FROM teams WHERE name = $1 AND created_by = $2',
      [name, createdBy]
    )
    return rows[0] ? new Team(rows[0]) : null
  }

  static async findAllByUserId(userId: string): Promise<Team[]> {
    const { rows } = await pool.query<TeamRow>(
      `SELECT t.*
         FROM teams t
         JOIN team_profiles tp ON tp.team_id = t.id
        WHERE tp.user_id = $1
        ORDER BY t.name`,
      [userId]
    )
    return rows.map(row => new Team(row))
  }

  async getMembers(): Promise<TeamMember[]> {
    const { rows } = await pool.query<TeamMember>(
      `SELECT u.id, u.username, u.name, u.surname, u.role, tp.specialization
         FROM team_profiles tp
         JOIN users u ON u.id = tp.user_id
        WHERE tp.team_id = $1
        ORDER BY (tp.specialization = 'client') DESC, u.surname`,
      [this.id]
    )
    return rows
  }
}
