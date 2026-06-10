import { ArrowLeft, Play, Square } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStartTimer, useStopTimer, useTask } from '../api/useTasks'
import { useTimeLogs } from '../api/useTimeLogs'
import EditTaskModal from '../components/tasks/EditTaskModal'
import StatusBadge from '../components/tasks/StatusBadge'
import TimerDisplay from '../components/timer/TimerDisplay'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import { useToast } from '../components/ui/Toast'
import { formatDuration } from '../lib/utils'

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: task, isLoading } = useTask(id!)
  const { data: logsData } = useTimeLogs(id!)
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const [editing, setEditing] = useState(false)
  const toast = useToast()

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (!task) return <p className="text-[#94A3B8]">Task not found.</p>

  const isRunning = task.activeLog != null

  async function handleStart() {
    try {
      await startTimer.mutateAsync(task!._id)
    } catch (err: any) {
      toast(err.response?.data?.error ?? 'Failed to start timer', 'error')
    }
  }

  async function handleStop() {
    await stopTimer.mutateAsync(task!._id)
    toast('Timer stopped')
  }

  return (
    <>
      <div className="max-w-2xl space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </Link>

        <div className="bg-[#1E293B] rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white mb-2">{task.title}</h1>
              <StatusBadge status={task.status} />
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          </div>

          {task.description && (
            <p className="text-sm text-[#94A3B8] leading-relaxed">{task.description}</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div>
              <p className="text-xs text-[#475569] mb-0.5">Total time</p>
              <p className="text-lg font-bold tabular-nums text-white">
                {isRunning
                  ? <TimerDisplay startedAt={task.activeLog!.startedAt} />
                  : formatDuration(task.totalDuration ?? 0)
                }
              </p>
            </div>
            {isRunning ? (
              <Button variant="danger" onClick={handleStop} loading={stopTimer.isPending}>
                <Square size={13} fill="currentColor" />
                Stop Timer
              </Button>
            ) : (
              <Button onClick={handleStart} loading={startTimer.isPending}>
                <Play size={13} fill="currentColor" />
                Start Timer
              </Button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-3">Time Log History</h2>
          {!logsData?.logs.length ? (
            <p className="text-sm text-[#475569]">No time logs yet.</p>
          ) : (
            <div className="space-y-2">
              {logsData.logs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-center justify-between bg-[#1E293B] rounded-xl px-4 py-3 border border-white/5"
                >
                  <div className="text-xs text-[#94A3B8]">
                    {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {log.stoppedAt && (
                      <> → {new Date(log.stoppedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-[#D97706]">
                    {log.stoppedAt ? formatDuration(log.duration) : <TimerDisplay startedAt={log.startedAt} />}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {task && <EditTaskModal task={task} open={editing} onClose={() => setEditing(false)} />}
    </>
  )
}
