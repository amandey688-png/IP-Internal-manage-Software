import { apiClient } from './axios'

export interface ApprovalSettings {
  approval_emails: string
}

export const approvalApi = {
  getSettings: async (): Promise<ApprovalSettings> => {
    const res = await apiClient.get<ApprovalSettings>('/approval-settings')
    return res.data
  },
  updateSettings: async (approval_emails: string): Promise<{ message: string }> => {
    const res = await apiClient.put<{ message: string }>('/approval-settings', {
      approval_emails,
    })
    return res.data
  },
}
