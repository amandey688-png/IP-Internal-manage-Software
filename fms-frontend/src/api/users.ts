import { apiClient } from './axios'
import type { ApiResponse, PaginatedResponse } from './types'
import type { User } from './types'
import {
  API_CACHE_TTL_MS,
  genericLogicalKey,
  sessionApiCacheClearLogicalPrefix,
  sessionApiCacheGet,
  sessionApiCacheSet,
} from '../utils/sessionApiCache'

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
    const key = genericLogicalKey('users:list', params)
    const cached = sessionApiCacheGet<ApiResponse<PaginatedResponse<User>>>(key)
    if (cached) return cached
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      '/users',
      { params }
    )
    sessionApiCacheSet(key, response.data, API_CACHE_TTL_MS.usersList)
    return response.data
  },

  get: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`)
    return response.data
  },

  update: async (id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data)
    sessionApiCacheClearLogicalPrefix('users:list:')
    return response.data
  },

  /** Backend returns `{ data: RoleOption[] }` — return the inner array. */
  listRoles: async (): Promise<RoleOption[]> => {
    const key = 'users:roles'
    const cached = sessionApiCacheGet<RoleOption[]>(key)
    if (cached) return cached
    const response = await apiClient.get<{ data: RoleOption[] }>('/roles')
    const data = response.data?.data ?? []
    sessionApiCacheSet(key, data, API_CACHE_TTL_MS.usersRoles)
    return data
  },

  /** Backend returns `{ data: SectionPermission[] }` — return the inner array. */
  getSectionPermissions: async (userId: string): Promise<SectionPermission[]> => {
    const response = await apiClient.get<{ data: SectionPermission[] }>(
      `/users/${userId}/section-permissions`
    )
    return response.data?.data ?? []
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
