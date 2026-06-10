import type { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { Task } from '../models/Task'
import { TimeLog } from '../models/TimeLog'

export const getTodaySummary = asyncHandler(async (req: Request, res: Response) => {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const logs = await TimeLog.find({
        userId: req.user.id,
        startedAt: { $gte: todayStart },
    })

    if (!logs.length) {
        res.json({
            success: true,
            data: { totalDuration: 0, tasksWorked: 0, completedCount: 0, pendingCount: 0, inProgressCount: 0, tasks: [] },
        })
        return
    }

    const durationByTask = new Map<string, number>()
    for (const log of logs) {
        const id = log.taskId.toString()
        durationByTask.set(id, (durationByTask.get(id) ?? 0) + log.duration)
    }

    const taskIds = [...durationByTask.keys()]
    const tasks = await Task.find({ _id: { $in: taskIds }, userId: req.user.id })

    const taskSummaries = tasks.map((t) => ({
        taskId:        t._id.toString(),
        title:         t.title,
        status:        t.status,
        totalDuration: durationByTask.get(t._id.toString()) ?? 0,
    }))

    res.json({
        success: true,
        data: {
            totalDuration:  taskSummaries.reduce((s, t) => s + t.totalDuration, 0),
            tasksWorked:    tasks.length,
            completedCount:  tasks.filter((t) => t.status === 'completed').length,
            pendingCount:    tasks.filter((t) => t.status === 'pending').length,
            inProgressCount: tasks.filter((t) => t.status === 'in_progress').length,
            tasks:           taskSummaries,
        },
    })
})
