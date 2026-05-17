import type { Pool, PoolClient } from 'pg'
import pool from '../db'
import { Task } from './Task'

type Executor = Pool | PoolClient

export interface TemplateTaskRow {
  id:               string
  template_id:      string
  title:            string
  description:      string | null
  default_priority: string | null
  development:      string | null
}

export class TemplateTask {
  id:               string
  template_id:      string
  title:            string
  description:      string | null
  default_priority: string | null
  development:      string | null

  constructor(row: TemplateTaskRow) {
    this.id               = row.id
    this.template_id      = row.template_id
    this.title            = row.title
    this.description      = row.description
    this.default_priority = row.default_priority
    this.development      = row.development
  }

  static async findByTemplateId(templateId: string): Promise<TemplateTask[]> {
    const { rows } = await pool.query<TemplateTaskRow>(
      'SELECT * FROM template_tasks WHERE template_id = $1 ORDER BY id',
      [templateId]
    )
    return rows.map(r => new TemplateTask(r))
  }

  static substitute(text: string, placeholders: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => placeholders[key] ?? `{{${key}}}`)
  }

  async generateTask(
    requestId:    string,
    teamId:       string,
    placeholders: Record<string, string>,
    priority:     string,
    executor:     Executor = pool,
  ): Promise<Task> {
    return Task.create({
      request_id:  requestId,
      team_id:     teamId,
      title:       TemplateTask.substitute(this.title, placeholders),
      description: TemplateTask.substitute(this.description ?? '', placeholders),
      status:      'todo',
      priority,
      development: this.development,
    }, executor)
  }
}
