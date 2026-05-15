import type { Pool, PoolClient } from 'pg'
import pool from '../db'
import { RequestAnswer } from './RequestAnswer'
import { Task } from './Task'

type Executor = Pool | PoolClient

export interface RequestRow {
  id:             string
  user_id:        string
  template_id:    string | null
  team_id:        string | null
  classification: string | null
  area:           string | null
  name:           string | null
  created_at:     Date
}

export class Request {
  id:             string
  user_id:        string
  template_id:    string | null
  team_id:        string | null
  classification: string | null
  area:           string | null
  name:           string | null
  created_at:     Date

  constructor(row: RequestRow) {
    this.id             = row.id
    this.user_id        = row.user_id
    this.template_id    = row.template_id
    this.team_id        = row.team_id
    this.classification = row.classification
    this.area           = row.area
    this.name           = row.name
    this.created_at     = row.created_at
  }

  static async create(
    data: {
      user_id:         string
      template_id?:    string | null
      team_id?:        string | null
      classification?: string | null
      area?:           string | null
      name?:           string | null
    },
    executor: Executor = pool,
  ): Promise<Request> {
    const { rows } = await executor.query<RequestRow>(
      `INSERT INTO requests (user_id, template_id, team_id, classification, area, name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.user_id,
        data.template_id    ?? null,
        data.team_id        ?? null,
        data.classification ?? null,
        data.area           ?? null,
        data.name           ?? null,
      ]
    )
    return new Request(rows[0])
  }

  static async findById(id: string): Promise<Request | null> {
    const { rows } = await pool.query<RequestRow>(
      'SELECT * FROM requests WHERE id = $1',
      [id]
    )
    return rows[0] ? new Request(rows[0]) : null
  }

  async getAnswers(): Promise<RequestAnswer[]> {
    return RequestAnswer.findByRequestId(this.id)
  }

  async getTasks(): Promise<Task[]> {
    return Task.findByRequestId(this.id)
  }
}
