import { apiClient } from './axios'

export interface DelegationTask {
  id: string
  title: string
  assignee_id: string
  assignee_name?: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  delegation_on?: string
  submission_date?: string
  has_document?: 'yes' | 'no'
  document_url?: string
  submitted_by?: string
  submitted_by_name?: string
  reference_no?: string
  completed_at?: string
}

export interface CreateDelegationTaskPayload {
  title: string
  assignee_id: string
  due_date: string
  delegation_on?: string
  submission_date?: string
  has_document?: 'yes' | 'no'
  document_url?: string
  submitted_by?: string
}

export const delegationApi = {
  getUsers: () =>
    apiClient.get<{ users: { id: string; full_name: string }[] }>('/delegation/users').then((r) => r.data),

  getTasks: (params?: { status?: string; assignee_id?: string; reference_no?: string }) =>
    apiClient
      .get<{ tasks: DelegationTask[] }>('/delegation/tasks', { params })
      .then((r) => r.data),

  createTask: (data: CreateDelegationTaskPayload) =>
    apiClient.post<DelegationTask>('/delegation/tasks', data).then((r) => r.data),

  updateTask: (taskId: string, data: Partial<Pick<DelegationTask, 'status' | 'title' | 'due_date' | 'assignee_id' | 'delegation_on' | 'submission_date' | 'has_document' | 'document_url' | 'submitted_by' | 'completed_at'>>) =>
    apiClient.put<DelegationTask>(`/delegation/tasks/${taskId}`, data).then((r) => r.data),
}
