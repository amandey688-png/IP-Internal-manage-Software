import { apiClient } from './axios'

export type EscalationReceiver = {
  id: string
  config_id: string
  email: string
  is_enabled: boolean
  created_at: string
}

export type EscalationConfig = {
  id: string
  configuration_type: string
  stage_name: string
  is_enabled: boolean
  last_sent_at: string | null
  receivers: EscalationReceiver[]
}

export type EscalationSendLog = {
  id: string
  configuration_type: string
  recipient: string
  subject: string
  total_pending: number
  status: string
  sent_at: string
  error_message: string | null
  metadata?: Record<string, number>
}

export type EscalationManualTrigger = {
  id: string
  configuration_type: string
  trigger_source: string
  force_bypass: boolean
  result: Record<string, unknown>
  created_at: string
}

export type EscalationStats = {
  timeframe: Record<string, number>
  timeframe_total: number
  critical_total: number
  stages: Record<string, number>
}

export const escalationEmailsApi = {
  ping: () =>
    apiClient.get<{ ok: boolean; routes: string }>('/escalation/ping').then((r) => r.data),

  getConfig: () =>
    apiClient
      .get<{ items: EscalationConfig[]; stats: EscalationStats }>('/escalation/config')
      .then((r) => r.data),

  patchConfig: (configurationType: string, body: { is_enabled?: boolean }) =>
    apiClient
      .patch<EscalationConfig>(`/escalation/config/${configurationType}`, body)
      .then((r) => r.data),

  addReceivers: (configurationType: string, body: { emails?: string[]; bulk?: string }) =>
    apiClient
      .post<{ added: EscalationReceiver[]; count: number }>(
        `/escalation/config/${configurationType}/receivers`,
        body
      )
      .then((r) => r.data),

  patchReceiver: (id: string, body: { is_enabled?: boolean }) =>
    apiClient.patch<EscalationReceiver>(`/escalation/receivers/${id}`, body).then((r) => r.data),

  deleteReceiver: (id: string) =>
    apiClient.delete(`/escalation/receivers/${id}`).then((r) => r.data),

  listLogs: (limit?: number, configurationType?: string) =>
    apiClient
      .get<{ items: EscalationSendLog[] }>('/escalation/logs', {
        params: { limit, configuration_type: configurationType },
      })
      .then((r) => r.data),

  listManualTriggers: (limit?: number) =>
    apiClient
      .get<{ items: EscalationManualTrigger[] }>('/escalation/manual-triggers', { params: { limit } })
      .then((r) => r.data),

  fetchPreviewHtml: (configurationType: string) =>
    apiClient
      .get<string>(`/escalation/preview/${configurationType}`, {
        responseType: 'text',
        transformResponse: [(d) => d],
      })
      .then((r) => r.data),

  testEmail: (configurationType: string, to: string) =>
    apiClient
      .post<{ ok: boolean }>('/escalation/test-email', { configuration_type: configurationType, to })
      .then((r) => r.data),

  forceSend: (configurationType: string) =>
    apiClient
      .post<Record<string, unknown>>(`/escalation/force-send/${configurationType}`)
      .then((r) => r.data),

  retryLog: (logId: string) =>
    apiClient.post<{ ok: boolean }>(`/escalation/retry/${logId}`).then((r) => r.data),
}
