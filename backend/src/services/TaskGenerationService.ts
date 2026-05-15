import pool from '../db'
import { Request as RequestModel } from '../models/Request'
import { RequestAnswer } from '../models/RequestAnswer'
import { Task } from '../models/Task'
import { Template } from '../models/Template'

export const VALID_CLASSIFICATIONS = ['feature', 'ui_change', 'behavior_change', 'bugfix'] as const
export const VALID_AREAS = [
  'page', 'section', 'data', 'interface', 'integration',
  'notification', 'access', 'report', 'payment', 'search',
  'profile', 'admin_panel', 'content', 'workflow',
] as const
export const VALID_AUDIENCES = ['clients', 'staff', 'admins', 'all'] as const
export const VALID_URGENCIES = ['not_urgent', 'desired', 'urgent'] as const

export interface SurveyAnswers {
  request_text:      string
  change_type:       string  // feature | ui_change | behavior_change | bugfix | unknown
  area_type:         string  // одно из VALID_AREAS либо 'unknown'
  area_name?:        string
  expected_behavior: string
  target_audience:   string  // одно из VALID_AUDIENCES либо 'unknown'
  urgency:           string  // одно из VALID_URGENCIES
}

export interface GenerationResult {
  request:        RequestModel
  tasks:          Task[]
  confidence:     number
  classification: string
  area:           string
  template_name:  string
}

const URGENCY_TO_PRIORITY: Record<string, string> = {
  not_urgent: 'low',
  desired:    'medium',
  urgent:     'high',
}

const BUMP_UP: Record<string, string> = {
  low: 'medium', medium: 'high', high: 'urgent', urgent: 'urgent',
}

const BUMP_DOWN: Record<string, string> = {
  urgent: 'high', high: 'medium', medium: 'low', low: 'low',
}

const AUDIENCE_LABELS: Record<string, string> = {
  clients: 'клиенты',
  staff:   'сотрудники',
  admins:  'администраторы',
  all:     'все пользователи',
  unknown: 'пользователи',
}

const URGENCY_LABELS: Record<string, string> = {
  not_urgent: 'не срочно',
  desired:    'желательно',
  urgent:     'срочно',
}

export class TaskGenerationService {
  static normalizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ')
  }

  static classifyRequest(answers: SurveyAnswers): string {
    return (VALID_CLASSIFICATIONS as readonly string[]).includes(answers.change_type)
      ? answers.change_type
      : 'feature'
  }

  static detectArea(answers: SurveyAnswers): string {
    return (VALID_AREAS as readonly string[]).includes(answers.area_type)
      ? answers.area_type
      : 'general'
  }

  static calculateConfidence(answers: SurveyAnswers): number {
    const scoreText = (text: string): number => {
      const len = text.trim().length
      if (len >= 50) return 1.0
      if (len >= 20) return 0.7
      if (len >= 5)  return 0.4
      return 0.0
    }

    const scores = [
      scoreText(answers.request_text),
      (VALID_CLASSIFICATIONS as readonly string[]).includes(answers.change_type) ? 1.0 : 0.0,
      (VALID_AREAS as readonly string[]).includes(answers.area_type)
        ? ((answers.area_name && answers.area_name.trim().length > 0) ? 1.0 : 0.7)
        : 0.0,
      scoreText(answers.expected_behavior),
      (VALID_AUDIENCES as readonly string[]).includes(answers.target_audience) ? 1.0 : 0.0,
      (VALID_URGENCIES as readonly string[]).includes(answers.urgency) ? 1.0 : 0.0,
    ]

    return scores.reduce((a, b) => a + b, 0) / scores.length
  }

  static async selectTemplate(
    classification: string,
    area:           string,
    confidence:     number,
  ): Promise<Template | null> {
    const exact = await Template.findByClassificationAndArea(classification, area, confidence)
    if (exact) return exact
    return Template.findFallback(classification, confidence)
  }

  static adjustPriority(defaultPriority: string | null, urgency: string): string {
    const base = defaultPriority ?? URGENCY_TO_PRIORITY[urgency] ?? 'medium'
    if (urgency === 'urgent')     return BUMP_UP[base]   ?? base
    if (urgency === 'not_urgent') return BUMP_DOWN[base] ?? base
    return base
  }

  static buildPlaceholders(answers: SurveyAnswers): Record<string, string> {
    return {
      request_text:      TaskGenerationService.normalizeText(answers.request_text),
      area:              answers.area_type,
      component_name:    answers.area_name?.trim() || 'не указано',
      expected_behavior: TaskGenerationService.normalizeText(answers.expected_behavior),
      target_audience:   AUDIENCE_LABELS[answers.target_audience] ?? 'пользователи',
      urgency:           URGENCY_LABELS[answers.urgency]          ?? 'желательно',
    }
  }

  static async run(input: {
    user_id: string
    team_id: string
    answers: SurveyAnswers
  }): Promise<GenerationResult> {
    const { user_id, team_id, answers } = input

    const classification = TaskGenerationService.classifyRequest(answers)
    const area           = TaskGenerationService.detectArea(answers)
    const confidence     = TaskGenerationService.calculateConfidence(answers)
    const template       = await TaskGenerationService.selectTemplate(classification, area, confidence)

    if (!template) {
      throw new Error('Не удалось подобрать шаблон: слишком низкая уверенность по ответам опросника')
    }

    const placeholders   = TaskGenerationService.buildPlaceholders(answers)
    const templateTasks  = await template.getTasks()

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const request = await RequestModel.create({
        user_id,
        template_id:    template.id,
        team_id,
        classification,
        area,
        name:           answers.area_name?.trim() || null,
      }, client)

      const answerEntries: Array<[number, string]> = [
        [1, answers.request_text],
        [2, answers.change_type],
        [3, [answers.area_type, answers.area_name?.trim()].filter(Boolean).join(' | ')],
        [4, answers.expected_behavior],
        [5, answers.target_audience],
        [6, answers.urgency],
      ]
      for (const [num, text] of answerEntries) {
        await RequestAnswer.create(request.id, num, text, client)
      }

      const tasks: Task[] = []
      for (const tt of templateTasks) {
        const priority = TaskGenerationService.adjustPriority(tt.default_priority, answers.urgency)
        const task = await tt.generateTask(request.id, team_id, placeholders, priority, client)
        tasks.push(task)
      }

      await client.query('COMMIT')

      return {
        request,
        tasks,
        confidence,
        classification,
        area,
        template_name: template.name,
      }
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}
