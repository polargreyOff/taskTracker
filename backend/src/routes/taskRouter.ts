import { Router } from 'express'
import { TaskController } from '../controllers/TaskController'
import { requireAuth, requireRole } from '../middlewares/auth'

const router = Router()

router.get   ('/',    requireAuth,                           TaskController.list)
router.post  ('/',    requireAuth, requireRole('developer'), TaskController.create)
router.patch ('/:id', requireAuth,                           TaskController.update)
router.delete('/:id', requireAuth,                           TaskController.delete)

export default router
