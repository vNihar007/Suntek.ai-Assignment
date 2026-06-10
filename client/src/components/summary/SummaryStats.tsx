import { CheckCircle, Clock, ListTodo, Zap } from 'lucide-react'
import type { DailySummary } from '../../api/useSummary'
import { formatDuration } from '../../lib/utils'

const statConfig = [
  { key: 'totalDuration', label: 'Total Time',      icon: Clock,       color: '#D97706', format: (v: number) => formatDuration(v) },
  { key: 'tasksWorked',   label: 'Tasks Worked',    icon: ListTodo,    color: '#6366F1', format: (v: number) => String(v) },
  { key: 'completedCount',label: 'Completed',        icon: CheckCircle, color: '#10B981', format: (v: number) => String(v) },
  { key: 'inProgressCount',label: 'In Progress',    icon: Zap,         color: '#F59E0B', format: (v: number) => String(v) },
] as const

export default function SummaryStats({ data }: { data: DailySummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map(({ key, label, icon: Icon, color, format }) => (
        <div key={key} className="bg-[#1E293B] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <span className="text-xs text-[#64748B] font-medium">{label}</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {format(data[key])}
          </p>
        </div>
      ))}
    </div>
  )
}
