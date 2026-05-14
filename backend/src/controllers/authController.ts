import type { Request, Response } from 'express'
import { User } from '../models/User'

const VALID_ROLES = ['client', 'developer']

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const { username, name, surname, password, role } = req.body

    if (!username || !name || !surname || !password || !role) {
      res.status(400).json({ error: 'username, name, surname, password и role обязательны' })
      return
    }

    if (typeof username !== 'string' || username.trim().length < 3) {
      res.status(400).json({ error: 'username должен быть не короче 3 символов' })
      return
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'name должен быть не короче 2 символов' })
      return
    }

    if (typeof surname !== 'string' || surname.trim().length < 2) {
      res.status(400).json({ error: 'surname должен быть не короче 2 символов' })
      return
    }

    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'password должен быть не короче 6 символов' })
      return
    }

    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ error: 'role должна быть client или developer' })
      return
    }

    const existing = await User.findByUsername(username.trim())
    if (existing) {
      res.status(409).json({ error: 'Пользователь с таким именем уже существует' })
      return
    }

    const user = await User.create({
      username: username.trim(),
      name:     name.trim(),
      surname:  surname.trim(),
      password,
      role,
    })

    req.session.userId = user.id
    req.session.role   = user.role

    res.status(201).json(user.toPublicJSON())
  }

  static async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ error: 'username и password обязательны' })
      return
    }

    const user = await User.findByUsername(username.trim())
    if (!user) {
      res.status(401).json({ error: 'Неверный username или пароль' })
      return
    }

    const passwordMatch = await user.verifyPassword(password)
    if (!passwordMatch) {
      res.status(401).json({ error: 'Неверный username или пароль' })
      return
    }

    req.session.userId = user.id
    req.session.role   = user.role

    res.json(user.toPublicJSON())
  }

  static async logout(req: Request, res: Response): Promise<void> {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Не удалось завершить сессию' })
        return
      }
      res.clearCookie('connect.sid')
      res.json({ message: 'Выход выполнен' })
    })
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    if (!req.session.userId) {
      res.status(401).json({ error: 'Не авторизован' })
      return
    }

    const user = await User.findById(req.session.userId)
    if (!user) {
      res.status(401).json({ error: 'Пользователь не найден' })
      return
    }

    res.json(user.toPublicJSON())
  }
}
