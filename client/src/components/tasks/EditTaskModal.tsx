import { useEffect, useState } from 'react'
import { type Task, type TaskStatus, useUpdateTask } from '../../api/useTasks'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import { useToast } from '../ui/Toast'

const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed']
const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function EditTaskModal({ task, open, onClose }: {
  task: Task
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const updateTask = useUpdateTask()
  const toast = useToast()

  useEffect(() => {
    if (open) {
      setTitle(task.title)
      setDescription(task.description)
      setStatus(task.status)
    }
  }, [open, task])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await updateTask.mutateAsync({ id: task._id, title, description, status })
    toast('Task updated')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#94A3B8]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg px-4 py-2.5 text-sm bg-[#0F172A] text-white
              border border-white/10 placeholder:text-[#475569] resize-none
              transition-colors outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#94A3B8]">Status</label>
          <div className="flex gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                  status === s
                    ? s === 'pending' ? 'bg-[#D97706]/20 border-[#D97706]/50 text-[#D97706]'
                      : s === 'in_progress' ? 'bg-[#6366F1]/20 border-[#6366F1]/50 text-[#6366F1]'
                      : 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]'
                    : 'border-white/10 text-[#475569] hover:border-white/20'
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={updateTask.isPending} className="flex-1">Save</Button>
        </div>
      </form>
    </Modal>
  )
}
