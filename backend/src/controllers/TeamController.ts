import type { Request, Response } from 'express'
import pool from '../db'
import { Team } from '../models/Team'
import { TeamProfile } from '../models/TeamProfile'
import { User } from '../models/User'
import { Task } from '../models/Task'

const VALID_SPECIALIZATIONS = ['frontend', 'backend', 'qa', 'analytics']

export class TeamController {
  static async create(req: Request, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const { name } = req.body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Название команды обязательно (мин. 2 символа)' })
      return
    }

    const trimmed = name.trim()

    const existing = await Team.findByNameAndCreator(trimmed, userId)
    if (existing) {
      res.status(409).json({ error: 'У вас уже есть команда с таким названием' })
      return
    }

    const team = await Team.create(trimmed, userId)
    await TeamProfile.create(userId, 'client', team.id)

    res.status(201).json(team)
  }

  static async getMy(req: Request, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const teams = await Team.findAllByUserId(userId)
    const teamsWithMembers = await Promise.all(
      teams.map(async team => ({
        id:         team.id,
        name:       team.name,
        created_by: team.created_by,
        members:    await team.getMembers(),
      }))
    )

    res.json(teamsWithMembers)
  }

  static async addMember(req: Request<{ teamId: string }>, res: Response): Promise<void> {
    const userId = req.session.userId
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const { teamId } = req.params
    const { username, specialization } = req.body

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      res.status(400).json({ error: 'username обязателен' })
      return
    }

    if (!specialization || typeof specialization !== 'string' || !VALID_SPECIALIZATIONS.includes(specialization)) {
      res.status(400).json({
        error: `specialization обязателен и должен быть одним из: ${VALID_SPECIALIZATIONS.join(', ')}`,
      })
      return
    }

    const team = await Team.findById(teamId)
    if (!team) {
      res.status(404).json({ error: 'Команда не найдена' })
      return
    }

    if (team.created_by !== userId) {
      res.status(403).json({ error: 'Вы не являетесь создателем команды' })
      return
    }

    const developer = await User.findByUsername(username.trim())
    if (!developer) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }

    if (developer.role !== 'developer') {
      res.status(400).json({ error: 'В команду можно добавить только разработчика' })
      return
    }

    const existing = await TeamProfile.findByUserAndTeam(developer.id, team.id)
    if (existing) {
      res.status(409).json({ error: 'Этот разработчик уже в команде' })
      return
    }

    const profile = await TeamProfile.create(developer.id, specialization, team.id)
    res.status(201).json(profile)
  }

  static async removeMember(
    req: Request<{ teamId: string, userId: string }>,
    res: Response,
  ): Promise<void> {
    const callerId = req.session.userId
    if (!callerId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const { teamId, userId } = req.params

    const team = await Team.findById(teamId)
    if (!team) {
      res.status(404).json({ error: 'Команда не найдена' })
      return
    }

    if (team.created_by !== callerId) {
      res.status(403).json({ error: 'Вы не являетесь создателем команды' })
      return
    }

    if (userId === callerId) {
      res.status(400).json({ error: 'Нельзя удалить себя из команды' })
      return
    }

    const profile = await TeamProfile.findByUserAndTeam(userId, teamId)
    if (!profile) {
      res.status(404).json({ error: 'Пользователь не состоит в этой команде' })
      return
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await Task.unassignUserInTeam(userId, teamId, client)
      await TeamProfile.delete(userId, teamId, client)
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    res.status(204).end()
  }
}
