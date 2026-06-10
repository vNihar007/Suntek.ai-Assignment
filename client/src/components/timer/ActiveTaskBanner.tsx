import { Square } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStopTimer, useTasks } from '../../api/useTasks'
import { useToast } from '../ui/Toast'
import TimerDisplay from './TimerDisplay'

export default function ActiveTaskBanner() {
  const { data: tasks } = useTasks()
  const stopTimer = useStopTimer()
  const toast = useToast()

  const active = tasks?.find((t) => t.activeLog != null)
  if (!active) return null

  async function handleStop() {
    await stopTimer.mutateAsync(active!._id)
    toast('Timer stopped')
  }

  return (
    <div className="mx-6 mt-4 flex items-center justify-between gap-4 bg-[#D97706]/10 border border-[#D97706]/30 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse shrink-0" aria-hidden />
        <Link
          to={`/tasks/${active._id}`}
          className="text-sm font-medium text-white truncate hover:text-[#D97706] transition-colors"
        >
          {active.title}
        </Link>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <TimerDisplay startedAt={active.activeLog!.startedAt} />
        <button
          onClick={handleStop}
          disabled={stopTimer.isPending}
          aria-label="Stop timer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DC2626]/15 text-[#DC2626]
            hover:bg-[#DC2626]/25 transition-all duration-150 text-xs font-semibold cursor-pointer"
        >
          <Square size={12} fill="currentColor" />
          Stop
        </button>
      </div>
    </div>
  )
}
