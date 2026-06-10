import { Router } from "express";
import { getTimeLogs,startTimer,stopTimer } from "../controllers/timeController";
import { authGuard } from "../middleware/authGaurd";

const router  = Router({mergeParams:true})

router.use(authGuard)

router.post('/start',startTimer)
router.post('/stop',stopTimer)
router.get('/logs',getTimeLogs)

export default router



