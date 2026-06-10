import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'

export interface TimeLog {
  _id: string
  taskId: string
  startedAt: string
  stoppedAt: string | null
  duration: number
}

export function useTimeLogs(taskId: string) {
  return useQuery<{ logs: TimeLog[]; totalDuration: number }>({
    queryKey: ['timelogs', taskId],
    queryFn: async () => {
      const res = await api.get(`/api/tasks/${taskId}/logs`)
      return res.data.data
    },
  })
}
