import { Pencil, Play, Square, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type Task, useDeleteTask, useStartTimer, useStopTimer } from '../../api/useTasks'
import { formatDuration } from '../../lib/utils'
import { useToast } from '../ui/Toast'
import EditTaskModal from './EditTaskModal'
import StatusBadge from './StatusBadge'
import TimerDisplay from '../timer/TimerDisplay'

export default function TaskCard({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false)
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const deleteTask = useDeleteTask()
  const toast = useToast()

  const isRunning = task.activeLog != null

  async function handleStart() {
    try {
      await startTimer.mutateAsync(task._id)
    } catch (err: any) {
      toast(err.response?.data?.error ?? 'Failed to start timer', 'error')
    }
  }

  async function handleStop() {
    await stopTimer.mutateAsync(task._id)
    toast('Timer stopped')
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return
    await deleteTask.mutateAsync(task._id)
    toast('Task deleted')
  }

  return (
    <>
      <div className="group bg-[#1E293B] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-2">
          <Link
            to={`/tasks/${task._id}`}
            className="text-sm font-semibold text-white hover:text-[#D97706] transition-colors line-clamp-1"
          >
            {task.title}
          </Link>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setEditing(true)}
              aria-label="Edit task"
              className="p-1.5 rounded-md text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              aria-label="Delete task"
              className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-all cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-[#64748B] mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            <span className="text-xs text-[#475569] tabular-nums">
              {isRunning
                ? <TimerDisplay startedAt={task.activeLog!.startedAt} />
                : formatDuration(task.totalDuration ?? 0)
              }
            </span>
          </div>

          {isRunning ? (
            <button
              onClick={handleStop}
              disabled={stopTimer.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DC2626]/15 text-[#DC2626]
                hover:bg-[#DC2626]/25 transition-all duration-150 text-xs font-semibold cursor-pointer"
            >
              <Square size={11} fill="currentColor" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={startTimer.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981]
                hover:bg-[#10B981]/25 transition-all duration-150 text-xs font-semibold cursor-pointer"
            >
              <Play size={11} fill="currentColor" />
              Start
            </button>
          )}
        </div>
      </div>

      <EditTaskModal task={task} open={editing} onClose={() => setEditing(false)} />
    </>
  )
}
