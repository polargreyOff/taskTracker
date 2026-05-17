import type { Request as ExpressRequest, Response } from 'express'
import { Task } from '../models/Task'
import { User } from '../models/User'
import { TeamProfile } from '../models/TeamProfile'

const VALID_STATUSES     = ['todo', 'in_progress', 'review', 'done']
const VALID_PRIORITIES   = ['low', 'medium', 'high', 'urgent']
const VALID_DEVELOPMENTS = ['frontend', 'backend', 'qa', 'analytics']

export class TaskController {
  static async create(req: ExpressRequest, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const { team_id, title, description, priority, development, assignee_id } = req.body ?? {}

    if (!team_id || typeof team_id !== 'string') {
      res.status(400).json({ error: 'team_id обязателен' })
      return
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'title обязателен' })
      return
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      res.status(400).json({ error: 'description должен быть строкой или null' })
      return
    }

    const finalPriority = priority ?? 'medium'
    if (typeof finalPriority !== 'string' || !VALID_PRIORITIES.includes(finalPriority)) {
      res.status(400).json({ error: `priority должен быть одним из: ${VALID_PRIORITIES.join(', ')}` })
      return
    }

    let finalDevelopment: string | null = null
    if (development !== undefined && development !== null && development !== '') {
      if (typeof development !== 'string' || !VALID_DEVELOPMENTS.includes(development)) {
        res.status(400).json({
          error: `development должен быть одним из: ${VALID_DEVELOPMENTS.join(', ')} или null`,
        })
        return
      }
      finalDevelopment = development
    }

    const callerProfile = await TeamProfile.findByUserAndTeam(userId, team_id)
    if (!callerProfile) {
      res.status(403).json({ error: 'Вы не состоите в этой команде' })
      return
    }

    let finalAssigneeId: string | null = null
    if (assignee_id !== undefined && assignee_id !== null && assignee_id !== '') {
      if (typeof assignee_id !== 'string') {
        res.status(400).json({ error: 'assignee_id должен быть строкой или null' })
        return
      }
      const developer = await User.findById(assignee_id)
      if (!developer) {
        res.status(404).json({ error: 'Назначаемый пользователь не найден' })
        return
      }
      if (developer.role !== 'developer') {
        res.status(400).json({ error: 'Назначить можно только разработчика' })
        return
      }
      const devProfile = await TeamProfile.findByUserAndTeam(developer.id, team_id)
      if (!devProfile) {
        res.status(400).json({ error: 'Разработчик не состоит в команде' })
        return
      }
      if (finalDevelopment && devProfile.specialization !== finalDevelopment) {
        res.status(400).json({
          error: `Специализация разработчика (${devProfile.specialization ?? 'не указана'}) `
               + `не соответствует задаче (${finalDevelopment})`,
        })
        return
      }
      finalAssigneeId = developer.id
    }

    const task = await Task.create({
      request_id:  null,
      team_id,
      assignee_id: finalAssigneeId,
      title:       title.trim(),
      description: description ?? null,
      status:      'todo',
      priority:    finalPriority,
      development: finalDevelopment,
    })

    res.status(201).json(task)
  }

  static async list(req: ExpressRequest, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const teamId = typeof req.query.team_id === 'string' ? req.query.team_id : ''
    if (!teamId) {
      res.status(400).json({ error: 'team_id обязателен (query-параметр)' })
      return
    }

    const profile = await TeamProfile.findByUserAndTeam(userId, teamId)
    if (!profile) {
      res.status(403).json({ error: 'Вы не состоите в этой команде' })
      return
    }

    const tasks = await Task.findByTeamId(teamId)
    res.json(tasks)
  }

  static async update(req: ExpressRequest<{ id: string }>, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const { id } = req.params
    const task = await Task.findById(id)
    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' })
      return
    }
    if (!task.team_id) {
      res.status(400).json({ error: 'У задачи не указана команда' })
      return
    }

    const callerProfile = await TeamProfile.findByUserAndTeam(userId, task.team_id)
    if (!callerProfile) {
      res.status(403).json({ error: 'Вы не состоите в команде этой задачи' })
      return
    }

    const { title, description, status, priority, assignee_id, development } = req.body ?? {}

    // ── Per-field validation ────────────────────────────────────────────────
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'title должен быть непустой строкой' })
        return
      }
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      res.status(400).json({ error: 'description должен быть строкой или null' })
      return
    }

    if (status !== undefined && (typeof status !== 'string' || !VALID_STATUSES.includes(status))) {
      res.status(400).json({ error: `status должен быть одним из: ${VALID_STATUSES.join(', ')}` })
      return
    }

    if (priority !== undefined && (typeof priority !== 'string' || !VALID_PRIORITIES.includes(priority))) {
      res.status(400).json({ error: `priority должен быть одним из: ${VALID_PRIORITIES.join(', ')}` })
      return
    }

    if (development !== undefined && development !== null) {
      if (typeof development !== 'string' || !VALID_DEVELOPMENTS.includes(development)) {
        res.status(400).json({
          error: `development должен быть одним из: ${VALID_DEVELOPMENTS.join(', ')} или null`,
        })
        return
      }
    }

    if (assignee_id !== undefined && assignee_id !== null && typeof assignee_id !== 'string') {
      res.status(400).json({ error: 'assignee_id должен быть строкой или null' })
      return
    }

    // ── Cross-field validation: assignee specialization ↔ development ──────
    const finalDevelopment = development !== undefined ? development : task.development
    const finalAssigneeId  = assignee_id !== undefined ? assignee_id : task.assignee_id

    if (finalAssigneeId) {
      const developer = await User.findById(finalAssigneeId)
      if (!developer) {
        res.status(404).json({ error: 'Назначаемый пользователь не найден' })
        return
      }
      if (developer.role !== 'developer') {
        res.status(400).json({ error: 'Назначить можно только разработчика' })
        return
      }

      const developerProfile = await TeamProfile.findByUserAndTeam(developer.id, task.team_id)
      if (!developerProfile) {
        res.status(400).json({ error: 'Разработчик не состоит в команде задачи' })
        return
      }

      if (finalDevelopment && developerProfile.specialization !== finalDevelopment) {
        res.status(400).json({
          error: `Специализация разработчика (${developerProfile.specialization ?? 'не указана'}) `
               + `не соответствует задаче (${finalDevelopment})`,
        })
        return
      }
    }

    await task.edit({ title, description, status, priority, assignee_id, development })
    res.json(task)
  }

  static async delete(req: ExpressRequest<{ id: string }>, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const { id } = req.params
    const task = await Task.findById(id)
    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' })
      return
    }
    if (!task.team_id) {
      res.status(400).json({ error: 'У задачи не указана команда' })
      return
    }

    const callerProfile = await TeamProfile.findByUserAndTeam(userId, task.team_id)
    if (!callerProfile) {
      res.status(403).json({ error: 'Вы не состоите в команде этой задачи' })
      return
    }

    await Task.delete(task.id)
    res.status(204).end()
  }
}
