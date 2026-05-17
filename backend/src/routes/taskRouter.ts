import { Router } from 'express'
import { TaskController } from '../controllers/TaskController'
import { requireAuth } from '../middlewares/auth'

const router = Router()

router.get  ('/',    requireAuth, TaskController.list)
router.patch('/:id', requireAuth, TaskController.update)

export default router
