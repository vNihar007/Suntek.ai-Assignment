import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface Task {
  _id: string
  title: string
  description: string
  rawInput: string
  status: TaskStatus
  totalDuration?: number
  activeLog?: { _id: string; startedAt: string } | null
  createdAt: string
}

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/api/tasks')
      return res.data.data
    },
  })
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const res = await api.get(`/api/tasks/${id}`)
      return res.data.data
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rawInput: string) => {
      const res = await api.post('/api/tasks', { rawInput })
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string; status?: TaskStatus }) => {
      const res = await api.patch(`/api/tasks/${id}`, data)
      return res.data.data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks', vars.id] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/tasks/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useStartTimer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/tasks/${id}/start`)
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
    },
  })
}

export function useStopTimer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/tasks/${id}/stop`)
      return res.data.data
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks', id] })
      qc.invalidateQueries({ queryKey: ['summary'] })
    },
  })
}
