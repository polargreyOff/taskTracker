import type { Request as ExpressRequest, Response } from 'express'
import {
  TaskGenerationService,
  VALID_CLASSIFICATIONS,
  VALID_AREAS,
  VALID_AUDIENCES,
  VALID_URGENCIES,
} from '../services/TaskGenerationService'
import type { SurveyAnswers } from '../services/TaskGenerationService'
import { Request as RequestModel } from '../models/Request'
import { Team } from '../models/Team'
import { TeamProfile } from '../models/TeamProfile'

const INPUT_CHANGE_TYPES = [...VALID_CLASSIFICATIONS, 'unknown']
const INPUT_AREAS        = [...VALID_AREAS,           'unknown']
const INPUT_AUDIENCES    = [...VALID_AUDIENCES,       'unknown']

export class RequestController {
  static async listMy(req: ExpressRequest, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const requests = await RequestModel.findAllByUserId(userId)
    res.json(requests)
  }

  static async createRequest(req: ExpressRequest, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const { team_id, answers } = req.body

    if (!team_id || typeof team_id !== 'string') {
      res.status(400).json({ error: 'team_id обязателен' })
      return
    }

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ error: 'answers обязательны' })
      return
    }

    const a = answers as Partial<SurveyAnswers>

    if (!a.request_text || typeof a.request_text !== 'string' || a.request_text.trim().length < 3) {
      res.status(400).json({ error: 'request_text обязателен (мин. 3 символа)' })
      return
    }
    if (!a.change_type || !INPUT_CHANGE_TYPES.includes(a.change_type)) {
      res.status(400).json({ error: `change_type должен быть одним из: ${INPUT_CHANGE_TYPES.join(', ')}` })
      return
    }
    if (!a.area_type || !INPUT_AREAS.includes(a.area_type)) {
      res.status(400).json({ error: `area_type должен быть одним из: ${INPUT_AREAS.join(', ')}` })
      return
    }
    if (!a.expected_behavior || typeof a.expected_behavior !== 'string' || a.expected_behavior.trim().length < 3) {
      res.status(400).json({ error: 'expected_behavior обязателен (мин. 3 символа)' })
      return
    }
    if (!a.target_audience || !INPUT_AUDIENCES.includes(a.target_audience)) {
      res.status(400).json({ error: `target_audience должен быть одним из: ${INPUT_AUDIENCES.join(', ')}` })
      return
    }
    if (!a.urgency || !VALID_URGENCIES.includes(a.urgency as typeof VALID_URGENCIES[number])) {
      res.status(400).json({ error: `urgency должен быть одним из: ${VALID_URGENCIES.join(', ')}` })
      return
    }

    const team = await Team.findById(team_id)
    if (!team) {
      res.status(404).json({ error: 'Команда не найдена' })
      return
    }

    const profile = await TeamProfile.findByUserAndTeam(userId, team.id)
    if (!profile || profile.specialization !== 'client') {
      res.status(403).json({ error: 'Вы не являетесь заказчиком этой команды' })
      return
    }

    try {
      const result = await TaskGenerationService.run({
        user_id: userId,
        team_id,
        answers: a as SurveyAnswers,
      })
      res.status(201).json(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка генерации задач'
      res.status(500).json({ error: msg })
    }
  }
}
