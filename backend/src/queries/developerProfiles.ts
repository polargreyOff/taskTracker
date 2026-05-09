import pool from '../db'

export interface DeveloperProfile {
  id:             string
  user_id:        string
  team_id:        string | null
  specialization: string | null
}

export async function createDeveloperProfile(
  userId:         string,
  specialization: string | null = null
): Promise<DeveloperProfile> {
  const { rows } = await pool.query<DeveloperProfile>(
    `INSERT INTO developer_profiles (user_id, specialization)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, specialization]
  )
  return rows[0]
}
