import { Router } from 'express'
import { TaskController } from '../controllers/TaskController'
import { requireAuth } from '../middlewares/auth'

const router = Router()

router.patch('/:id/status',   requireAuth, TaskController.updateStatus)
router.patch('/:id/assignee', requireAuth, TaskController.assign)

export default router   
