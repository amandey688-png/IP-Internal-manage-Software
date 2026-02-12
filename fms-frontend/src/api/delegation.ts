import { apiClient } from './axios'

export interface DelegationTask {
  id: string
  title: string
  assignee_id: string
  assignee_name?: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
}

export const delegationApi = {
  getUsers: () =>
    apiClient.get<{ users: { id: string; full_name: string }[] }>('/delegation/users').then((r) => r.data),

  getTasks: (params?: { status?: string; assignee_id?: string }) =>
    apiClient
      .get<{ tasks: DelegationTask[] }>('/delegation/tasks', { params })
      .then((r) => r.data),

  createTask: (data: { title: string; assignee_id: string; due_date: string }) =>
    apiClient.post<DelegationTask>('/delegation/tasks', data).then((r) => r.data),

  updateTask: (taskId: string, data: Partial<{ status: string; title: string; due_date: string; assignee_id: string }>) =>
    apiClient.put<DelegationTask>(`/delegation/tasks/${taskId}`, data).then((r) => r.data),
}
