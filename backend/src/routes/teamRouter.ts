import { Router } from 'express'
import { TeamController } from '../controllers/TeamController'
import { requireAuth, requireRole } from '../middlewares/auth'

const router = Router()

router.post  ('/',                          requireAuth, requireRole('client'), TeamController.create)
router.get   ('/my',                        requireAuth,                        TeamController.getMy)
router.post  ('/:teamId/members',           requireAuth, requireRole('client'), TeamController.addMember)
router.delete('/:teamId/members/:userId',   requireAuth, requireRole('client'), TeamController.removeMember)

export default router
