import type { Request as ExpressRequest, Response } from 'express'
import { Task } from '../models/Task'
import { User } from '../models/User'
import { TeamProfile } from '../models/TeamProfile'

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done']

export class TaskController {
  static async updateStatus(req: ExpressRequest<{ id: string }>, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const { id } = req.params
    const { status } = req.body

    if (!status || typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `status должен быть одним из: ${VALID_STATUSES.join(', ')}` })
      return
    }

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

    await task.updateStatus(status)
    res.json(task)
  }

  static async assign(req: ExpressRequest<{ id: string }>, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const { id } = req.params
    const { assignee_id } = req.body

    if (!assignee_id || typeof assignee_id !== 'string') {
      res.status(400).json({ error: 'assignee_id обязателен' })
      return
    }

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

    const developer = await User.findById(assignee_id)
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
      res.status(400).json({ error: 'Разработчик не состоит в команде этой задачи' })
      return
    }

    if (task.development && developerProfile.specialization !== task.development) {
      res.status(400).json({
        error: `Специализация разработчика (${developerProfile.specialization ?? 'не указана'}) `
             + `не соответствует задаче (${task.development})`,
      })
      return
    }

    await task.assign(developer.id)
    res.json(task)
  }
}
