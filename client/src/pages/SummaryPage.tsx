import { useSummary } from '../api/useSummary'
import SummaryStats from '../components/summary/SummaryStats'
import TaskStatusChart from '../components/summary/TaskStatusChart'
import TimeByTaskChart from '../components/summary/TimeByTaskChart'
import Skeleton from '../components/ui/Skeleton'

export default function SummaryPage() {
  const { data, isLoading, isError } = useSummary()

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return <p className="text-[#94A3B8] text-sm">Failed to load summary.</p>
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Daily Summary</h1>
        <p className="text-sm text-[#64748B]">Your productivity snapshot for today.</p>
      </div>

      <SummaryStats data={data} />

      <div className="grid md:grid-cols-2 gap-4">
        <TimeByTaskChart data={data} />
        <TaskStatusChart data={data} />
      </div>

      {data.tasks.length > 0 && (
        <div className="bg-[#1E293B] rounded-xl p-6 border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-4">Tasks Worked Today</h2>
          <div className="space-y-3" role="list">
            {data.tasks.map((t) => (
              <div key={t.taskId} role="listitem" className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#94A3B8] truncate">{t.title}</span>
                <span className="text-sm font-semibold tabular-nums text-white shrink-0">
                  {Math.floor(t.totalDuration / 60)}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
