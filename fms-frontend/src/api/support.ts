import { apiClient } from './axios'

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
    const r = await apiClient.get<Company[]>('/companies')
    return Array.isArray(r.data) ? r.data : []
  },
  getPages: async (): Promise<Page[]> => {
    const r = await apiClient.get<Page[]>('/pages')
    return Array.isArray(r.data) ? r.data : []
  },
  getDivisions: async (companyId?: string): Promise<Division[]> => {
    const params = companyId ? { company_id: companyId } : {}
    const r = await apiClient.get<Division[]>('/divisions', { params })
    return Array.isArray(r.data) ? r.data : []
  },
}
