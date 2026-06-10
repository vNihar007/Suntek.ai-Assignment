import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useCreateTask } from '../../api/useTasks'
import { useToast } from '../ui/Toast'

export default function TaskInput() {
  const [value, setValue] = useState('')
  const createTask = useCreateTask()
  const toast = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    await createTask.mutateAsync(trimmed)
    setValue('')
    toast('Task created with AI enhancement')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1 relative">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. follow up with designer..."
          disabled={createTask.isPending}
          aria-label="New task input"
          className="w-full rounded-xl px-4 py-3 pr-12 text-sm bg-[#1E293B] text-white
            border border-white/10 placeholder:text-[#475569] min-h-[48px]
            transition-colors outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20
            disabled:opacity-60"
        />
        <Sparkles
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D97706]/50"
          aria-hidden
        />
      </div>
      <button
        type="submit"
        disabled={createTask.isPending || !value.trim()}
        className="px-5 py-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold
          transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          disabled:active:scale-100 min-h-[48px]"
      >
        {createTask.isPending ? 'Adding…' : 'Add Task'}
      </button>
    </form>
  )
}
