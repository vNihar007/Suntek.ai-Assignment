import { Router } from "express"
import { createTask, deleteTask, getTask, listTasks, updateTask } from "../controllers/taskController"
import { authGuard } from "../middleware/authGaurd"

const router = Router()

router.use(authGuard)

router.get('/',     listTasks)
router.post('/',    createTask)
router.get('/:id',  getTask)
router.patch('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
