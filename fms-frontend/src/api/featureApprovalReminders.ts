import { apiClient } from './axios'

export type FeatureApprovalRecipient = {
  id: string
  email: string
  name: string
  is_enabled: boolean
  created_at: string
}

export type FeatureApprovalLog = {
  id: string
  recipient: string
  subject: string
  total_pending: number
  status: string
  sent_at: string
  error_message: string | null
}

export type ApprovalPublicUrlConfig = {
  public_api_base: string
  frontend_base: string
  on_render: boolean
  email_links_ok: boolean
  hint: string | null
}

export const featureApprovalRemindersApi = {
  getPublicUrlConfig: () =>
    apiClient.get<ApprovalPublicUrlConfig>('/approval/public-url-config').then((r) => r.data),

  ping: () =>
    apiClient.get<{ ok: boolean; routes: string }>('/feature-approval-reminders/ping').then((r) => r.data),

  listRecipients: () =>
    apiClient.get<{ items: FeatureApprovalRecipient[] }>('/feature-approval-reminders/recipients').then((r) => r.data),

  addRecipient: (email: string, name: string) =>
    apiClient.post<FeatureApprovalRecipient>('/feature-approval-reminders/recipients', { email, name }).then((r) => r.data),

  patchRecipient: (id: string, body: { name?: string; is_enabled?: boolean }) =>
    apiClient.patch<FeatureApprovalRecipient>(`/feature-approval-reminders/recipients/${id}`, body).then((r) => r.data),

  deleteRecipient: (id: string) =>
    apiClient.delete(`/feature-approval-reminders/recipients/${id}`).then((r) => r.data),

  listLogs: (limit?: number) =>
    apiClient
      .get<{ items: FeatureApprovalLog[] }>('/feature-approval-reminders/logs', { params: { limit } })
      .then((r) => r.data),

  testEmail: (to: string) =>
    apiClient
      .post<{ ok: boolean; to: string }>('/feature-approval-reminders/test-email', { to })
      .then((r) => r.data),

  run: (force?: boolean) =>
    apiClient
      .post<Record<string, unknown>>('/feature-approval-reminders/run', { force: !!force })
      .then((r) => r.data),
}
