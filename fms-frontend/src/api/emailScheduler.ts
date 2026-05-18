import { apiClient } from './axios'

export type EmailJobSchedule = {
  job_key: string
  label: string
  enabled: boolean
  hour: number
  minute: number
  timezone: string
  updated_at?: string | null
}

export const emailSchedulerApi = {
  listSchedules: () =>
    apiClient.get<{ items: EmailJobSchedule[]; job_keys: string[] }>('/scheduler/schedules').then((r) => r.data),

  updateSchedule: (jobKey: string, body: { enabled: boolean; hour: number; minute: number; timezone: string }) =>
    apiClient.put<EmailJobSchedule>(`/scheduler/schedules/${jobKey}`, body).then((r) => r.data),

  tick: (params?: { force?: boolean; job?: string }) =>
    apiClient
      .post<{
        ok: boolean
        jobs: { job_key: string; ran: boolean; email_sent?: boolean; reason?: string; error?: string }[]
        any_email_sent?: boolean
      }>('/scheduler/tick', null, {
        params: { force: params?.force, job: params?.job },
        timeout: 180000,
      })
      .then((r) => r.data),
}
