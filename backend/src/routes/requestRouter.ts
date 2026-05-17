import { Router } from 'express'
import { RequestController } from '../controllers/RequestController'
import { requireAuth, requireRole } from '../middlewares/auth'

const router = Router()

router.get ('/my', requireAuth, requireRole('client'), RequestController.listMy)
router.get ('/',   requireAuth,                        RequestController.listByTeam)
router.post('/',   requireAuth, requireRole('client'), RequestController.createRequest)

export default router