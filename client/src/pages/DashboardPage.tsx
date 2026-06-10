import ActiveTaskBanner from '../components/timer/ActiveTaskBanner'
import TaskInput from '../components/tasks/TaskInput'
import TaskList from '../components/tasks/TaskList'

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-sm text-[#64748B]">Manage your tasks and track time.</p>
      </div>

      <ActiveTaskBanner />
      <TaskInput />
      <TaskList />
    </div>
  )
}
