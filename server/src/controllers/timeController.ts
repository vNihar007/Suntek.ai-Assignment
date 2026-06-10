import type { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { Task } from '../models/Task'
import { TimeLog } from '../models/TimeLog'

export const startTimer = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
  if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }

  // Only one active timer per user at a time
  const activeLog = await TimeLog.findOne({ userId: req.user.id, stoppedAt: null })
  if (activeLog) {
    res.status(409).json({ success: false, error: 'Another timer is already running. Stop it first.' })
    return
  }

  const log = await TimeLog.create({
    userId:    req.user.id,
    taskId:    task._id,
    startedAt: new Date(),
    stoppedAt: null,
    duration:  0,
  })

  res.status(201).json({ success: true, data: log })
})

export const stopTimer = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
  if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }

  const log = await TimeLog.findOne({ taskId: task._id, userId: req.user.id, stoppedAt: null })
  if (!log) { res.status(404).json({ success: false, error: 'No active timer for this task' }); return }

  const stoppedAt = new Date()
  const duration = Math.floor((stoppedAt.getTime() - log.startedAt.getTime()) / 1000)

  log.stoppedAt = stoppedAt
  log.duration  = duration
  await log.save()

  res.json({ success: true, data: log })
})

export const getTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
  if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }

  const logs = await TimeLog.find({ taskId: task._id, userId: req.user.id }).sort({ startedAt: -1 })
  const totalDuration = logs.reduce((sum, l) => sum + l.duration, 0)

  res.json({ success: true, data: { logs, totalDuration } })
})