import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { findUserById, findUserByUsername, createUser } from '../queries/users'

const VALID_ROLES = ['client', 'developer']

export async function register(req: Request, res: Response): Promise<void> {
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

  const existing = await findUserByUsername(username.trim())
  if (existing) {
    res.status(409).json({ error: 'Пользователь с таким именем уже существует' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await createUser(username.trim(), name.trim(), surname.trim(), passwordHash, role)

  req.session.userId = user.id
  req.session.role   = user.role

  res.status(201).json({
    id:         user.id,
    username:   user.username,
    name:       user.name,
    surname:    user.surname,
    role:       user.role,
    created_at: user.created_at,
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ error: 'username и password обязательны' })
    return
  }

  const user = await findUserByUsername(username.trim())
  if (!user) {
    res.status(401).json({ error: 'Неверный username или пароль' })
    return
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    res.status(401).json({ error: 'Неверный username или пароль' })
    return
  }

  req.session.userId = user.id
  req.session.role   = user.role

  res.json({
    id:         user.id,
    username:   user.username,
    name:       user.name,
    surname:    user.surname,
    role:       user.role,
    created_at: user.created_at,
  })
}

export async function logout(req: Request, res: Response): Promise<void> {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Не удалось завершить сессию' })
      return
    }
    res.clearCookie('connect.sid')
    res.json({ message: 'Выход выполнен' })
  })
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Не авторизован' })
    return
  }

  const user = await findUserById(req.session.userId)
  if (!user) {
    res.status(401).json({ error: 'Пользователь не найден' })
    return
  }

  res.json({
    id:         user.id,
    username:   user.username,
    name:       user.name,
    surname:    user.surname,
    role:       user.role,
    created_at: user.created_at,
  })
}
