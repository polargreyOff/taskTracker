import type { Pool, PoolClient } from 'pg'
import pool from '../db'

type Executor = Pool | PoolClient

export interface RequestAnswerRow {
  id:              string
  request_id:      string
  question_number: number
  answer_text:     string | null
}

export class RequestAnswer {
  id:              string
  request_id:      string
  question_number: number
  answer_text:     string | null

  constructor(row: RequestAnswerRow) {
    this.id              = row.id
    this.request_id      = row.request_id
    this.question_number = row.question_number
    this.answer_text     = row.answer_text
  }

  static async create(
    requestId:      string,
    questionNumber: number,
    answerText:     string | null,
    executor:       Executor = pool,
  ): Promise<RequestAnswer> {
    const { rows } = await executor.query<RequestAnswerRow>(
      `INSERT INTO requests_answers (request_id, question_number, answer_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [requestId, questionNumber, answerText]
    )
    return new RequestAnswer(rows[0])
  }

  static async findByRequestId(requestId: string): Promise<RequestAnswer[]> {
    const { rows } = await pool.query<RequestAnswerRow>(
      'SELECT * FROM requests_answers WHERE request_id = $1 ORDER BY question_number',
      [requestId]
    )
    return rows.map(r => new RequestAnswer(r))
  }
}
