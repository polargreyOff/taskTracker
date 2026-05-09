import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { findUserByUsername, createUser } from '../queries/users'

const VALID_ROLES = ['client', 'developer']

export async function register(req: Request, res: Response): Promise<void> {
  const { username, password, role } = req.body

  if (!username || !password || !role) {
    res.status(400).json({ error: 'username, password и role обязательны' })
    return
  }

  if (typeof username !== 'string' || username.trim().length < 3) {
    res.status(400).json({ error: 'username должен быть не короче 3 символов' })
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
  const user = await createUser(username.trim(), passwordHash, role)

  req.session.userId = user.id
  req.session.role   = user.role

  res.status(201).json({
    id:         user.id,
    username:   user.username,
    role:       user.role,
    created_at: user.created_at,
  })
}
