import { apiClient } from './axios'

export const DEPARTMENTS = [
  'Customer Support & Success',
  'Marketing',
  'Accounts & Admin',
  'Internal Development',
] as const

export const FREQUENCY_OPTIONS = [
  { value: 'D', label: 'D - Daily' },
  { value: '2D', label: '2D - Every 2 days' },
  { value: 'W', label: 'W - Weekly' },
  { value: '2W', label: '2W - Every 2 weeks' },
  { value: 'M', label: 'M - Monthly' },
  { value: 'Q', label: 'Q - Quarterly' },
  { value: 'F', label: 'F - Half-yearly' },
  { value: 'Y', label: 'Y - Yearly' },
] as const

export interface ChecklistTask {
  id: string
  task_name: string
  doer_id: string
  doer_name?: string
  department: string
  frequency: string
  start_date: string
  created_by: string
  created_at: string
  reference_no?: string
}

export interface ChecklistOccurrence {
  task_id: string
  task_name: string
  reference_no?: string
  doer_id: string
  doer_name?: string
  department: string
  occurrence_date: string
  completed_at: string | null
}

export const checklistApi = {
  getDepartments: () =>
    apiClient.get<{ departments: string[] }>('/checklist/departments').then((r) => r.data),

  getHolidays: (year: number) =>
    apiClient.get<{ holidays: { holiday_date: string; holiday_name: string }[] }>(`/checklist/holidays?year=${year}`).then((r) => r.data),

  getTasks: (userId?: string, referenceNo?: string) => {
    const params = new URLSearchParams()
    if (userId) params.set('user_id', userId)
    if (referenceNo) params.set('reference_no', referenceNo)
    const q = params.toString()
    return apiClient.get<{ tasks: ChecklistTask[] }>(`/checklist/tasks${q ? `?${q}` : ''}`).then((r) => r.data)
  },

  getOccurrences: (filter: 'today' | 'completed' | 'overdue' | 'upcoming', userId?: string, referenceNo?: string) => {
    const params = new URLSearchParams({ filter })
    if (userId) params.set('user_id', userId)
    if (referenceNo) params.set('reference_no', referenceNo)
    return apiClient.get<{ occurrences: ChecklistOccurrence[] }>(`/checklist/occurrences?${params}`).then((r) => r.data)
  },

  createTask: (data: { task_name: string; department: string; frequency: string; start_date: string }) =>
    apiClient.post<ChecklistTask>('/checklist/tasks', data).then((r) => r.data),

  completeTask: (taskId: string, occurrenceDate: string) =>
    apiClient.post(`/checklist/tasks/${taskId}/complete`, { occurrence_date: occurrenceDate }).then((r) => r.data),

  getUsers: () => apiClient.get<{ users: { id: string; full_name: string }[] }>('/checklist/users').then((r) => r.data),

  uploadHolidays: (year: number, holidays: { holiday_date: string; holiday_name: string }[]) =>
    apiClient.post('/checklist/holidays/upload', { year, holidays }).then((r) => r.data),
}
