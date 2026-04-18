import { apiClient } from './axios'
import {
  API_CACHE_TTL_MS,
  sessionApiCacheGet,
  sessionApiCacheSet,
  supportDivisionsLogicalKey,
} from '../utils/sessionApiCache'

export interface Company {
  id: string
  name: string
}

export interface Page {
  id: string
  name: string
}

export interface Division {
  id: string
  name: string
  company_id?: string
}

export const supportApi = {
  getCompanies: async (): Promise<Company[]> => {
    const key = 'support:companies'
    const cached = sessionApiCacheGet<Company[]>(key)
    if (cached) return cached
    const r = await apiClient.get<Company[]>('/companies')
    const rows = Array.isArray(r.data) ? r.data : []
    sessionApiCacheSet(key, rows, API_CACHE_TTL_MS.supportCompanies)
    return rows
  },
  getPages: async (): Promise<Page[]> => {
    const key = 'support:pages'
    const cached = sessionApiCacheGet<Page[]>(key)
    if (cached) return cached
    const r = await apiClient.get<Page[]>('/pages')
    const rows = Array.isArray(r.data) ? r.data : []
    sessionApiCacheSet(key, rows, API_CACHE_TTL_MS.supportPages)
    return rows
  },
  getDivisions: async (companyId?: string): Promise<Division[]> => {
    const key = supportDivisionsLogicalKey(companyId)
    const cached = sessionApiCacheGet<Division[]>(key)
    if (cached) return cached
    const params = companyId ? { company_id: companyId } : {}
    const r = await apiClient.get<Division[]>('/divisions', { params })
    const rows = Array.isArray(r.data) ? r.data : []
    sessionApiCacheSet(key, rows, API_CACHE_TTL_MS.supportDivisions)
    return rows
  },
}
