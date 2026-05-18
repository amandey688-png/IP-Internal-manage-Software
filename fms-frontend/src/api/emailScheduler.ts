import { apiClient } from './axios'

export type ScheduleType = 'every_minutes' | 'daily' | 'monthly' | 'yearly' | 'custom'

export type EmailJobSchedule = {
  job_key: string
  label: string
  enabled: boolean
  schedule_type: ScheduleType
  interval_minutes?: number | null
  hour: number
  minute: number
  day_of_month?: number | null
  month?: number | null
  cron_expression?: string | null
  timezone: string
  schedule_summary?: string
  updated_at?: string | null
}

export type ScheduleUpdateBody = {
  enabled: boolean
  schedule_type: ScheduleType
  interval_minutes?: number | null
  hour: number
  minute: number
  day_of_month?: number | null
  month?: number | null
  cron_expression?: string | null
  timezone: string
}

export const emailSchedulerApi = {
  listSchedules: () =>
    apiClient.get<{ items: EmailJobSchedule[]; job_keys: string[] }>('/scheduler/schedules').then((r) => r.data),

  updateSchedule: (jobKey: string, body: ScheduleUpdateBody) =>
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
