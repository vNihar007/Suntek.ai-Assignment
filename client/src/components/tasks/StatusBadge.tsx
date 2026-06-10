import type { TaskStatus } from '../../api/useTasks'

const config: Record<TaskStatus, { label: string; className: string }> = {
  pending:     { label: 'Pending',     className: 'bg-[#D97706]/15 text-[#D97706]' },
  in_progress: { label: 'In Progress', className: 'bg-[#6366F1]/15 text-[#6366F1]' },
  completed:   { label: 'Completed',   className: 'bg-[#10B981]/15 text-[#10B981]' },
}

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
