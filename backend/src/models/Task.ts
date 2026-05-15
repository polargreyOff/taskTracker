import type { Pool, PoolClient } from 'pg'
import pool from '../db'

type Executor = Pool | PoolClient

export interface TaskRow {
  id:          string
  request_id:  string | null
  assignee_id: string | null
  team_id:     string | null
  title:       string
  description: string | null
  status:      string
  priority:    string
  created_at:  Date
  updated_at:  Date
  development: string | null
}

export class Task {
  id:          string
  request_id:  string | null
  assignee_id: string | null
  team_id:     string | null
  title:       string
  description: string | null
  status:      string
  priority:    string
  created_at:  Date
  updated_at:  Date
  development: string | null

  constructor(row: TaskRow) {
    this.id          = row.id
    this.request_id  = row.request_id
    this.assignee_id = row.assignee_id
    this.team_id     = row.team_id
    this.title       = row.title
    this.description = row.description
    this.status      = row.status
    this.priority    = row.priority
    this.created_at  = row.created_at
    this.updated_at  = row.updated_at
    this.development = row.development
  }

  static async create(
    data: {
      request_id:   string | null
      team_id:      string | null
      assignee_id?: string | null
      title:        string
      description?: string | null
      status?:      string
      priority?:    string
      development?: string | null
    },
    executor: Executor = pool,
  ): Promise<Task> {
    const { rows } = await executor.query<TaskRow>(
      `INSERT INTO tasks (request_id, team_id, assignee_id, title, description, status, priority, development)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.request_id,
        data.team_id,
        data.assignee_id ?? null,
        data.title,
        data.description ?? null,
        data.status ?? 'todo',
        data.priority ?? 'medium',
        data.development ?? null,
      ]
    )
    return new Task(rows[0])
  }

  static async findByRequestId(requestId: string): Promise<Task[]> {
    const { rows } = await pool.query<TaskRow>(
      'SELECT * FROM tasks WHERE request_id = $1 ORDER BY created_at',
      [requestId]
    )
    return rows.map(r => new Task(r))
  }
}
