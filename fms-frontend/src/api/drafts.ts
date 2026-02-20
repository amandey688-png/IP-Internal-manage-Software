import { apiClient } from './axios'
import type { ApiResponse } from './types'

export interface SupportTicketDraftResponse {
  draft_data: Record<string, unknown>
}

export const draftsApi = {
  getSupportTicketDraft: async (): Promise<ApiResponse<SupportTicketDraftResponse>> => {
    const response = await apiClient.get<ApiResponse<SupportTicketDraftResponse>>('/drafts/support-ticket')
    return response.data
  },

  saveSupportTicketDraft: async (draftData: Record<string, unknown>): Promise<ApiResponse<{ ok: boolean }>> => {
    const response = await apiClient.put<ApiResponse<{ ok: boolean }>>('/drafts/support-ticket', { draft_data: draftData })
    return response.data
  },

  deleteSupportTicketDraft: async (): Promise<ApiResponse<{ ok: boolean }>> => {
    const response = await apiClient.delete<ApiResponse<{ ok: boolean }>>('/drafts/support-ticket')
    return response.data
  },
}
