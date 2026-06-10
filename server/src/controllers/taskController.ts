import type { Request, Response } from "express"
import { z } from 'zod'
import { TimeLog } from '../models/TimeLog'
import { Task } from "../models/Task"
import { asyncHandler } from "../middleware/asyncHandler"

const createSchema = z.object({ rawInput: z.string().min(1).max(500) })
const updateSchema = z.object({
    title:       z.string().min(1).max(500).optional(),
    description: z.string().max(1000).optional(),
    status:      z.enum(['pending', 'in_progress', 'completed']).optional(),
})

async function enrichTask(task: InstanceType<typeof Task>, userId: string) {
    const logs = await TimeLog.find({ taskId: task._id, userId })
    const totalDuration = logs.reduce((sum, l) => sum + l.duration, 0)
    const activeLog = logs.find((l) => l.stoppedAt === null) ?? null
    return {
        ...task.toObject(),
        totalDuration,
        activeLog: activeLog ? { _id: activeLog._id, startedAt: activeLog.startedAt } : null,
    }
}

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 })
    const enriched = await Promise.all(tasks.map((t) => enrichTask(t, req.user.id)))
    res.json({ success: true, data: enriched })
})

export const getTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
    if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }
    res.json({ success: true, data: await enrichTask(task, req.user.id) })
})

export const createTask = asyncHandler(async (req: Request, res: Response) => {
    const { rawInput } = createSchema.parse(req.body)

    let title = rawInput
    let description = ''
    try {
        const { enhanceTask } = await import('../lib/groq')
        const result = await enhanceTask(rawInput)
        title = result.title
        description = result.description
    } catch {
        // Groq failed — use raw input, task still created
    }

    const task = await Task.create({ userId: req.user.id, title, description, rawInput })
    res.status(201).json({ success: true, data: await enrichTask(task, req.user.id) })
})

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
    const data = updateSchema.parse(req.body)
    const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { $set: data },
        { new: true }
    )
    if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }
    res.json({ success: true, data: await enrichTask(task, req.user.id) })
})

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }
    await TimeLog.deleteMany({ taskId: task._id })
    res.json({ success: true, data: null })
})
