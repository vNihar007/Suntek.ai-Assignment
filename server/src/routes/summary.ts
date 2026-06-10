import { Router } from 'express'
import { getTodaySummary } from '../controllers/summaryController'
import { authGuard } from '../middleware/authGaurd'

const router = Router()

router.get('/today', authGuard, getTodaySummary)

export default router
