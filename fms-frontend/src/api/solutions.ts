import { apiClient } from './axios'
import type { ApiResponse } from './types'

export interface Solution {
  id: string
  ticket_id: string
  solution_number: 1 | 2
  title: string
  description: string
  proposed_by: string
  proposed_at: string
  is_selected: boolean
  selected_at?: string
  selected_by?: string
  quality_score?: number
  quality_notes?: string
}

export interface CreateSolutionRequest {
  ticket_id: string
  solution_number: 1 | 2
  title: string
  description: string
}

export interface UpdateSolutionRequest {
  title?: string
  description?: string
  is_selected?: boolean
  quality_score?: number
  quality_notes?: string
}

export const solutionsApi = {
  list: async (ticketId: string): Promise<ApiResponse<Solution[]>> => {
    const response = await apiClient.get<ApiResponse<Solution[]>>(
      `/solutions/ticket/${ticketId}`
    )
    return response.data
  },

  create: async (data: CreateSolutionRequest): Promise<ApiResponse<Solution>> => {
    const response = await apiClient.post<ApiResponse<Solution>>('/solutions', data)
    return response.data
  },

  update: async (id: string, data: UpdateSolutionRequest): Promise<ApiResponse<Solution>> => {
    const response = await apiClient.put<ApiResponse<Solution>>(`/solutions/${id}`, data)
    return response.data
  },
}
