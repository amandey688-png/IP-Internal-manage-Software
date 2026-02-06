import { apiClient } from './axios'
import type { ApiResponse, PaginatedResponse } from './types'

export interface StagingTicket {
  id: string
  ticket_id: string
  staging_environment: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back'
  version?: string
  deployment_notes?: string
  deployed_by?: string
  started_at?: string
  completed_at?: string
  rollback_reason?: string
  created_at: string
  updated_at: string
}

export interface CreateStagingRequest {
  ticket_id: string
  staging_environment: string
  version: string
  deployment_notes?: string
}

export interface UpdateStagingRequest {
  status?: StagingTicket['status']
  deployment_notes?: string
  rollback_reason?: string
}

export const stagingApi = {
  list: async (params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<StagingTicket>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<StagingTicket>>>(
      '/staging/deployments',
      { params }
    )
    return response.data
  },

  create: async (data: CreateStagingRequest): Promise<ApiResponse<StagingTicket>> => {
    const response = await apiClient.post<ApiResponse<StagingTicket>>(
      '/staging/deployments',
      data
    )
    return response.data
  },

  update: async (id: string, data: UpdateStagingRequest): Promise<ApiResponse<StagingTicket>> => {
    const response = await apiClient.put<ApiResponse<StagingTicket>>(
      `/staging/deployments/${id}`,
      data
    )
    return response.data
  },
}
