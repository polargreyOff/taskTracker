import pool from '../db'

export interface TeamProfileRow {
  id:             string
  user_id:        string
  team_id:        string | null
  specialization: string | null
}

export class TeamProfile {
  id:             string
  user_id:        string
  team_id:        string | null
  specialization: string | null

  constructor(row: TeamProfileRow) {
    this.id             = row.id
    this.user_id        = row.user_id
    this.team_id        = row.team_id
    this.specialization = row.specialization
  }

  static async create(
    userId:         string,
    specialization: string | null = null,
    teamId:         string | null = null,
  ): Promise<TeamProfile> {
    const { rows } = await pool.query<TeamProfileRow>(
      `INSERT INTO team_profiles (user_id, team_id, specialization)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, teamId, specialization]
    )
    return new TeamProfile(rows[0])
  }

  static async findByUserId(userId: string): Promise<TeamProfile | null> {
    const { rows } = await pool.query<TeamProfileRow>(
      'SELECT * FROM team_profiles WHERE user_id = $1',
      [userId]
    )
    return rows[0] ? new TeamProfile(rows[0]) : null
  }
}
