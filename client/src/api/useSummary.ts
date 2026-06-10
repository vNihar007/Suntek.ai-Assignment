import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'

export interface SummaryTask {
  taskId: string
  title: string
  status: string
  totalDuration: number
}

export interface DailySummary {
  totalDuration: number
  tasksWorked: number
  completedCount: number
  pendingCount: number
  inProgressCount: number
  tasks: SummaryTask[]
}

export function useSummary() {
  return useQuery<DailySummary>({
    queryKey: ['summary'],
    queryFn: async () => {
      const res = await api.get('/api/summary/today')
      return res.data.data
    },
  })
}
