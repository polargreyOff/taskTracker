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

  static async findById(id: string): Promise<Task | null> {
    const { rows } = await pool.query<TaskRow>(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    )
    return rows[0] ? new Task(rows[0]) : null
  }

  static async findByTeamId(teamId: string): Promise<Task[]> {
    const { rows } = await pool.query<TaskRow>(
      'SELECT * FROM tasks WHERE team_id = $1 ORDER BY created_at',
      [teamId]
    )
    return rows.map(r => new Task(r))
  }

  async edit(data: {
    title?:       string
    description?: string | null
    status?:      string
    priority?:    string
    assignee_id?: string | null
    development?: string | null
  }): Promise<void> {
    const updates: string[] = []
    const values:  unknown[] = []
    let idx = 1

    const set = (field: string, value: unknown) => {
      updates.push(`${field} = $${idx++}`)
      values.push(value)
    }

    if (data.title       !== undefined) set('title',       data.title)
    if (data.description !== undefined) set('description', data.description)
    if (data.status      !== undefined) set('status',      data.status)
    if (data.priority    !== undefined) set('priority',    data.priority)
    if (data.assignee_id !== undefined) set('assignee_id', data.assignee_id)
    if (data.development !== undefined) set('development', data.development)

    if (updates.length === 0) return

    updates.push('updated_at = NOW()')
    values.push(this.id)

    const { rows } = await pool.query<TaskRow>(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
    if (rows[0]) {
      Object.assign(this, rows[0])
    }
  }
}
