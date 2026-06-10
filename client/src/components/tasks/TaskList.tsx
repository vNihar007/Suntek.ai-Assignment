import { ClipboardList } from 'lucide-react'
import { useTasks } from '../../api/useTasks'
import { TaskCardSkeleton } from '../ui/Skeleton'
import TaskCard from './TaskCard'

export default function TaskList() {
  const { data: tasks, isLoading, isError } = useTasks()

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <TaskCardSkeleton key={i} />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-[#94A3B8] text-sm">
        Failed to load tasks. Please refresh.
      </div>
    )
  }

  if (!tasks?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1E293B] flex items-center justify-center">
          <ClipboardList size={24} className="text-[#475569]" />
        </div>
        <div>
          <p className="text-white font-medium mb-1">No tasks yet</p>
          <p className="text-sm text-[#64748B]">Add your first task using the input above.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task._id} task={task} />
      ))}
    </div>
  )
}
