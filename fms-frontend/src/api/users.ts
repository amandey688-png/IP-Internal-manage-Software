import { apiClient } from './axios'
import type { ApiResponse, PaginatedResponse } from './types'
import type { User } from './types'

export interface UpdateUserRequest {
  full_name?: string
  display_name?: string
  role_id?: string
  is_active?: boolean
}

export interface SectionPermission {
  section_key: string
  can_view: boolean
  can_edit: boolean
}

export interface RoleOption {
  id: string
  name: string
  description?: string
}

export const usersApi = {
  list: async (params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
  }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      '/users',
      { params }
    )
    return response.data
  },

  get: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`)
    return response.data
  },

  update: async (id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data)
    return response.data
  },

  listRoles: async (): Promise<ApiResponse<{ data: RoleOption[] }>> => {
    const response = await apiClient.get<ApiResponse<{ data: RoleOption[] }>>('/roles')
    return response.data
  },

  getSectionPermissions: async (userId: string): Promise<ApiResponse<{ data: SectionPermission[] }>> => {
    const response = await apiClient.get<ApiResponse<{ data: SectionPermission[] }>>(
      `/users/${userId}/section-permissions`
    )
    return response.data
  },

  updateSectionPermissions: async (
    userId: string,
    permissions: SectionPermission[]
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/users/${userId}/section-permissions`,
      { permissions }
    )
    return response.data
  },
}
