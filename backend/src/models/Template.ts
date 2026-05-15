import pool from '../db'
import { TemplateTask } from './TemplateTask'

export interface TemplateRow {
  id:             string
  name:           string
  classification: string | null
  area:           string | null
  min_confidence: number | null
  description:    string | null
}

export class Template {
  id:             string
  name:           string
  classification: string | null
  area:           string | null
  min_confidence: number | null
  description:    string | null

  constructor(row: TemplateRow) {
    this.id             = row.id
    this.name           = row.name
    this.classification = row.classification
    this.area           = row.area
    this.min_confidence = row.min_confidence
    this.description    = row.description
  }

  static async findByClassificationAndArea(
    classification: string,
    area:           string,
    confidence:     number,
  ): Promise<Template | null> {
    const { rows } = await pool.query<TemplateRow>(
      `SELECT * FROM templates
        WHERE classification = $1 AND area = $2 AND min_confidence <= $3
        ORDER BY min_confidence DESC
        LIMIT 1`,
      [classification, area, confidence]
    )
    return rows[0] ? new Template(rows[0]) : null
  }

  static async findFallback(classification: string, confidence: number): Promise<Template | null> {
    const { rows } = await pool.query<TemplateRow>(
      `SELECT * FROM templates
        WHERE classification = $1 AND area = 'general' AND min_confidence <= $2
        ORDER BY min_confidence DESC
        LIMIT 1`,
      [classification, confidence]
    )
    return rows[0] ? new Template(rows[0]) : null
  }

  matchRequest(classification: string, area: string, confidence: number): boolean {
    return this.classification === classification
        && this.area === area
        && (this.min_confidence ?? 0) <= confidence
  }

  async getTasks(): Promise<TemplateTask[]> {
    return TemplateTask.findByTemplateId(this.id)
  }
}
